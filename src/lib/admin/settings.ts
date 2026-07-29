import { createAdminClient } from "@/lib/supabase/admin";

/** Leitura/escrita tipada da tabela app_settings. */

export type FitCheckSettings = {
  model: string;
  max_output_tokens: number;
  free_credits: number;
  daily_text_limit: number;
  /** instruções extras anexadas ao prompt padrão */
  prompt_extra: string;
  /** se preenchido, SUBSTITUI o prompt do sistema inteiro */
  system_prompt_override: string;
  /** custo estimado por 1.000 tokens, em centavos de R$ (para o KPI de custo) */
  token_price_per_1k_cents: number;
  /**
   * Teto de gasto do mês, em reais. Ao estourar, o Fit Check para de
   * atender e avisa você — em vez de queimar o cartão em silêncio.
   * 0 desliga a trava (não recomendado).
   */
  monthly_budget_reais: number;
};

export const FIT_CHECK_DEFAULTS: FitCheckSettings = {
  model: "gpt-5.5",
  max_output_tokens: 1500,
  free_credits: 5,
  /**
   * Mensagem de texto é grátis para o aluno mas custa para você: cada uma
   * carrega o índice da plataforma (~10 mil tokens de entrada).
   * No gpt-5.5 isso dá ~R$ 0,31 por mensagem, e o plano mensal rende
   * R$ 24,51 líquidos — ou seja, o ponto de virada fica em ~2,6 mensagens
   * por dia. Com 60/dia, um único aluno consumia mais de R$ 500 no mês.
   */
  daily_text_limit: 8,
  prompt_extra: "",
  system_prompt_override: "",
  token_price_per_1k_cents: 3,
  monthly_budget_reais: 300,
};

/** Preço do modelo, em dólar por milhão de tokens. */
export const PRECO_MODELO: Record<string, { entrada: number; saida: number }> = {
  "gpt-5.5": { entrada: 5.0, saida: 30.0 },
  "gpt-5": { entrada: 1.25, saida: 10.0 },
  "gpt-5-mini": { entrada: 0.25, saida: 2.0 },
  "gpt-5-nano": { entrada: 0.05, saida: 0.4 },
  "gpt-4o": { entrada: 2.5, saida: 10.0 },
  "gpt-4o-mini": { entrada: 0.15, saida: 0.6 },
};

/** Câmbio usado nas estimativas de custo do painel. */
export const USD_BRL = 5.5;

/** Custo em centavos de real de uma chamada, pelo modelo configurado. */
export function custoChamadaCents(
  modelo: string,
  tokensEntrada: number,
  tokensSaida: number
): number {
  const p = PRECO_MODELO[modelo] ?? PRECO_MODELO["gpt-5.5"];
  const usd = (tokensEntrada / 1_000_000) * p.entrada + (tokensSaida / 1_000_000) * p.saida;
  return Math.round(usd * USD_BRL * 100);
}

export type GatewaySettings = {
  /** taxa percentual usada quando o método de pagamento não está na tabela */
  fee_percent: number;
  /** taxa fixa em centavos somada por transação */
  fee_fixed_cents: number;
};

/**
 * Taxas reais do plano da Cakto, por método de pagamento.
 * Fonte: painel da Cakto → Planos e Taxas (conferido em 29/07/2026).
 *
 * A taxa fixa de R$ 2,49 incide em TODOS os métodos — é ela que pesa nos
 * produtos baratos: num bônus de R$ 17 ela sozinha come 14,6% da venda.
 */
export type TaxaMetodo = {
  /** percentual sobre o valor da venda */
  percent: number;
  /** taxa fixa em centavos */
  fixed_cents: number;
  /** dias até o dinheiro cair na conta */
  days: number;
  label: string;
};

export const CAKTO_FEES: Record<string, TaxaMetodo> = {
  pix:            { percent: 0,    fixed_cents: 249, days: 1,  label: "Pix" },
  boleto:         { percent: 4.99, fixed_cents: 249, days: 2,  label: "Boleto" },
  credit_card:    { percent: 4.99, fixed_cents: 249, days: 15, label: "Cartão de crédito" },
  pix_parcelado:  { percent: 6.99, fixed_cents: 249, days: 7,  label: "Pix parcelado" },
  picpay:         { percent: 6.99, fixed_cents: 249, days: 15, label: "PicPay" },
  pix_automatico: { percent: 8.99, fixed_cents: 249, days: 7,  label: "Pix automático" },
  applepay:       { percent: 8.99, fixed_cents: 249, days: 30, label: "Apple Pay" },
  googlepay:      { percent: 8.99, fixed_cents: 249, days: 30, label: "Google Pay" },
};

/** Cobrada por cima do cartão quando a autenticação 3DS está ativa. */
export const TAXA_3DS_PERCENT = 3.99;

/** Nomes que a Cakto pode mandar no webhook para o mesmo método. */
const APELIDOS: Record<string, string> = {
  pix: "pix",
  creditcard: "credit_card",
  credit_card: "credit_card",
  cartao: "credit_card",
  card: "credit_card",
  boleto: "boleto",
  bank_slip: "boleto",
  picpay: "picpay",
  apple_pay: "applepay",
  applepay: "applepay",
  google_pay: "googlepay",
  googlepay: "googlepay",
  pix_automatico: "pix_automatico",
  pix_auto: "pix_automatico",
  pix_parcelado: "pix_parcelado",
  pix_installments: "pix_parcelado",
};

/**
 * Estima a taxa da Cakto para uma venda. Use só quando o webhook NÃO
 * informar a taxa real — quando informar, o valor dela é que vale.
 */
export function estimarTaxaCakto(
  amountCents: number,
  paymentMethod: string,
  fallback: GatewaySettings = GATEWAY_DEFAULTS
): number {
  const chave = APELIDOS[paymentMethod?.toLowerCase().trim()] ?? paymentMethod?.toLowerCase().trim();
  const taxa = CAKTO_FEES[chave];

  if (!taxa) {
    // Método desconhecido: usa o fallback configurável do admin.
    return Math.round((amountCents * fallback.fee_percent) / 100) + fallback.fee_fixed_cents;
  }
  return Math.round((amountCents * taxa.percent) / 100) + taxa.fixed_cents;
}

/**
 * Fallback para método que não está na tabela. 8,99% é a maior taxa do
 * plano, então erra para menos no lucro — nunca para mais.
 */
export const GATEWAY_DEFAULTS: GatewaySettings = { fee_percent: 8.99, fee_fixed_cents: 249 };

export type TagsSettings = { tags: { name: string; color: string }[] };

export const TAG_COLORS = ["#2f6bff", "#2fbf71", "#e5a83b", "#e5484d", "#9a6bff", "#3bb5e5"];

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = createAdminClient();
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  return { ...fallback, ...(data.value as Partial<T>) };
}

export async function setSetting(key: string, value: unknown, updatedBy?: string) {
  const db = createAdminClient();
  const { error } = await db
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy ?? null });
  if (error) throw new Error(error.message);
}
