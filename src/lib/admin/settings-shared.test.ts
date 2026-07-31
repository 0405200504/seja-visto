import { describe, it, expect } from "vitest";
import { custoChamadaCents, FIT_CHECK_DEFAULTS, PRECO_MODELO } from "./settings-shared";

describe("custo de chamada da IA", () => {
  it("cobra o modelo de foto mais caro que o de texto para o mesmo consumo", async () => {
    const foto = custoChamadaCents(FIT_CHECK_DEFAULTS.model, 10_000, 500);
    const texto = custoChamadaCents(FIT_CHECK_DEFAULTS.model_text, 10_000, 500);
    expect(foto).toBeGreaterThan(texto);
  });

  it("modelo desconhecido cai no mais CARO, não no mais barato", async () => {
    const desconhecido = custoChamadaCents("modelo-que-nao-existe", 10_000, 500);
    const maisCaro = custoChamadaCents("gpt-5.5", 10_000, 500);
    // Errar para cima faz o teto de gasto disparar antes; errar para baixo
    // deixaria o gasto real passar do teto sem ninguém perceber.
    expect(desconhecido).toBe(maisCaro);
  });

  it("nunca devolve custo negativo", async () => {
    expect(custoChamadaCents(FIT_CHECK_DEFAULTS.model, 0, 0)).toBe(0);
  });

  it("os modelos configurados por padrão têm preço cadastrado", async () => {
    expect(PRECO_MODELO[FIT_CHECK_DEFAULTS.model]).toBeDefined();
    expect(PRECO_MODELO[FIT_CHECK_DEFAULTS.model_text]).toBeDefined();
  });
});

describe("defaults de segurança do Fit Check", () => {
  it("vem com kill switch ligado e os dois tetos de gasto ativos", async () => {
    expect(FIT_CHECK_DEFAULTS.ai_enabled).toBe(true);
    expect(FIT_CHECK_DEFAULTS.daily_budget_reais).toBeGreaterThan(0);
    expect(FIT_CHECK_DEFAULTS.monthly_budget_reais).toBeGreaterThan(0);
  });

  it("o teto diário é menor que o mensal, senão não serve de nada", async () => {
    expect(FIT_CHECK_DEFAULTS.daily_budget_reais).toBeLessThan(
      FIT_CHECK_DEFAULTS.monthly_budget_reais
    );
  });

  it("max_output_tokens tem limite — sem isso a resposta pode inflar o custo", async () => {
    expect(FIT_CHECK_DEFAULTS.max_output_tokens).toBeGreaterThan(0);
    expect(FIT_CHECK_DEFAULTS.max_output_tokens).toBeLessThanOrEqual(4000);
  });
});
