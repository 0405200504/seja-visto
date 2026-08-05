"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checarRateLimit, ipDoServerAction } from "@/lib/rate-limit";
import { enviarEmailDeRecuperacao } from "@/lib/email/acesso";
import { validarSenha } from "@/lib/senha";
import { urlDoSite } from "@/lib/site-url";

export type AuthState = { error?: string; success?: string };

/**
 * Resposta única para qualquer falha de login.
 *
 * Precisa ser literalmente a mesma string em todos os casos — "e-mail não
 * existe", "senha errada", "conta não confirmada". Qualquer diferença entre
 * elas transforma o formulário num verificador de quais e-mails têm conta
 * aqui, que é o primeiro passo de um ataque de senha em massa.
 */
const FALHA_LOGIN = "E-mail ou senha incorretos. Verifique e tente novamente.";

/** Mesma resposta com ou sem conta no e-mail informado. */
const RESET_ENVIADO = "Enviamos um link de recuperação para o seu e-mail.";
const CADASTRO_ENVIADO = "Conta criada! Confira seu e-mail para confirmar o cadastro.";

const siteUrl = urlDoSite;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  /* Duas travas, e as duas precisam existir. A de e-mail contém o ataque
   * contra UMA conta; a de IP contém o credential stuffing, em que o
   * atacante testa uma senha em milhares de e-mails diferentes e nunca
   * repete o e-mail — passando invisível por um limite só por e-mail.
   * Ambas falham FECHADO: sem poder contar, recusar é mais seguro. */
  const ip = await ipDoServerAction();
  const dentroDoLimite =
    (await checarRateLimit(`login-ip:${ip}`, 10, 600, { falharFechado: true })) &&
    (!email || (await checarRateLimit(`login:${email}`, 8, 600, { falharFechado: true })));

  if (!dentroDoLimite) {
    return {
      error: "Muitas tentativas de login. Espera 10 minutos e tenta de novo.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    return { error: FALHA_LOGIN };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Informe seu nome." };
  const senhaInvalida = validarSenha(password);
  if (senhaInvalida) return { error: senhaInvalida };

  /* Limite por IP é o que segura criação em massa de contas. O limite por
   * e-mail não segura nada aqui: cada conta nova usa um e-mail novo, então
   * o bucket nunca repete. Falha FECHADO — cada conta criada nasce com
   * créditos grátis de IA, logo cadastro em massa é prejuízo direto. */
  const ip = await ipDoServerAction();
  if (!(await checarRateLimit(`signup-ip:${ip}`, 3, 3600, { falharFechado: true }))) {
    return { error: "Muitas tentativas de cadastro. Tenta de novo mais tarde." };
  }
  if (email && !(await checarRateLimit(`signup:${email.toLowerCase()}`, 5, 3600))) {
    return { error: "Muitas tentativas de cadastro. Tenta de novo mais tarde." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: siteUrl("/auth/callback"),
    },
  });

  if (error) {
    /* E-mail já cadastrado devolve a MESMA mensagem de sucesso de um
     * cadastro novo. Dizer "este e-mail já está cadastrado" entrega de
     * graça a lista de quem é cliente: basta um script com uma lista de
     * e-mails para descobrir quem tem conta, e daí partir para o ataque
     * de senha ou para o golpe se passando por nós. Quem já tem conta e
     * cair aqui recebe o e-mail do Supabase e segue pelo "esqueci a senha". */
    if (error.message.toLowerCase().includes("already registered")) {
      return { success: CADASTRO_ENVIADO };
    }
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  // Sem confirmação de e-mail obrigatória, a sessão já vem ativa.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return { success: CADASTRO_ENVIADO };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) return { error: "Informe seu e-mail." };

  /* Duas travas contra mail bombing. A de e-mail protege a caixa de entrada
   * de um aluno específico; a de IP impede que um script use o nosso domínio
   * para bombardear centenas de endereços — o que queima a reputação de
   * envio e derruba a entrega do e-mail de acesso de quem pagou.
   *
   * Ao estourar, devolve SUCESSO, não erro: um "limite atingido" contaria ao
   * atacante que aquele e-mail existe. */
  const ip = await ipDoServerAction();
  const podeEnviar =
    (await checarRateLimit(`reset-ip:${ip}`, 3, 3600, { falharFechado: true })) &&
    (await checarRateLimit(`reset:${email}`, 1, 300, { falharFechado: true }));

  if (!podeEnviar) {
    return { success: RESET_ENVIADO };
  }

  /* E-mail sem conta também devolve sucesso, e sem nem tentar enviar: dizer
   * "não achei esse e-mail" vira o mesmo oráculo de enumeração que fechamos
   * no cadastro. O mesmo vale para qualquer erro do provedor. */
  try {
    const db = createAdminClient();
    const { data: perfil } = await db
      .from("users_profile")
      .select("user_id, name, email")
      .ilike("email", email)
      .maybeSingle<{ user_id: string; name: string | null; email: string | null }>();

    if (perfil?.user_id) {
      const envio = await enviarEmailDeRecuperacao(db, {
        userId: perfil.user_id,
        email: perfil.email ?? email,
        nome: perfil.name,
      });
      if (!envio.enviado) {
        console.error("[reset] e-mail de recuperação não saiu:", envio.motivo);
      }
    }
  } catch (err) {
    console.error("[reset] falha inesperada:", err);
  }

  return { success: RESET_ENVIADO };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  const senhaInvalida = validarSenha(password);
  if (senhaInvalida) return { error: senhaInvalida };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a senha. Tente novamente." };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
