import { describe, it, expect } from "vitest";
import { calcularEconomiaAluno, type VendaEconomia } from "./economia-aluno";
import { FIT_CHECK_DEFAULTS } from "./settings-shared";

const fitCheck = { model: FIT_CHECK_DEFAULTS.model, model_text: FIT_CHECK_DEFAULTS.model_text };

const venda = (over: Partial<VendaEconomia> = {}): VendaEconomia => ({
  amount_cents: 19700,
  status: "approved",
  payment_method: "pix",
  gateway_fee_cents: null,
  is_test: false,
  ...over,
});

const base = { vendas: [], requisicoes: [], logs: [], fitCheck };

describe("calcularEconomiaAluno", () => {
  it("aluno sem venda e sem IA fica tudo zerado, sem margem", () => {
    const r = calcularEconomiaAluno(base);
    expect(r.receitaBrutaCents).toBe(0);
    expect(r.lucroCents).toBe(0);
    expect(r.margemPct).toBeNull();
  });

  it("usa a taxa real do webhook quando ela existe, em vez de estimar", () => {
    const r = calcularEconomiaAluno({
      ...base,
      vendas: [venda({ gateway_fee_cents: 500 })],
    });
    expect(r.taxaGatewayCents).toBe(500);
    expect(r.taxaEstimadaCents).toBe(0);
    expect(r.receitaLiquidaCents).toBe(19700 - 500);
  });

  it("estima a taxa quando o webhook não informou, e marca quanto foi estimado", () => {
    const r = calcularEconomiaAluno({ ...base, vendas: [venda({ payment_method: "pix" })] });
    // Pix: 0% + R$ 2,49 fixos
    expect(r.taxaGatewayCents).toBe(249);
    expect(r.taxaEstimadaCents).toBe(249);
  });

  it("ignora venda de teste", () => {
    const r = calcularEconomiaAluno({ ...base, vendas: [venda({ is_test: true })] });
    expect(r.receitaBrutaCents).toBe(0);
  });

  it("tira a venda reembolsada da receita e a mostra separada", () => {
    const r = calcularEconomiaAluno({
      ...base,
      vendas: [venda(), venda({ status: "refunded", amount_cents: 9700 })],
    });
    expect(r.receitaBrutaCents).toBe(19700);
    expect(r.reembolsadoCents).toBe(9700);
  });

  it("soma o custo real do ledger e desconta do lucro", () => {
    const r = calcularEconomiaAluno({
      ...base,
      vendas: [venda({ gateway_fee_cents: 0 })],
      requisicoes: [
        { custo_cents: 120, created_at: "2026-08-05T10:00:00Z" },
        { custo_cents: 80, created_at: "2026-08-06T10:00:00Z" },
      ],
    });
    expect(r.custoIaRealCents).toBe(200);
    expect(r.custoIaEstimadoCents).toBe(0);
    expect(r.lucroCents).toBe(19700 - 200);
    expect(r.margemPct).toBe(99);
  });

  it("não conta duas vezes: log posterior ao ledger já está no custo real", () => {
    const r = calcularEconomiaAluno({
      ...base,
      requisicoes: [{ custo_cents: 120, created_at: "2026-08-05T10:00:00Z" }],
      logs: [
        // mesma conversa que gerou a requisição acima
        { kind: "photo", prompt_tokens: 10_000, completion_tokens: 500, created_at: "2026-08-05T10:00:01Z" },
      ],
    });
    expect(r.chamadasEstimadas).toBe(0);
    expect(r.custoIaCents).toBe(120);
  });

  it("estima pelos tokens as conversas anteriores ao ledger", () => {
    const r = calcularEconomiaAluno({
      ...base,
      requisicoes: [{ custo_cents: 120, created_at: "2026-08-05T10:00:00Z" }],
      logs: [
        { kind: "photo", prompt_tokens: 10_000, completion_tokens: 500, created_at: "2026-07-20T10:00:00Z" },
      ],
    });
    expect(r.chamadasEstimadas).toBe(1);
    expect(r.custoIaEstimadoCents).toBeGreaterThan(0);
    expect(r.custoIaCents).toBe(120 + r.custoIaEstimadoCents);
  });

  it("aluno que só usou antes do ledger tem todo o custo estimado", () => {
    const r = calcularEconomiaAluno({
      ...base,
      logs: [
        { kind: "text", prompt_tokens: 10_000, completion_tokens: 500, created_at: "2026-07-20T10:00:00Z" },
      ],
    });
    expect(r.chamadasEstimadas).toBe(1);
    expect(r.custoIaRealCents).toBe(0);
    expect(r.custoIaEstimadoCents).toBeGreaterThan(0);
  });

  it("mostra prejuízo quando a IA custou mais que a venda rendeu", () => {
    const r = calcularEconomiaAluno({
      ...base,
      vendas: [venda({ amount_cents: 1700, payment_method: "pix" })], // R$ 17 - R$ 2,49
      requisicoes: [{ custo_cents: 2000, created_at: "2026-08-05T10:00:00Z" }],
    });
    expect(r.lucroCents).toBeLessThan(0);
    expect(r.margemPct).toBeLessThan(0);
  });

  it("aluno de cortesia (sem venda) que usa IA aparece como prejuízo, sem margem", () => {
    const r = calcularEconomiaAluno({
      ...base,
      requisicoes: [{ custo_cents: 300, created_at: "2026-08-05T10:00:00Z" }],
    });
    expect(r.lucroCents).toBe(-300);
    expect(r.margemPct).toBeNull();
  });
});
