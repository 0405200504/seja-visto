import "server-only";

/**
 * Interpretação das respostas do cliente.
 *
 * Deliberadamente conservador: só classifica quando a intenção é clara.
 * Na dúvida devolve "outro", que não dispara nenhuma ação automática e
 * apenas registra a mensagem para você ler. Cancelar assinatura por
 * interpretação incerta seria pior do que não entender.
 */

export type Intencao = "parar" | "ja_paguei" | "quero_cancelar" | "outro";

/** Tira acento, pontuação e espaço extra para comparar. */
export function normalizarTexto(bruto: string): string {
  return bruto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acentos combinantes
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Frases que valem sozinhas como pedido de parada. */
const PARAR_EXATO = new Set([
  "parar", "pare", "para", "sair", "stop", "cancelar mensagens",
  "remover meu numero", "remove meu numero", "descadastrar", "sem mensagens",
]);

const PARAR_CONTEM = [
  "nao quero receber",
  "nao quero mais receber",
  "parar de receber",
  "parem de mandar",
  "para de mandar",
  "remover meu numero",
  "tirar meu numero",
  "me remove da lista",
  "cancelar mensagens",
  "nao me mande mais",
];

const JA_PAGUEI_CONTEM = [
  "ja paguei",
  "ja pague",
  "ja fiz o pagamento",
  "paguei",
  "pagamento feito",
  "ja efetuei o pagamento",
  "acabei de pagar",
  "pix feito",
  "ja transferi",
  "comprovante",
];

const CANCELAR_CONTEM = [
  "quero cancelar",
  "cancelar minha assinatura",
  "cancelar assinatura",
  "cancelar o plano",
  "quero cancelar minha assinatura",
  "desejo cancelar",
  "cancelamento",
];

/**
 * Classifica a resposta.
 *
 * A ordem importa: "quero cancelar minha assinatura" contém "cancelar",
 * mas é pedido de cancelamento de PLANO, não de mensagens — por isso a
 * checagem de cancelamento vem antes da de parada por conteúdo.
 */
export function interpretarResposta(bruto: string | null | undefined): Intencao {
  if (!bruto) return "outro";
  const t = normalizarTexto(bruto);
  if (!t) return "outro";

  if (PARAR_EXATO.has(t)) return "parar";
  if (CANCELAR_CONTEM.some((f) => t.includes(f))) return "quero_cancelar";
  if (JA_PAGUEI_CONTEM.some((f) => t.includes(f))) return "ja_paguei";
  if (PARAR_CONTEM.some((f) => t.includes(f))) return "parar";

  return "outro";
}
