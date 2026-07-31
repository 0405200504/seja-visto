import "server-only";
import { enviarEmail } from "@/lib/email/mailer";
/**
 * Alerta operacional para o administrador.
 *
 * Usa os canais que o projeto já tem configurados (WhatsApp via UAZAPI e
 * e-mail pelo transporte de lib/email/mailer). Nunca lança exceção: um
 * alerta que falha não pode derrubar a liberação de acesso de um cliente
 * que acabou de pagar.
 */

type Severidade = "aviso" | "critico";

function jaAvisado(chave: string): boolean {
  const agora = Date.now();
  const ultimo = memoria.get(chave) ?? 0;
  if (agora - ultimo < 10 * 60 * 1000) return true; // 10 min de silêncio
  memoria.set(chave, agora);
  return false;
}

// Anti-flood por instância. Não é perfeito com várias instâncias na Vercel,
// mas evita 200 mensagens iguais quando algo quebra em série.
const memoria = new Map<string, number>();

export async function alertaAdmin(
  mensagem: string,
  { severidade = "aviso", chave }: { severidade?: Severidade; chave?: string } = {}
): Promise<void> {
  const prefixo = severidade === "critico" ? "🚨 MPO" : "⚠️ MPO";
  const texto = `${prefixo}: ${mensagem}`;

  console.error("[alerta]", texto);

  if (chave && jaAvisado(chave)) return;

  await Promise.allSettled([enviarWhatsApp(texto), enviarEmailDeAlerta(prefixo, mensagem)]);
}

async function enviarWhatsApp(texto: string): Promise<void> {
  const apiUrl = process.env.UAZAPI_URL;
  const token = process.env.UAZAPI_TOKEN;
  const numero = process.env.ADMIN_WHATSAPP;
  if (!apiUrl || !token || !numero) return;

  try {
    await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ number: numero.replace(/\D/g, ""), text: texto }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // silencioso de propósito — alerta não pode quebrar o fluxo principal
  }
}

async function enviarEmailDeAlerta(assunto: string, corpo: string): Promise<void> {
  const destino = process.env.ADMIN_EMAIL ?? process.env.EMAIL_REPLY_TO;
  if (!destino) return;

  try {
    // Mesmo remetente dos e-mails do aluno (ver lib/email/config.ts): um só
    // domínio assinando tudo, em vez do "onboarding@resend.dev" de antes.
    await enviarEmail({
      para: destino,
      assunto,
      texto: corpo,
      html: `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${corpo
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</p>`,
    });
  } catch {
    // idem
  }
}
