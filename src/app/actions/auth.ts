"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checarRateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string; success?: string };

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

  // Trava contra tentativa em massa de senha. Falha FECHADO: se não dá para
  // contar as tentativas, é melhor recusar do que deixar o ataque correr solto.
  if (email && !(await checarRateLimit(`login:${email}`, 8, 600, { falharFechado: true }))) {
    return {
      error: "Muitas tentativas de login. Espera 10 minutos e tenta de novo.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    return { error: "E-mail ou senha incorretos. Verifique e tente novamente." };
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

  // Limita criação de contas por IP indiretamente, pelo e-mail tentado.
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
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Este e-mail já está cadastrado. Faça login." };
    }
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  // Sem confirmação de e-mail obrigatória, a sessão já vem ativa.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    success: "Conta criada! Confira seu e-mail para confirmar o cadastro.",
  };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: "Informe seu e-mail." };

  // Sem limite, dá para inundar a caixa de entrada de qualquer pessoa e
  // estourar a cota de envio do provedor de e-mail.
  if (!(await checarRateLimit(`reset:${email.toLowerCase()}`, 3, 900))) {
    return { success: "Enviamos um link de recuperação para o seu e-mail." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl("/auth/callback?next=/nova-senha"),
  });

  if (error) return { error: "Não foi possível enviar o e-mail. Tente novamente." };

  return { success: "Enviamos um link de recuperação para o seu e-mail." };
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
