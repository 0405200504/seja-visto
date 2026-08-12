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
 * Identificador do "pedido". O Pinterest usa ele pra não contar a mesma compra
 * duas vezes — então ele é fixo por visita e por produto: quem clica duas vezes
 * no mesmo botão conta uma conversão só, e não duas.
 */
function orderId(valor: number): string {
  const CHAVE = "mpo_pintrk_visita";
  try {
    let visita = sessionStorage.getItem(CHAVE);
    if (!visita) {
      visita = novoEventId();
      sessionStorage.setItem(CHAVE, visita);
    }
    return `${visita}-${valor}`;
  } catch {
    // Aba anônima ou storage bloqueado: sem memória da visita, cada clique vira
    // um pedido novo. Melhor isso do que perder o evento.
    return `${novoEventId()}-${valor}`;
  }
}

/**
 * Liga o e-mail do aluno à tag ("enhanced match"). É o que permite ao Pinterest
 * reconhecer que quem comprou é a mesma pessoa que viu o anúncio, mesmo em
 * outro aparelho. Vale para todos os eventos disparados depois desta chamada.
 *
 * A tag hospeda o e-mail já criptografado — ele não trafega em texto puro.
 */
export function pinterestEnhancedMatch(email: string): void {
  window.pintrk?.("set", { em: email });
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
    order_id: orderId(valor),
    value: valor,
    order_quantity: quantidade,
    currency: "BRL",
  });
}
