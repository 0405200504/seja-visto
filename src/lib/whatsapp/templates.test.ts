import { describe, it, expect, beforeEach } from "vitest";
import { brl, nomeDoPlano, textoCarrinho, textoRenovacao, valorDoPlano, TIPOS } from "./templates";
import { planoPorValidade } from "./automacoes";

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://manualpraticodooutfit.com.br";
});

/* O Intl usa espaço não-quebrável entre "R$" e o número. Isso está certo
 * na mensagem; nos testes comparamos com espaço comum. */
const norm = (t: string) => t.replace(/[\u00a0\u202f]/g, " ");

const CARRINHO = {
  nome: "Maria Silva",
  plano: "mensal" as const,
  amountCents: 2700,
  checkoutUrl: "https://pay.cakto.com.br/zkkrorx_973168",
};

describe("mensal x anual", () => {
  it("identifica o plano pela validade do produto na Cakto", () => {
    expect(planoPorValidade(30)).toBe("mensal");
    expect(planoPorValidade(365)).toBe("anual");
    expect(planoPorValidade(null)).toBe("outro"); // bônus e pacote de token
  });

  it("mensal fala em valor por mês e NUNCA em cobrança anual", () => {
    const t = norm(textoCarrinho("cart_recovery_2", CARRINHO));
    expect(t).toContain("plano mensal");
    expect(t).toContain("R$ 27,00 por mês");
    expect(t).not.toMatch(/por ano|anual/i);
  });

  it("anual fala em valor por ano", () => {
    const t = norm(textoCarrinho("cart_recovery_2", { ...CARRINHO, plano: "anual", amountCents: 16459 }));
    expect(t).toContain("plano anual");
    expect(t).toContain("R$ 164,59 por ano");
    expect(t).not.toMatch(/por mês/i);
  });

  it("só menciona parcelamento quando ele existe de verdade", () => {
    expect(norm(valorDoPlano("anual", 16459, null))).toBe("R$ 164,59 por ano");
    expect(norm(valorDoPlano("anual", 16459, 1))).toBe("R$ 164,59 por ano");
    expect(norm(valorDoPlano("anual", 16459, 12))).toBe(
      "R$ 164,59 por ano, com possibilidade de pagamento em 12 parcelas de R$ 13,72"
    );
  });

  it("anual parcelado continua sendo anual — não vira mensalidade", () => {
    const t = norm(valorDoPlano("anual", 16459, 12));
    expect(t).toContain("por ano");
    expect(t).not.toContain("por mês");
    expect(nomeDoPlano("anual")).toBe("plano anual");
  });

  it("formata em reais", () => {
    expect(brl(2700).replace(/ /g, " ")).toBe("R$ 27,00");
    expect(brl(16459).replace(/ /g, " ")).toBe("R$ 164,59");
  });
});

describe("conteúdo obrigatório", () => {
  it("toda mensagem de carrinho identifica o MPO e traz o link", () => {
    for (const tipo of ["cart_recovery_1", "cart_recovery_2", "cart_recovery_3"] as const) {
      const t = textoCarrinho(tipo, CARRINHO);
      expect(t).toContain("MPO");
      expect(t).toContain(CARRINHO.checkoutUrl);
      expect(t.startsWith("Olá, Maria!")).toBe(true);
    }
  });

  it("a primeira mensagem se apresenta como sendo do MPO", () => {
    expect(textoCarrinho("cart_recovery_1", CARRINHO)).toContain("Aqui é do MPO — Manual Prático do Outfit");
  });

  it("a segunda mensagem oferece a saída (PARAR)", () => {
    expect(textoCarrinho("cart_recovery_2", CARRINHO)).toContain('responda "PARAR"');
  });

  it("a terceira se declara o último lembrete", () => {
    expect(textoCarrinho("cart_recovery_3", CARRINHO)).toContain("último lembrete");
  });

  it("nenhuma mensagem usa urgência falsa, emoji ou promoção", () => {
    const proibido = /última chance|imperdível|abra agora|corre|promoção|desconto especial|oferta relâmpago/i;
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

    const todas = [
      ...(["cart_recovery_1", "cart_recovery_2", "cart_recovery_3"] as const).map((t) => textoCarrinho(t, CARRINHO)),
      ...TIPOS.filter((t) => !t.startsWith("cart_")).map((t) =>
        textoRenovacao(t, { nome: "Maria", plano: "mensal", amountCents: 2700, proximaCobranca: new Date("2026-09-01") })
      ),
    ];

    for (const t of todas) {
      expect(proibido.test(t), `texto com linguagem proibida: ${t.slice(0, 60)}`).toBe(false);
      expect(emoji.test(t), `texto com emoji: ${t.slice(0, 60)}`).toBe(false);
      expect(t).toContain("MPO");
    }
  });

  it("mensagens de renovação apontam para a página do MPO, não para link genérico", () => {
    const t = textoRenovacao("monthly_payment_failed", {
      nome: "Maria",
      plano: "mensal",
      amountCents: 2700,
    });
    expect(t).toContain("https://manualpraticodooutfit.com.br/renovar");
    expect(t).not.toContain("pay.cakto.com.br");
  });

  it("a confirmação de renovação traz a próxima data", () => {
    const t = norm(textoRenovacao("renewal_payment_confirmed", {
      nome: "Maria",
      plano: "anual",
      amountCents: 16459,
      proximaCobranca: new Date("2027-08-01T12:00:00Z"),
    }));
    expect(t).toContain("Próxima renovação: 01/08/2027");
    expect(t).toContain("renovação anual");
  });

  it("todos os 13 tipos têm texto", () => {
    expect(TIPOS).toHaveLength(13);
    for (const tipo of TIPOS) {
      const t = tipo.startsWith("cart_")
        ? textoCarrinho(tipo as "cart_recovery_1", CARRINHO)
        : textoRenovacao(tipo, { nome: "Maria", plano: "mensal", amountCents: 2700 });
      expect(t.length, `${tipo} sem texto`).toBeGreaterThan(50);
    }
  });
});
