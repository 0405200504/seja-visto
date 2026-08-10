import "server-only";
import { primeiroNome } from "./phone";
import { configWhatsApp } from "./config";

/**
 * Textos das mensagens.
 *
 * Regras que valem para TODAS:
 *  · identificam o MPO logo na primeira linha;
 *  · dizem que são automáticas quando não é óbvio;
 *  · correspondem a um estágio real do cliente — nada de variação
 *    aleatória para "parecer humano" ou escapar de detecção;
 *  · sem emoji, sem urgência falsa, sem promoção fora do MPO.
 */

export const ASSINATURA = "MPO — Manual Prático do Outfit";

/** Todo tipo de mensagem que a automação pode agendar. */
export const TIPOS = [
  "cart_recovery_1",
  "cart_recovery_2",
  "cart_recovery_3",
  "monthly_renewal_reminder",
  "monthly_payment_failed",
  "monthly_payment_pending",
  "monthly_access_suspended",
  "annual_renewal_15_days",
  "annual_renewal_3_days",
  "annual_payment_failed",
  "annual_payment_pending",
  "annual_access_suspended",
  "renewal_payment_confirmed",
  "inactivity_nudge",
] as const;

export type TipoMensagem = (typeof TIPOS)[number];

export type Plano = "mensal" | "anual" | "outro";

/** R$ 27,00 — sempre a partir de centavos, nunca de string solta. */
export function brl(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataBR(iso: string | Date | null | undefined): string {
  if (!iso) return "breve";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "breve" : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/**
 * "plano mensal" / "plano anual", como o texto pede.
 * Nunca chama de mensal um plano anual parcelado — ver valorDoPlano.
 */
export function nomeDoPlano(plano: Plano): string {
  return plano === "mensal" ? "plano mensal" : plano === "anual" ? "plano anual" : "assinatura do MPO";
}

/**
 * Valor formatado por periodicidade.
 *
 * O parcelamento só é mencionado quando ele existe de verdade no
 * checkout (parcelas >= 2). Assinatura anual parcelada continua sendo
 * anual: a frase deixa isso explícito para não confundir com mensalidade.
 */
export function valorDoPlano(plano: Plano, centavos: number, parcelas?: number | null): string {
  if (plano === "mensal") return `${brl(centavos)} por mês`;
  if (plano === "anual") {
    const base = `${brl(centavos)} por ano`;
    if (parcelas && parcelas >= 2) {
      return `${base}, com possibilidade de pagamento em ${parcelas} parcelas de ${brl(Math.round(centavos / parcelas))}`;
    }
    return base;
  }
  return brl(centavos);
}

export type DadosCarrinho = {
  nome: string | null;
  plano: Plano;
  amountCents: number;
  parcelas?: number | null;
  checkoutUrl: string;
};

export type DadosAssinatura = {
  nome: string | null;
  plano: "mensal" | "anual";
  amountCents: number;
  proximaCobranca?: string | Date | null;
};

/* ---------------- Carrinho abandonado ---------------- */

export function textoCarrinho(tipo: "cart_recovery_1" | "cart_recovery_2" | "cart_recovery_3", d: DadosCarrinho): string {
  const nome = primeiroNome(d.nome);

  if (tipo === "cart_recovery_1") {
    return `Olá, ${nome}! Aqui é do ${ASSINATURA}.

Percebemos que você iniciou sua assinatura, mas o pagamento não foi concluído.

Caso tenha acontecido algum problema durante a compra, você pode continuar pelo link abaixo:

${d.checkoutUrl}

Se tiver alguma dúvida antes de concluir, é só responder esta mensagem.`;
  }

  if (tipo === "cart_recovery_2") {
    return `Olá, ${nome}!

Seu acesso ao MPO ainda não foi concluído porque identificamos que o pagamento ficou pendente.

Você escolheu o ${nomeDoPlano(d.plano)}, no valor de ${valorDoPlano(d.plano, d.amountCents, d.parcelas)}.

Para continuar sua assinatura, acesse:

${d.checkoutUrl}

Caso não queira mais receber mensagens sobre essa compra, responda "PARAR".`;
  }

  return `Olá, ${nome}!

Este é nosso último lembrete sobre a assinatura do MPO que você iniciou.

Se ainda quiser concluir e liberar seu acesso, utilize o link:

${d.checkoutUrl}

Plano escolhido: ${nomeDoPlano(d.plano)}
Valor: ${valorDoPlano(d.plano, d.amountCents, d.parcelas)}

Se você já concluiu o pagamento por outro link, desconsidere esta mensagem.`;
}

/* ---------------- Renovação ---------------- */

export function textoRenovacao(tipo: TipoMensagem, d: DadosAssinatura): string {
  const cfg = configWhatsApp();
  const nome = primeiroNome(d.nome);
  const valor = brl(d.amountCents);
  const data = dataBR(d.proximaCobranca);
  const portal = cfg.linkRenovar;

  switch (tipo) {
    case "monthly_renewal_reminder":
      return `Olá, ${nome}!

Passando para lembrar que a renovação mensal da sua assinatura do MPO está prevista para ${data}.

Valor da mensalidade: ${valor}

Seus dados e sua assinatura podem ser consultados aqui:

${portal}

Caso esteja tudo certo, não é necessário fazer nada.`;

    case "monthly_payment_failed":
      return `Olá, ${nome}!

Não conseguimos confirmar a renovação mensal da sua assinatura do MPO.

Valor pendente: ${valor}

Para atualizar a forma de pagamento e manter seu acesso ativo, utilize o link seguro abaixo:

${portal}

Se você já atualizou ou concluiu o pagamento, desconsidere esta mensagem.`;

    case "monthly_payment_pending":
      return `Olá, ${nome}!

A renovação mensal do seu acesso ao MPO continua pendente.

Para evitar a interrupção da assinatura, atualize o pagamento por aqui:

${portal}

Valor da mensalidade: ${valor}

Caso precise de ajuda, responda esta mensagem.`;

    case "monthly_access_suspended":
      return `Olá, ${nome}.

Como a renovação mensal da sua assinatura não foi concluída, seu acesso ao MPO foi temporariamente suspenso.

Você pode regularizar a assinatura pelo link abaixo:

${portal}

Assim que o pagamento for confirmado, o acesso deverá ser reativado automaticamente.`;

    case "annual_renewal_15_days":
      return `Olá, ${nome}!

Sua assinatura anual do MPO será renovada em ${data}.

Valor da renovação anual: ${valor}

Você pode consultar ou atualizar os dados da assinatura aqui:

${portal}

Caso esteja tudo certo, não é necessário fazer nada.`;

    case "annual_renewal_3_days":
      return `Olá, ${nome}!

Lembrando que a renovação anual da sua assinatura do MPO está programada para ${data}.

Valor: ${valor}

Para consultar sua assinatura ou atualizar a forma de pagamento, acesse:

${portal}`;

    case "annual_payment_failed":
      return `Olá, ${nome}!

Não conseguimos confirmar a renovação anual da sua assinatura do MPO.

Valor pendente: ${valor}

Para atualizar a forma de pagamento e continuar com seu acesso, utilize:

${portal}

Se você já resolveu o pagamento, desconsidere esta mensagem.`;

    case "annual_payment_pending":
      return `Olá, ${nome}!

A renovação anual da sua assinatura do MPO continua pendente.

Para manter o acesso à plataforma, regularize o pagamento por aqui:

${portal}

Caso precise de ajuda, responda esta mensagem.`;

    case "annual_access_suspended":
      return `Olá, ${nome}.

Como a renovação anual da sua assinatura do MPO não foi concluída, seu acesso foi temporariamente suspenso.

Para reativar sua assinatura, acesse:

${portal}

O acesso deverá ser liberado novamente após a confirmação do pagamento.`;

    case "renewal_payment_confirmed":
      return `Olá, ${nome}!

A renovação ${d.plano} da sua assinatura do MPO foi confirmada com sucesso.

Seu acesso permanece ativo.

Próxima renovação: ${data}

Obrigado por continuar com o MPO!`;

    default:
      throw new Error(`tipo de mensagem sem texto: ${tipo}`);
  }
}

/* ---------------- Inatividade ---------------- */

/**
 * Lembrete de quem parou de abrir o app.
 *
 * É uma mensagem de aluno ATIVO, não de venda: nenhum link de checkout,
 * nenhuma cobrança, nenhum prazo inventado. Só o convite de voltar.
 *
 * Curta de propósito, sem o rodapé de opt-out que as mensagens de
 * carrinho trazem — decisão do Luis em 10/08/2026. Responder "PARAR"
 * continua desligando tudo (lib/whatsapp/respostas.ts): o que sai é o
 * aviso na mensagem, não o mecanismo.
 */
export function textoInatividade(d: { nome: string | null }): string {
  const cfg = configWhatsApp();

  return `Olá, ${primeiroNome(d.nome)}! Aqui é do ${ASSINATURA}.

Vi que faz alguns dias que você não abre a plataforma. Seu acesso continua ativo e está tudo lá, do jeito que você deixou.

Se quiser retomar de onde parou, é só entrar:

${cfg.linkApp}`;
}

/* ---------------- Respostas automáticas ---------------- */

export const RESPOSTA_PARAR = `Tudo certo. Não enviaremos novas mensagens promocionais para este número.

Avisos estritamente necessários sobre uma assinatura ativa poderão ser enviados apenas quando forem indispensáveis para informar sobre pagamento, acesso, segurança ou alterações no serviço.`;

export const RESPOSTA_JA_PAGUEI = `Obrigado por avisar!

Vamos verificar a confirmação do pagamento. Assim que ele for identificado pelo sistema, sua assinatura será atualizada automaticamente.

Se o pagamento não aparecer após o prazo do meio utilizado, nosso suporte poderá ajudar você.`;

export function respostaQueroCancelar(): string {
  const cfg = configWhatsApp();
  return `Entendido. Para cuidar do cancelamento da sua assinatura com segurança, acesse:

${cfg.linkCancelamento}

Caso prefira, responda esta mensagem com sua dúvida para receber ajuda do suporte.`;
}
