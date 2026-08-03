/**
 * Regras puras do webhook da Cakto.
 *
 * Ficam fora de `app/api/webhooks/cakto/route.ts` para poderem ser testadas
 * sem subir servidor nem banco: são as decisões que, se saírem erradas,
 * liberam acesso sem pagamento ou tiram acesso de quem pagou.
 *
 * Nada aqui faz I/O. Quem fala com o banco é a rota.
 */

/** Eventos que LIBERAM acesso. */
export const GRANT_EVENTS = new Set(["purchase_approved", "subscription_renewed"]);

/**
 * Eventos que tiram o acesso NA HORA. Só devolução de dinheiro entra aqui:
 * quem recebeu o valor de volta não fica com o produto.
 *
 * `purchase_refunded` não existe na Cakto (os 14 eventos reais estão em
 * lib/whatsapp/cakto-eventos.ts); fica aceito como sinônimo defensivo de
 * `refund` caso o gateway renomeie o evento.
 */
export const REVOKE_EVENTS = new Set(["refund", "chargeback", "purchase_refunded"]);

/**
 * Cancelamento de assinatura.
 *
 * REGRA COMERCIAL (a mesma publicada em /reembolso, seção 6): cancelar
 * interrompe as cobranças futuras, mas o acesso continua valendo até o fim
 * do período que a pessoa já pagou.
 */
export const CANCEL_EVENTS = new Set(["subscription_canceled"]);

/**
 * Pacotes de tokens do Fit Check: "tokens-200" vira 200 imagens creditadas
 * em vez de um bônus permanente. Devolve null quando não é pacote.
 */
export function parseTokenGrant(entitlement: string): number | null {
  const m = /^tokens[-:_]?(\d+)$/i.exec(entitlement.trim());
  return m ? parseInt(m[1], 10) : null;
}

/**
 * IDs de produto/oferta presentes no payload. A Cakto espalha isso entre
 * product, offer, items e order bumps, com nomes de campo diferentes.
 */
export function idsDoPayload(dataList: Record<string, unknown>[]): string[] {
  const encontrados = new Set<string>();
  const coletar = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      for (const key of ["id", "short_id", "product_id", "offer_id"]) {
        if (typeof rec[key] === "string" && rec[key]) encontrados.add(rec[key] as string);
      }
    }
  };
  for (const item of dataList) {
    coletar(item.product);
    coletar(item.offer);
    for (const field of ["products", "offers", "items", "order_bumps", "orderBumps"]) {
      coletar(item[field]);
    }
  }
  return [...encontrados];
}

/**
 * Data em que o evento aconteceu do lado da Cakto, não a hora em que ele
 * chegou aqui. É o que diferencia "compra nova" de "webhook atrasado".
 * Sem nenhum campo de data reconhecível, devolve null.
 */
export function dataDoEvento(
  payload: Record<string, unknown>,
  item: Record<string, unknown>
): Date | null {
  const candidatos = [
    item.paid_at, item.paidAt, item.approved_at, item.approvedAt,
    item.created_at, item.createdAt, payload.created_at, payload.createdAt,
  ];
  for (const v of candidatos) {
    if (typeof v !== "string" || !v.trim()) continue;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Nova data de validade de um entitlement.
 *
 * Renovação SOMA na data que já existe, quando ela ainda está no futuro —
 * quem renova no dia 20 de um ciclo que vai até o dia 30 não perde os 10
 * dias que faltavam. Se já venceu (ou nunca teve), conta a partir de agora.
 */
export function novaValidade(
  validityDays: number | null | undefined,
  expiraAtual: string | null | undefined,
  agora = new Date()
): string | null {
  if (!validityDays) return null;
  const atual = expiraAtual ? new Date(expiraAtual) : null;
  const base = atual && atual > agora ? new Date(atual) : new Date(agora);
  base.setDate(base.getDate() + validityDays);
  return base.toISOString();
}

/**
 * Uma aprovação que chega DEPOIS de uma devolução de dinheiro está
 * atrasada e não pode devolver o acesso sozinha.
 *
 * Duas provas, em ordem de confiança:
 *
 *  1. a própria transação do payload já está marcada como reembolsada —
 *     não depende de relógio nenhum e é prova direta;
 *  2. existe reembolso/chargeback registrado para este cliente DEPOIS da
 *     data em que esta compra aconteceu.
 *
 * Uma compra NOVA de quem já foi reembolsado antes continua liberando: a
 * data dela é posterior à revogação e o id da transação é outro.
 *
 * Devolve o motivo do bloqueio, ou null quando pode liberar.
 */
export function motivoDeBloqueio(entrada: {
  vendasReembolsadas: { cakto_id: string | null; refunded_at: string | null }[];
  revogacoesPosteriores: { event_type: string; created_at: string }[];
  quando: Date | null;
}): string | null {
  const [venda] = entrada.vendasReembolsadas;
  if (venda) {
    return `a transação ${venda.cakto_id} já foi reembolsada em ${venda.refunded_at}`;
  }
  if (!entrada.quando) return null;
  const [revogacao] = entrada.revogacoesPosteriores;
  if (revogacao) {
    return (
      `esta compra é de ${entrada.quando.toISOString()} e existe um evento de ` +
      `"${revogacao.event_type}" mais recente (${revogacao.created_at})`
    );
  }
  return null;
}
