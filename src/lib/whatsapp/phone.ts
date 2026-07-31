/**
 * Normalização e validação de telefone.
 *
 * Sem "server-only" de propósito: é função pura, sem segredo, e o painel
 * usa para mostrar o número mascarado.
 *
 * Regra de saída: E.164 sem o "+", que é o formato que a uazapi aceita
 * no campo `number` — ex.: 5515988300526.
 */

/** DDDs que existem no Brasil. Um número com DDD inexistente não é enviável. */
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export type TelefoneValido = { ok: true; numero: string; pais: "BR" | "EX" };
export type TelefoneInvalido = { ok: false; motivo: string };
export type Telefone = TelefoneValido | TelefoneInvalido;

/**
 * Converte o que veio do gateway em um número enviável.
 *
 * Aceita as formas que a Cakto manda na prática: "(15) 98830-0526",
 * "+55 15 98830-0526", "15988300526", "5515988300526".
 */
export function normalizarTelefone(bruto: string | null | undefined): Telefone {
  if (!bruto) return { ok: false, motivo: "telefone ausente" };

  // Fora tudo que não é dígito: espaço, parênteses, traço, ponto, "+".
  let d = String(bruto).replace(/\D/g, "");
  if (!d) return { ok: false, motivo: "telefone sem dígitos" };

  // Zeros de discagem internacional ("0055…") e o zero da operadora.
  d = d.replace(/^00/, "");

  /* Sem DDI: 10 dígitos (fixo) ou 11 (celular) são brasileiros — é o que
   * a Cakto manda quando o comprador digita só DDD + número. */
  if (d.length === 10 || d.length === 11) d = "55" + d;

  if (d.startsWith("55")) {
    const resto = d.slice(2);
    if (resto.length !== 10 && resto.length !== 11) {
      return { ok: false, motivo: `número brasileiro com ${resto.length} dígitos após o DDI` };
    }
    const ddd = parseInt(resto.slice(0, 2), 10);
    if (!DDDS_VALIDOS.has(ddd)) return { ok: false, motivo: `DDD ${ddd} não existe` };

    const assinante = resto.slice(2);
    /* Celular tem 9 dígitos e começa com 9. Fixo tem 8 e não recebe
     * WhatsApp — é recusado aqui, em vez de virar uma mensagem que nunca
     * chega e um "failed" sem explicação no painel. */
    if (assinante.length !== 9) {
      return { ok: false, motivo: "número fixo não recebe WhatsApp" };
    }
    if (!assinante.startsWith("9")) {
      return { ok: false, motivo: "celular precisa começar com 9" };
    }
    return { ok: true, numero: "55" + resto, pais: "BR" };
  }

  /* Estrangeiro: mantém o DDI que veio. Só conferimos a faixa de tamanho
   * do E.164 (mínimo 8, máximo 15 dígitos com DDI). */
  if (d.length < 8 || d.length > 15) {
    return { ok: false, motivo: `número com ${d.length} dígitos fora do padrão internacional` };
  }
  if (d.startsWith("0")) return { ok: false, motivo: "DDI não pode começar com zero" };
  return { ok: true, numero: d, pais: "EX" };
}

/**
 * Versão para log e para tela: esconde o miolo.
 * 5515988300526 → 55 15 ****0526
 */
export function mascararTelefone(numero: string): string {
  const d = String(numero ?? "").replace(/\D/g, "");
  if (d.length < 6) return "***";
  return `${d.slice(0, 4)}****${d.slice(-4)}`;
}

/** Primeiro nome, para o tratamento nas mensagens. */
export function primeiroNome(nome: string | null | undefined): string {
  const limpo = String(nome ?? "").trim().split(/\s+/)[0] ?? "";
  return limpo || "tudo bem";
}
