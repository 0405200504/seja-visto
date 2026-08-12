// ============================================================
// LINKS DE CHECKOUT — COLE AQUI OS LINKS REAIS DA CAKTO
// Enquanto estiverem vazios, os botões levam para a seção de planos.
// Exemplo: export const ANNUAL_CHECKOUT_URL = "https://pay.cakto.com.br/xxxxx";
// ============================================================

export const ANNUAL_CHECKOUT_URL = "https://pay.cakto.com.br/3dmtwv7";
export const MONTHLY_CHECKOUT_URL = "https://pay.cakto.com.br/zkkrorx_973168";

/** Preços em reais — usados no valor da conversão mandada pro Pinterest. */
export const ANNUAL_PRICE = 204;
export const MONTHLY_PRICE = 27;

// ============================================================
// PACOTES DE TOKENS DO FIT CHECK — COLE OS LINKS DA CAKTO
// 200 tokens por R$97 (oferta principal) · 50 tokens por R$27 (oferta de saída).
// Lembre de mapear cada produto em /admin/vendas para o entitlement
// "tokens-200" e "tokens-50" para o webhook creditar as imagens.
// ============================================================
export const TOKENS_200_CHECKOUT_URL = "https://pay.cakto.com.br/397p8mc";
export const TOKENS_50_CHECKOUT_URL = "https://pay.cakto.com.br/38doary";

export const TOKENS_200_PRICE = 97;
export const TOKENS_50_PRICE = 27;

/** Resolve o destino de um CTA: checkout real quando existir, senão a seção de planos. */
export function checkoutHref(url: string): string {
  return url || "#planos";
}
