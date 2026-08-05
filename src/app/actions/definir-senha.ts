"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checarRateLimit, ipDoServerAction } from "@/lib/rate-limit";
import {
  consumirToken,
  invalidarLinksPendentes,
  LINK_USADO,
  mensagemDoMotivo,
  verificarToken,
} from "@/lib/links-acesso";
import { validarSenha } from "@/lib/senha";
import type { AuthState } from "./auth";

/**
 * Define a senha a partir do link enviado por e-mail.
 *
 * Diferente da tela antiga (/nova-senha), aqui NADA depende de sessão, de
 * cookie de PKCE ou de fragmento de URL: o direito de trocar a senha está
 * no token do link, conferido no servidor. É por isso que esta tela abre
 * no celular quando o link foi pedido no computador — o caso em que a
 * antiga simplesmente devolvia a pessoa para o login sem explicar nada.
 */

export async function definirSenhaComToken(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const senha = String(formData.get("password") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  /* Trava por IP. O token tem 256 bits e não se adivinha, mas o limite
   * impede que alguém use esta rota como sonda de tokens vazados e, de
   * quebra, contém tentativa automatizada. Falha FECHADO. */
  const ip = await ipDoServerAction();
  if (!(await checarRateLimit(`definir-senha-ip:${ip}`, 20, 3600, { falharFechado: true }))) {
    return { error: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo." };
  }

  const senhaInvalida = validarSenha(senha);
  if (senhaInvalida) return { error: senhaInvalida };
  if (confirmacao !== senha) return { error: "As duas senhas precisam ser iguais." };

  const db = createAdminClient();

  const conferencia = await verificarToken(db, token);
  if (!conferencia.ok) return { error: mensagemDoMotivo(conferencia.motivo) };

  // Gasta o link ANTES de trocar a senha: quem chegar depois com o mesmo
  // link (inclusive o pré-carregador do provedor de e-mail) não passa.
  if (!(await consumirToken(db, token))) return { error: LINK_USADO };

  const { error } = await db.auth.admin.updateUserById(conferencia.userId, {
    password: senha,
    // A conta criada pelo admin/webhook já nasce confirmada; isto só
    // garante que ninguém fique preso em "e-mail não confirmado".
    email_confirm: true,
  });

  if (error) {
    console.error("[definir-senha] updateUserById falhou:", error.message);
    return {
      error: "Não consegui salvar a senha agora. Tente de novo em instantes ou fale com o suporte.",
    };
  }

  // Os outros links que ainda estivessem na caixa de entrada morrem aqui.
  await invalidarLinksPendentes(db, conferencia.userId);

  /* Entra direto: a pessoa acabou de provar que é dona do e-mail e acabou
   * de escolher a senha. Mandar para o login agora seria pedir a mesma
   * senha duas vezes seguidas. */
  const supabase = await createClient();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email: conferencia.email,
    password: senha,
  });

  if (erroLogin) {
    console.error("[definir-senha] senha salva, mas o login automático falhou:", erroLogin.message);
    return {
      success: "Senha criada. Agora é só entrar com ela na tela de login.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
