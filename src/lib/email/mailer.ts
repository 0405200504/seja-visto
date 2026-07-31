import "server-only";
import nodemailer from "nodemailer";
import { cabecalhoDe, configSmtp, dominioDe, remetente, replyTo } from "./config";

/**
 * Transporte de e-mail: Resend como caminho principal, SMTP do domínio como
 * reserva. Quem chama não precisa saber qual dos dois respondeu.
 *
 * A ordem é decisão de operação (2026-07-31): o domínio está verificado no
 * Resend, que entrega bem e dá log de cada envio. O SMTP entra quando o
 * Resend recusa — inclusive quando ele recusa por limite diário do plano,
 * que é o risco real em dia de lançamento.
 *
 * Duas regras que o código antigo não tinha:
 *  1. o remetente é sempre o do domínio oficial (ver ./config);
 *  2. um erro de envio NUNCA vira "enviado". O chamador recebe
 *     { enviado: false, motivo } e decide se alerta, se registra ou se
 *     tenta de novo — nada aqui é silenciado.
 */

export type ResultadoEnvio = {
  enviado: boolean;
  via?: "smtp" | "resend";
  motivo?: string;
};

export type Mensagem = {
  para: string;
  assunto: string;
  html: string;
  texto: string;
};

/**
 * Tira do texto do erro qualquer coisa que pareça credencial antes de ele
 * ir para o log ou para o banco. Um erro de SMTP às vezes ecoa o comando
 * que falhou — incluindo o AUTH em base64.
 */
export function sanitizarErro(bruto: unknown): string {
  const texto = bruto instanceof Error ? bruto.message : String(bruto);
  const segredos = [
    process.env.SMTP_PASSWORD,
    process.env.GMAIL_APP_PASSWORD,
    process.env.RESEND_API_KEY,
  ].filter((v): v is string => typeof v === "string" && v.length >= 6);

  let limpo = texto;
  for (const s of segredos) {
    limpo = limpo.split(s).join("[redigido]");
    limpo = limpo.split(s.replace(/\s+/g, "")).join("[redigido]");
  }
  return limpo
    .replace(/AUTH\s+(PLAIN|LOGIN)\s+\S+/gi, "AUTH $1 [redigido]")
    .replace(/\b(re_[A-Za-z0-9]{6,})\b/g, "[redigido]")
    .replace(/(password|senha|pass|token|authorization)["'\s:=]+\S+/gi, "$1=[redigido]")
    .slice(0, 400);
}

/** Envia pelo SMTP do domínio. Devolve motivo em vez de lançar. */
async function enviarPorSmtp(msg: Mensagem): Promise<ResultadoEnvio> {
  const smtp = configSmtp();
  if (!smtp) return { enviado: false, motivo: "SMTP não configurado" };

  const de = remetente();
  /* Trava de entregabilidade: quem autentica precisa ser do domínio que
   * assina. Ver a explicação em config.ts → diagnosticoRemetente(). */
  if (dominioDe(smtp.user) !== dominioDe(de.email)) {
    return {
      enviado: false,
      motivo:
        `SMTP_USER (${smtp.user}) não é do domínio do remetente (${de.email}); ` +
        `envio bloqueado para não cair em spam`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.senha },
      // Sem isto, uma indisponibilidade do provedor segura o webhook da
      // Cakto até o timeout da Vercel.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.sendMail({
      from: { name: de.nome, address: de.email },
      // envelope explícito: o MAIL FROM é o mesmo endereço do cabeçalho,
      // que é o que o SPF do domínio autoriza.
      envelope: { from: de.email, to: msg.para },
      to: msg.para,
      replyTo: replyTo(),
      subject: msg.assunto,
      text: msg.texto,
      html: msg.html,
    });
    return { enviado: true, via: "smtp" };
  } catch (err) {
    return { enviado: false, motivo: `SMTP: ${sanitizarErro(err)}` };
  }
}

/** Envia pela API do Resend. Exige o domínio verificado lá. */
async function enviarPorResend(msg: Mensagem): Promise<ResultadoEnvio> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { enviado: false, motivo: "RESEND_API_KEY ausente" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cabecalhoDe(),
        to: [msg.para],
        reply_to: replyTo(),
        subject: msg.assunto,
        html: msg.html,
        text: msg.texto,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const corpo = await res.text().catch(() => "");
      return { enviado: false, motivo: `Resend ${res.status}: ${sanitizarErro(corpo)}` };
    }
    return { enviado: true, via: "resend" };
  } catch (err) {
    return { enviado: false, motivo: `Resend: ${sanitizarErro(err)}` };
  }
}

/**
 * Envia pelo Resend; se ele recusar (limite do plano, indisponibilidade,
 * chave errada), cai para o SMTP do domínio.
 */
export async function enviarEmail(msg: Mensagem): Promise<ResultadoEnvio> {
  const porResend = await enviarPorResend(msg);
  if (porResend.enviado) return porResend;

  const porSmtp = await enviarPorSmtp(msg);
  if (porSmtp.enviado) {
    console.warn("[email] Resend recusou, entregue pela reserva SMTP:", porResend.motivo);
    return porSmtp;
  }

  return {
    enviado: false,
    motivo: [porResend.motivo, porSmtp.motivo].filter(Boolean).join(" · "),
  };
}
