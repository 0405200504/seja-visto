import { describe, expect, it } from "vitest";
import {
  CANCEL_EVENTS,
  GRANT_EVENTS,
  REVOKE_EVENTS,
  dataDoEvento,
  idsDoPayload,
  motivoDeBloqueio,
  novaValidade,
  parseTokenGrant,
} from "./regras";

/**
 * Os 14 eventos que a Cakto emite de verdade, conferidos na documentação
 * oficial (docs.cakto.com.br/api-reference/webhooks) em 2026-08-03.
 *
 * Este teste é o que impede a lista de sair do lugar numa refatoração: um
 * evento que some daqui é uma compra que deixa de liberar acesso, ou um
 * reembolso que deixa de revogar.
 */
const EVENTOS_REAIS_DA_CAKTO = [
  "initiate_checkout",
  "checkout_abandonment",
  "purchase_approved",
  "purchase_refused",
  "pix_gerado",
  "boleto_gerado",
  "picpay_gerado",
  "openfinance_nubank_gerado",
  "chargeback",
  "refund",
  "subscription_created",
  "subscription_canceled",
  "subscription_renewed",
  "subscription_renewal_refused",
] as const;

describe("classificação dos eventos da Cakto", () => {
  it("libera acesso só em compra aprovada e renovação aprovada", () => {
    expect([...GRANT_EVENTS].sort()).toEqual(["purchase_approved", "subscription_renewed"]);
  });

  it("revoga na hora só quando o dinheiro volta", () => {
    expect(REVOKE_EVENTS.has("refund")).toBe(true);
    expect(REVOKE_EVENTS.has("chargeback")).toBe(true);
  });

  /* REGRA COMERCIAL: /reembolso seção 6 promete acesso até o fim do período
   * já pago. Cancelamento não pode entrar na lista de revogação imediata. */
  it("cancelamento NÃO revoga na hora — acesso vale até o fim do período pago", () => {
    expect(CANCEL_EVENTS.has("subscription_canceled")).toBe(true);
    expect(REVOKE_EVENTS.has("subscription_canceled")).toBe(false);
    expect(GRANT_EVENTS.has("subscription_canceled")).toBe(false);
  });

  it("pagamento pendente não libera acesso", () => {
    for (const e of ["pix_gerado", "boleto_gerado", "picpay_gerado", "openfinance_nubank_gerado", "initiate_checkout"]) {
      expect(GRANT_EVENTS.has(e), e).toBe(false);
    }
  });

  it("pagamento recusado não libera acesso", () => {
    expect(GRANT_EVENTS.has("purchase_refused")).toBe(false);
    expect(GRANT_EVENTS.has("subscription_renewal_refused")).toBe(false);
  });

  it("nenhum evento inventado entra nas listas que liberam acesso", () => {
    const reais = new Set<string>(EVENTOS_REAIS_DA_CAKTO);
    for (const e of GRANT_EVENTS) expect(reais.has(e), `${e} não existe na Cakto`).toBe(true);
    for (const e of CANCEL_EVENTS) expect(reais.has(e), `${e} não existe na Cakto`).toBe(true);
  });

  it("evento desconhecido não cai em nenhuma lista", () => {
    for (const lista of [GRANT_EVENTS, REVOKE_EVENTS, CANCEL_EVENTS]) {
      expect(lista.has("purchase_approved_v2")).toBe(false);
      expect(lista.has("")).toBe(false);
    }
  });
});

describe("evento antigo não reativa conta reembolsada", () => {
  const ontem = new Date("2026-07-01T10:00:00Z");

  it("bloqueia quando a própria transação já foi reembolsada", () => {
    const motivo = motivoDeBloqueio({
      vendasReembolsadas: [{ cakto_id: "trx-1", refunded_at: "2026-07-20T10:00:00Z" }],
      revogacoesPosteriores: [],
      quando: ontem,
    });
    expect(motivo).toMatch(/trx-1.*reembolsada/);
  });

  it("bloqueia mesmo sem data no payload, se a transação está reembolsada", () => {
    const motivo = motivoDeBloqueio({
      vendasReembolsadas: [{ cakto_id: "trx-1", refunded_at: "2026-07-20T10:00:00Z" }],
      revogacoesPosteriores: [],
      quando: null,
    });
    expect(motivo).not.toBeNull();
  });

  it("bloqueia aprovação atrasada quando existe revogação mais recente", () => {
    const motivo = motivoDeBloqueio({
      vendasReembolsadas: [],
      revogacoesPosteriores: [{ event_type: "refund", created_at: "2026-07-25T10:00:00Z" }],
      quando: ontem,
    });
    expect(motivo).toMatch(/refund.*mais recente/);
  });

  it("bloqueia também em chargeback posterior", () => {
    const motivo = motivoDeBloqueio({
      vendasReembolsadas: [],
      revogacoesPosteriores: [{ event_type: "chargeback", created_at: "2026-07-25T10:00:00Z" }],
      quando: ontem,
    });
    expect(motivo).toMatch(/chargeback/);
  });

  /* O outro lado da moeda, tão importante quanto: quem foi reembolsado e
   * comprou DE NOVO precisa receber o acesso. Bloquear aqui seria negar
   * produto a quem pagou. */
  it("NÃO bloqueia compra nova de quem já foi reembolsado antes", () => {
    const motivo = motivoDeBloqueio({
      vendasReembolsadas: [],
      revogacoesPosteriores: [], // a consulta filtra por data > compra: nada posterior
      quando: new Date("2026-08-01T10:00:00Z"),
    });
    expect(motivo).toBeNull();
  });

  it("NÃO bloqueia a primeira compra de um cliente novo", () => {
    expect(motivoDeBloqueio({ vendasReembolsadas: [], revogacoesPosteriores: [], quando: null })).toBeNull();
  });
});

describe("data do evento", () => {
  it("lê a data de pagamento do item", () => {
    expect(dataDoEvento({}, { paid_at: "2026-07-01T10:00:00Z" })?.toISOString()).toBe("2026-07-01T10:00:00.000Z");
  });

  it("aceita os vários nomes que a Cakto usa", () => {
    expect(dataDoEvento({}, { approvedAt: "2026-07-02T10:00:00Z" })).not.toBeNull();
    expect(dataDoEvento({}, { created_at: "2026-07-03T10:00:00Z" })).not.toBeNull();
    expect(dataDoEvento({ createdAt: "2026-07-04T10:00:00Z" }, {})).not.toBeNull();
  });

  it("devolve null sem data reconhecível, em vez de inventar 'agora'", () => {
    expect(dataDoEvento({}, {})).toBeNull();
    expect(dataDoEvento({}, { paid_at: "não é data" })).toBeNull();
    expect(dataDoEvento({}, { paid_at: "" })).toBeNull();
  });
});

describe("validade do acesso", () => {
  const agora = new Date("2026-08-03T12:00:00Z");

  it("compra nova conta a partir de hoje", () => {
    expect(novaValidade(30, null, agora)).toBe("2026-09-02T12:00:00.000Z");
  });

  /* Renovação NÃO pode zerar o que sobrou: quem renova no dia 20 de um
   * ciclo que ia até o dia 30 tem os 10 dias restantes somados. */
  it("renovação soma sobre a validade que ainda está no futuro", () => {
    expect(novaValidade(30, "2026-08-13T12:00:00Z", agora)).toBe("2026-09-12T12:00:00.000Z");
  });

  it("renovação de acesso já vencido recomeça de hoje", () => {
    expect(novaValidade(30, "2026-07-01T12:00:00Z", agora)).toBe("2026-09-02T12:00:00.000Z");
  });

  it("produto sem prazo (bônus vitalício) fica sem data de vencimento", () => {
    expect(novaValidade(null, null, agora)).toBeNull();
    expect(novaValidade(undefined, "2026-08-13T12:00:00Z", agora)).toBeNull();
  });

  it("plano anual soma 365 dias", () => {
    expect(novaValidade(365, null, agora)).toBe("2027-08-03T12:00:00.000Z");
  });
});

describe("pacotes de token do Fit Check", () => {
  it("reconhece o formato do entitlement", () => {
    expect(parseTokenGrant("tokens-200")).toBe(200);
    expect(parseTokenGrant("tokens_50")).toBe(50);
    expect(parseTokenGrant("tokens:10")).toBe(10);
  });

  it("não confunde bônus permanente com pacote de token", () => {
    expect(parseTokenGrant("base")).toBeNull();
    expect(parseTokenGrant("grupo-whatsapp")).toBeNull();
    expect(parseTokenGrant("tokens-ilimitados")).toBeNull();
  });
});

describe("leitura dos ids de produto do payload", () => {
  it("acha o produto principal", () => {
    expect(idsDoPayload([{ product: { id: "prod-1" } }])).toEqual(["prod-1"]);
  });

  it("acha os order bumps junto do principal", () => {
    const ids = idsDoPayload([
      { product: { id: "prod-1" }, order_bumps: [{ id: "bump-1" }, { id: "bump-2" }] },
    ]);
    expect(ids.sort()).toEqual(["bump-1", "bump-2", "prod-1"]);
  });

  it("não repete o mesmo id vindo de campos diferentes", () => {
    expect(idsDoPayload([{ product: { id: "x" }, offer: { id: "x" } }])).toEqual(["x"]);
  });

  it("devolve lista vazia em payload sem produto — não adivinha", () => {
    expect(idsDoPayload([{}])).toEqual([]);
    expect(idsDoPayload([{ product: null }])).toEqual([]);
    expect(idsDoPayload([{ product: { id: 123 } }])).toEqual([]);
  });
});
