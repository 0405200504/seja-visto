/**
 * Portão de pré-lançamento da página de vendas.
 *
 * Antes da data de abertura, quem chega na raiz "/" cai numa tela de senha —
 * assim nenhum lead acha a oferta por acaso pesquisando no Safari/Google.
 * Depois da data, o portão some sozinho: ninguém precisa mexer em nada,
 * fazer deploy nem trocar variável no dia da abertura.
 *
 * Para mudar a data ou a senha, troque as duas constantes abaixo e dê um
 * push na main (ou defina VENDAS_ABRE_EM / VENDAS_SENHA na Vercel, que têm
 * prioridade sobre o que está escrito aqui).
 */

/** Momento exato em que a página de vendas abre para todo mundo (horário de Brasília). */
export const VENDAS_ABREM_EM =
  process.env.VENDAS_ABRE_EM ?? "2026-08-08T12:00:00-03:00";

/** Senha do portão. Só entra quem você mandar isto por mensagem. */
export const VENDAS_SENHA = process.env.VENDAS_SENHA ?? "mpo-bastidores-2026";

/** Nome do cookie que guarda "esta pessoa já digitou a senha". */
export const COOKIE_PORTAO = "mpo_portao";

/** true quando a data de abertura já passou — daí o portão nem é checado. */
export function vendasAbertas(agora: Date = new Date()): boolean {
  const abertura = new Date(VENDAS_ABREM_EM);
  // Data escrita errada trava fechado de propósito: é melhor ter que arrumar
  // a data do que descobrir a página aberta antes da hora.
  if (Number.isNaN(abertura.getTime())) return false;
  return agora.getTime() >= abertura.getTime();
}

/**
 * Valor guardado no cookie. É o hash da senha, não a senha: quem abrir o
 * inspetor do navegador não descobre o que digitar, e o cookie não pode ser
 * forjado sem conhecer a senha.
 *
 * Usa Web Crypto (e não o `crypto` do Node) porque a mesma função roda no
 * middleware, que executa no runtime de borda da Vercel.
 */
export async function assinaturaDoPortao(senha: string = VENDAS_SENHA): Promise<string> {
  const dados = new TextEncoder().encode(`mpo-portao:v1:${senha}`);
  const hash = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compara duas assinaturas sem devolver mais cedo na primeira diferença.
 * Como sempre são dois hashes de 64 caracteres, o tempo de resposta não
 * entrega nada sobre a senha certa.
 */
export function assinaturasIguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}
