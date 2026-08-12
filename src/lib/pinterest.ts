declare global {
  interface Window {
    pintrk?: (...args: unknown[]) => void;
  }
}

/**
 * Identificador único do evento. O Pinterest usa ele pra não contar a mesma
 * conversão duas vezes (por exemplo se um dia a gente também mandar o evento
 * pelo servidor). Cada disparo precisa do seu — id fixo faz o Pinterest
 * descartar tudo menos o primeiro.
 */
function novoEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Visita de página. É diferente do `pintrk('page')` do snippet: aquele é a
 * contagem básica de tráfego, este é o evento que dá pra usar como conversão
 * e pra montar público de retargeting no painel de anúncios.
 */
export function pinterestPageVisit(): void {
  window.pintrk?.("track", "pagevisit", { event_id: novoEventId() });
}

/**
 * Ida para o checkout.
 *
 * Dispara no clique do botão de compra, e não no pagamento aprovado, porque o
 * pagamento acontece dentro da Cakto — outro domínio, onde a nossa tag não
 * roda. Ou seja: este número conta quem foi para o checkout, e vai ser maior
 * que a venda de fato. É de propósito, é o que dá volume pro Pinterest otimizar.
 *
 * @param valor Preço cheio do produto em reais.
 */
export function pinterestCheckout(valor: number, quantidade = 1): void {
  window.pintrk?.("track", "checkout", {
    event_id: novoEventId(),
    value: valor,
    order_quantity: quantidade,
    currency: "BRL",
  });
}
