"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checarRateLimit, ipDoServerAction } from "@/lib/rate-limit";

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

/** Senha fraca é a porta de entrada mais barata para invadir uma conta. */
function validarSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return "Use pelo menos uma letra e um número na senha.";
  }
  const fracas = ["12345678", "senha123", "password", "123456789", "qwerty123"];
  if (fracas.includes(senha.toLowerCase())) {
    return "Essa senha é fácil demais de adivinhar. Escolha outra.";
  }
  return null;
}

function siteUrl(path: string): string | undefined {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  return base ? `${base}${path}` : undefined;
}

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
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

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
    (await checarRateLimit(`reset:${email.toLowerCase()}`, 1, 300, { falharFechado: true }));

  if (!podeEnviar) {
    return { success: RESET_ENVIADO };
  }

  /* Erro do provedor também devolve sucesso: "não foi possível enviar" só
   * acontece para e-mail inexistente em algumas configurações, e vira o
   * mesmo oráculo de enumeração que fechamos no cadastro. */
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl("/auth/callback?next=/nova-senha"),
  });

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
