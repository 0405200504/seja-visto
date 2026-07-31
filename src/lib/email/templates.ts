import "server-only";
import { SUPORTE_EMAIL } from "./config";

/**
 * Modelos dos e-mails transacionais.
 *
 * Cada função devolve `{ assunto, html, texto }`. A versão em texto não é
 * enfeite: é o que aparece quando o cliente bloqueia HTML (Gmail com imagens
 * desativadas, Outlook corporativo, relógio, leitor de tela) e é também um
 * sinal positivo de reputação — e-mail só-HTML pesa contra na filtragem.
 *
 * Layout: 600px, fundo cinza-claro, cartão branco, uma única chamada para
 * ação. Sem emoji, sem imagem grande, sem linguagem de urgência.
 */

const LARGURA = 600;
const FONTE = "Arial, Helvetica, 'Segoe UI', sans-serif";
const COR_FUNDO = "#f1f3f6";
const COR_CARTAO = "#ffffff";
const COR_BORDA = "#e2e6ec";
const COR_TEXTO = "#1a1d23";
const COR_MUTED = "#5c677a";
const COR_BOTAO = "#2f6bff";

export type EmailPronto = { assunto: string; html: string; texto: string };

/** Escapa o que veio de fora (nome do comprador, link) antes de virar HTML. */
export function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Primeiro nome, para o e-mail não parecer um formulário. */
export function primeiroNome(nome: string): string {
  const limpo = nome.trim().split(/\s+/)[0] ?? "";
  return limpo || "aluno";
}

/**
 * Moldura comum: fundo cinza, cartão branco de 600px, logo pequena no topo
 * e rodapé discreto. Tabelas em vez de flex/grid porque o Outlook ainda
 * renderiza com o motor do Word.
 */
function moldura({
  conteudo,
  siteUrl,
  preheader,
}: {
  conteudo: string;
  siteUrl: string;
  preheader: string;
}): string {
  const logo = `${siteUrl.replace(/\/$/, "")}/logo-mpo-192.png`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>MPO — Manual Prático do Outfit</title>
</head>
<body style="margin:0;padding:0;background:${COR_FUNDO};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COR_FUNDO};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="${LARGURA}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${LARGURA}px;background:${COR_CARTAO};border:1px solid ${COR_BORDA};border-radius:12px;">
        <tr>
          <td style="padding:28px 32px 8px 32px;font-family:${FONTE};">
            <img src="${esc(logo)}" width="40" height="40" alt="MPO" style="display:block;border:0;border-radius:8px;">
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 32px 32px;font-family:${FONTE};color:${COR_TEXTO};">
${conteudo}
          </td>
        </tr>
      </table>
      <table role="presentation" width="${LARGURA}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${LARGURA}px;">
        <tr>
          <td style="padding:16px 32px 8px 32px;font-family:${FONTE};font-size:12px;line-height:1.6;color:${COR_MUTED};">
            MPO — Manual Prático do Outfit<br>
            Você recebeu este e-mail porque comprou o Manual Prático do Outfit.<br>
            Dúvidas: ${esc(SUPORTE_EMAIL)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Botão único, centralizado, que continua clicável no Outlook. */
function botao(href: string, rotulo: string): string {
  return `            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 4px 0;">
              <tr>
                <td align="center" bgcolor="${COR_BOTAO}" style="border-radius:8px;">
                  <a href="${esc(href)}" style="display:block;padding:16px 24px;font-family:${FONTE};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(rotulo)}</a>
                </td>
              </tr>
            </table>`;
}

const P = `margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${COR_TEXTO};`;
const P_MUTED = `margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${COR_MUTED};`;

/**
 * E-mail de acesso — o que sai depois do pagamento confirmado.
 * `linkAcesso` é o link de uso único gerado pelo Supabase.
 */
export function emailAcessoLiberado({
  nome,
  email,
  linkAcesso,
  siteUrl,
}: {
  nome: string;
  email: string;
  linkAcesso: string;
  siteUrl: string;
}): EmailPronto {
  const assunto = "Seu acesso ao MPO está liberado";
  const site = siteUrl.replace(/\/$/, "");
  const primeiro = primeiroNome(nome);
  const rotulo = "CRIAR MINHA SENHA E ACESSAR O MPO";

  const html = moldura({
    siteUrl: site,
    preheader: "Seu pagamento foi confirmado. Crie sua senha para entrar na plataforma.",
    conteudo: `            <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:${COR_TEXTO};">Seu acesso ao MPO está liberado</h1>
            <p style="${P}">Olá, ${esc(primeiro)}!</p>
            <p style="${P}">Seu pagamento foi confirmado e seu acesso ao MPO — Manual Prático do Outfit já está liberado.</p>
            <p style="${P}">Para entrar na plataforma, clique no botão abaixo e crie sua senha:</p>
${botao(linkAcesso, rotulo)}
            <p style="${P}"><strong>E-mail de acesso:</strong> ${esc(email)}</p>
            <p style="${P_MUTED}">Por segurança, esse link é individual e ficará disponível por tempo limitado. Caso ele expire, você poderá solicitar um novo link na página de login.</p>
            <p style="${P_MUTED}">Link da plataforma: <a href="${esc(site)}" style="color:${COR_BOTAO};">${esc(site)}</a></p>
            <p style="${P_MUTED}">Caso tenha qualquer dificuldade para entrar, responda este e-mail ou entre em contato pelo ${esc(SUPORTE_EMAIL)}.</p>
            <p style="${P}">Seja bem-vindo ao MPO!</p>
            <p style="${P_MUTED}">Equipe MPO<br>Manual Prático do Outfit</p>`,
  });

  const texto = `Olá, ${primeiro}!

Seu pagamento foi confirmado e seu acesso ao MPO — Manual Prático do Outfit já está liberado.

Para entrar na plataforma, acesse o link abaixo e crie sua senha:

${rotulo}
${linkAcesso}

E-mail de acesso: ${email}

Por segurança, esse link é individual e ficará disponível por tempo limitado. Caso ele expire, você poderá solicitar um novo link na página de login.

Link da plataforma:
${site}

Caso tenha qualquer dificuldade para entrar, responda este e-mail ou entre em contato pelo ${SUPORTE_EMAIL}.

Seja bem-vindo ao MPO!

Equipe MPO
Manual Prático do Outfit`;

  return { assunto, html, texto };
}

/** Aviso de bônus liberado para quem já tem conta. */
export function emailBonusLiberado({
  nome,
  bonus,
  siteUrl,
}: {
  nome: string;
  bonus: string;
  siteUrl: string;
}): EmailPronto {
  const site = siteUrl.replace(/\/$/, "");
  const primeiro = primeiroNome(nome);
  const link = `${site}/bonus`;

  const html = moldura({
    siteUrl: site,
    preheader: "Seu bônus já está desbloqueado na sua conta.",
    conteudo: `            <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;color:${COR_TEXTO};">Seu bônus está liberado</h1>
            <p style="${P}">Olá, ${esc(primeiro)}!</p>
            <p style="${P}">Seu pagamento foi confirmado e o bônus <strong>${esc(bonus)}</strong> já está desbloqueado na sua conta do MPO.</p>
${botao(link, "VER MEUS BÔNUS")}
            <p style="${P_MUTED}">Entre com o e-mail que você usou na compra. Caso tenha qualquer dificuldade, responda este e-mail ou escreva para ${esc(SUPORTE_EMAIL)}.</p>
            <p style="${P_MUTED}">Equipe MPO<br>Manual Prático do Outfit</p>`,
  });

  const texto = `Olá, ${primeiro}!

Seu pagamento foi confirmado e o bônus ${bonus} já está desbloqueado na sua conta do MPO.

Ver meus bônus:
${link}

Entre com o e-mail que você usou na compra. Caso tenha qualquer dificuldade, responda este e-mail ou escreva para ${SUPORTE_EMAIL}.

Equipe MPO
Manual Prático do Outfit`;

  return { assunto: "Seu bônus do MPO está liberado", html, texto };
}

/**
 * E-mail de teste. Usa a mesma moldura e o mesmo remetente do e-mail de
 * acesso, com um link falso — serve para conferir remetente, reply-to,
 * layout no celular e SPF/DKIM/DMARC sem envolver um cliente real.
 */
export function emailTeste({ siteUrl, para }: { siteUrl: string; para: string }): EmailPronto {
  const base = emailAcessoLiberado({
    nome: "Teste",
    email: para,
    linkAcesso: `${siteUrl.replace(/\/$/, "")}/login`,
    siteUrl,
  });
  return {
    assunto: `[TESTE] ${base.assunto}`,
    html: base.html,
    texto: `Este é um envio de teste do MPO. O botão abaixo aponta para a tela de login, não para um link de senha real.\n\n${base.texto}`,
  };
}
