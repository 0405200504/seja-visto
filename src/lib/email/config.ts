import "server-only";

/**
 * Identidade do remetente e configuração do transporte de e-mail.
 *
 * Um único lugar decide QUEM assina os e-mails do MPO. Antes isso estava
 * espalhado em três arquivos, cada um com um `process.env.X ?? "fallback"`
 * diferente — e o fallback era um Gmail pessoal.
 *
 * Nenhuma senha aparece aqui: as credenciais são lidas do ambiente na hora
 * do envio e nunca entram em log, retorno de função ou tela do admin.
 */

/** Remetente oficial. É o padrão quando EMAIL_FROM não está configurado. */
export const REMETENTE_NOME = "MPO | Manual Prático do Outfit";
export const REMETENTE_EMAIL = "suporte@manualpraticodooutfit.com.br";

/** Endereço que o aluno usa para pedir ajuda (e para onde as respostas vão). */
export const SUPORTE_EMAIL = REMETENTE_EMAIL;

/** Domínio que precisa aparecer no "De:" para a entrega ser confiável. */
export const DOMINIO_OFICIAL = "manualpraticodooutfit.com.br";

/**
 * Provedores de e-mail gratuito. Um endereço destes não pode assinar os
 * e-mails da plataforma: quebra a expectativa do cliente, não tem SPF/DKIM
 * do domínio e é exatamente o que o filtro de spam pune.
 */
const DOMINIOS_PESSOAIS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "yahoo.com.br",
  "bol.com.br",
  "uol.com.br",
  "icloud.com",
]);

export type Remetente = { nome: string; email: string };

/** Extrai o domínio de um endereço, em minúsculas. */
export function dominioDe(endereco: string): string {
  return endereco.trim().toLowerCase().split("@")[1] ?? "";
}

/**
 * Interpreta o formato `Nome <email@dominio>` (ou só `email@dominio`).
 * Devolve null se não houver um endereço reconhecível.
 */
export function parseRemetente(valor: string | undefined | null): Remetente | null {
  if (!valor) return null;
  const texto = valor.trim();
  const comNome = /^\s*(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/.exec(texto);
  if (comNome) {
    const nome = comNome[1].replace(/^["']|["']$/g, "").trim();
    return { nome: nome || REMETENTE_NOME, email: comNome[2].toLowerCase() };
  }
  if (/^[^<>\s]+@[^<>\s]+$/.test(texto)) {
    return { nome: REMETENTE_NOME, email: texto.toLowerCase() };
  }
  return null;
}

/**
 * Remetente efetivo dos e-mails.
 *
 * EMAIL_FROM pode trocar o endereço (mudança de domínio no futuro), mas
 * NUNCA para um e-mail pessoal: se alguém apontar a variável de volta para
 * um @gmail.com, o valor é descartado e o remetente oficial prevalece.
 */
export function remetente(): Remetente {
  const doAmbiente = parseRemetente(process.env.EMAIL_FROM);
  if (!doAmbiente) return { nome: REMETENTE_NOME, email: REMETENTE_EMAIL };

  if (DOMINIOS_PESSOAIS.has(dominioDe(doAmbiente.email))) {
    console.warn(
      `[email] EMAIL_FROM aponta para um e-mail pessoal (${dominioDe(doAmbiente.email)}). ` +
        `Ignorando e usando ${REMETENTE_EMAIL}. Corrija a variável na Vercel.`
    );
    return { nome: REMETENTE_NOME, email: REMETENTE_EMAIL };
  }
  return doAmbiente;
}

/** Endereço para onde vão as respostas do cliente. */
export function replyTo(): string {
  const doAmbiente = process.env.EMAIL_REPLY_TO?.trim().toLowerCase();
  if (doAmbiente && /^[^<>\s]+@[^<>\s]+$/.test(doAmbiente) && !DOMINIOS_PESSOAIS.has(dominioDe(doAmbiente))) {
    return doAmbiente;
  }
  return SUPORTE_EMAIL;
}

/**
 * Monta o cabeçalho `De:`.
 *
 * Nome com acento precisa de RFC 2047 (=?UTF-8?B?...?=) — sem isso alguns
 * servidores exibem "Manual PrÃ¡tico". Nome só-ASCII vai entre aspas porque
 * o nosso tem "|", que é aceito, mas aspas evitam qualquer surpresa.
 */
export function cabecalhoDe({ nome, email }: Remetente = remetente()): string {
  if (!nome) return email;
  const ascii = /^[\x20-\x7E]*$/.test(nome);
  if (ascii) return `"${nome.replace(/"/g, "'")}" <${email}>`;
  const b64 = Buffer.from(nome, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?= <${email}>`;
}

export type ConfigSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  senha: string;
};

/**
 * Configuração SMTP, quando existir.
 *
 * Aceita as variáveis genéricas SMTP_* (qualquer provedor: Google Workspace,
 * Zoho, Titan, Locaweb, SES…) e ainda entende o par GMAIL_USER/
 * GMAIL_APP_PASSWORD que o projeto usava antes — assim uma conta do
 * Workspace no domínio próprio continua funcionando sem reconfiguração.
 */
export function configSmtp(): ConfigSmtp | null {
  const user = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
  // O Google mostra a senha de app em blocos de 4; espaço colado atrapalha.
  const senha = (process.env.SMTP_PASSWORD ?? process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, "");
  if (!user || !senha) return null;

  const host = process.env.SMTP_HOST?.trim() || (process.env.GMAIL_USER ? "smtp.gmail.com" : "");
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureEnv ? secureEnv === "true" || secureEnv === "1" || secureEnv === "ssl" : port === 465;

  return { host, port, secure, user, senha };
}

export type Diagnostico =
  | { pronto: true; via: "smtp" | "resend"; detalhe: string }
  | { pronto: false; via: null; detalhe: string };

/**
 * Diz se dá para enviar e-mail agora, sem revelar credencial.
 *
 * A regra dura: o usuário que autentica no SMTP precisa ser do MESMO
 * domínio que aparece no "De:". Autenticar com um Gmail pessoal e exibir o
 * domínio profissional é o cenário clássico de e-mail que cai em spam (o
 * SPF do domínio não autoriza o servidor do Gmail a falar por ele) — e é
 * justamente o que este projeto fazia antes.
 */
export function diagnosticoRemetente(): Diagnostico {
  const de = remetente();
  const smtp = configSmtp();
  const smtpValido = !!smtp && dominioDe(smtp.user) === dominioDe(de.email);

  // Caminho principal.
  if (process.env.RESEND_API_KEY) {
    const reserva = smtpValido
      ? `Reserva ativa: SMTP ${smtp!.host} como ${smtp!.user}.`
      : smtp
        ? `Sem reserva: o SMTP cadastrado autentica como ${smtp.user}, que não é do domínio de ${de.email}.`
        : "Sem reserva de SMTP — se o Resend recusar (limite diário, indisponibilidade), o e-mail não sai.";
    return { pronto: true, via: "resend", detalhe: `Enviando pelo Resend como ${de.email}. ${reserva}` };
  }

  // Sem Resend, o SMTP do domínio assume.
  if (smtpValido) {
    return {
      pronto: true,
      via: "smtp",
      detalhe: `Sem RESEND_API_KEY. Enviando por SMTP ${smtp!.host}:${smtp!.port} como ${smtp!.user}.`,
    };
  }

  if (smtp) {
    return {
      pronto: false,
      via: null,
      detalhe:
        `SMTP configurado com ${smtp.user}, que não é do domínio de ${de.email}. ` +
        `Um e-mail assinado por um domínio e enviado por outro cai em spam — por isso ` +
        `está bloqueado. Configure SMTP_* do domínio ou cadastre RESEND_API_KEY.`,
    };
  }

  return {
    pronto: false,
    via: null,
    detalhe:
      "Nenhum meio de envio configurado. Cadastre RESEND_API_KEY ou SMTP_HOST/" +
      "SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_SECURE.",
  };
}
