import { describe, it, expect } from "vitest";
import { interpretarResposta, normalizarTexto } from "./respostas";

describe("interpretarResposta", () => {
  it("entende pedido de PARAR nas formas comuns", () => {
    for (const t of [
      "PARAR", "parar", "Pare", "pare!", "sair", "STOP",
      "não quero receber", "nao quero mais receber essas mensagens",
      "remover meu número", "para de mandar mensagem", "cancelar mensagens",
    ]) {
      expect(interpretarResposta(t), `falhou para "${t}"`).toBe("parar");
    }
  });

  it("entende 'já paguei'", () => {
    for (const t of [
      "já paguei", "ja paguei ontem", "Já fiz o pagamento",
      "acabei de pagar", "pix feito", "vou mandar o comprovante",
    ]) {
      expect(interpretarResposta(t), `falhou para "${t}"`).toBe("ja_paguei");
    }
  });

  it("entende pedido de cancelamento de assinatura", () => {
    for (const t of ["quero cancelar", "quero cancelar minha assinatura", "desejo cancelar o plano"]) {
      expect(interpretarResposta(t), `falhou para "${t}"`).toBe("quero_cancelar");
    }
  });

  it("NÃO confunde cancelar assinatura com parar mensagens", () => {
    // "cancelar" aparece nos dois; a intenção de plano tem precedência.
    expect(interpretarResposta("quero cancelar minha assinatura")).toBe("quero_cancelar");
    expect(interpretarResposta("cancelar mensagens")).toBe("parar");
  });

  it("na dúvida devolve 'outro' e não dispara nada", () => {
    for (const t of [
      "oi", "bom dia", "quanto custa?", "não entendi", "", null, undefined,
      "vou pensar", "me manda mais informações",
    ]) {
      expect(interpretarResposta(t as string), `falhou para "${t}"`).toBe("outro");
    }
  });

  it("normaliza acento, pontuação e caixa", () => {
    expect(normalizarTexto("  JÁ  PAGUEI!!! ")).toBe("ja paguei");
    expect(normalizarTexto("Não, obrigado.")).toBe("nao obrigado");
  });
});
