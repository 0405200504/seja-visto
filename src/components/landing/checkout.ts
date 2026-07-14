// ============================================================
// LINKS DE CHECKOUT — COLE AQUI OS LINKS REAIS DA CAKTO
// Enquanto estiverem vazios, os botões levam para a seção de planos.
// Exemplo: export const ANNUAL_CHECKOUT_URL = "https://pay.cakto.com.br/xxxxx";
// ============================================================

export const ANNUAL_CHECKOUT_URL = "";
export const MONTHLY_CHECKOUT_URL = "";

/** Resolve o destino de um CTA: checkout real quando existir, senão a seção de planos. */
export function checkoutHref(url: string): string {
  return url || "#planos";
}
