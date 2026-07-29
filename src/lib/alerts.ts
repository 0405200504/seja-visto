/**
 * Alerta operacional para o administrador.
 *
 * Usa os canais que o projeto já tem configurados (WhatsApp via UAZAPI e
 * e-mail via Resend). Nunca lança exceção: um alerta que falha não pode
 * derrubar a liberação de acesso de um cliente que acabou de pagar.
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

  await Promise.allSettled([enviarWhatsApp(texto), enviarEmail(prefixo, mensagem)]);
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

async function enviarEmail(assunto: string, corpo: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.ADMIN_EMAIL ?? process.env.EMAIL_REPLY_TO;
  if (!apiKey || !destino) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "MPO Alertas <onboarding@resend.dev>",
        to: [destino],
        subject: assunto,
        text: corpo,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // idem
  }
}
