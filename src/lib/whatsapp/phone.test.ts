import { describe, it, expect } from "vitest";
import { normalizarTelefone, mascararTelefone, primeiroNome } from "./phone";

describe("normalizarTelefone", () => {
  it("aceita as formas que a Cakto manda na prática", () => {
    for (const entrada of [
      "15988300526",
      "(15) 98830-0526",
      "+55 15 98830-0526",
      "5515988300526",
      "0055 15 98830 0526",
      " 55 (15) 9 8830-0526 ",
    ]) {
      const r = normalizarTelefone(entrada);
      expect(r.ok, `falhou para ${entrada}`).toBe(true);
      if (r.ok) expect(r.numero).toBe("5515988300526");
    }
  });

  it("recusa telefone inválido em vez de mandar mensagem que não chega", () => {
    const casos: [string | null | undefined, RegExp][] = [
      [null, /ausente/],
      ["", /ausente/],
      ["abc", /sem dígitos/],
      ["1234", /dígitos/],
      ["5520988300526", /DDD 20 não existe/], // 20 não existe; 99 (MA) existe
      ["551188300526", /fixo/], // 8 dígitos = fixo
      ["5515888300526", /começar com 9/],
    ];
    for (const [entrada, motivo] of casos) {
      const r = normalizarTelefone(entrada);
      expect(r.ok, `deveria recusar ${entrada}`).toBe(false);
      if (!r.ok) expect(r.motivo).toMatch(motivo);
    }
  });

  it("mantém número estrangeiro com o DDI correto", () => {
    const r = normalizarTelefone("+351 912 345 678");
    expect(r).toEqual({ ok: true, numero: "351912345678", pais: "EX" });
  });

  it("valida DDD brasileiro", () => {
    expect(normalizarTelefone("5511987654321").ok).toBe(true);
    expect(normalizarTelefone("5510987654321").ok).toBe(false);
  });
});

describe("mascararTelefone", () => {
  it("nunca mostra o número inteiro", () => {
    const m = mascararTelefone("5515988300526");
    expect(m).toBe("5515****0526");
    expect(m).not.toContain("98830");
  });
});

describe("primeiroNome", () => {
  it("pega só o primeiro nome e tem saída natural sem nome", () => {
    expect(primeiroNome("Maria Silva Souza")).toBe("Maria");
    expect(primeiroNome("  ")).toBe("tudo bem");
    expect(primeiroNome(null)).toBe("tudo bem");
  });
});
