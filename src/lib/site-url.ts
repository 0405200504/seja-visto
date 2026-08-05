/**
 * Endereço público do site, decidido em um lugar só.
 *
 * Existe por causa de um erro real: um link de acesso foi gerado fora da
 * Vercel, com o `.env.local` de uma máquina de desenvolvimento carregado,
 * e o cliente recebeu no e-mail um link para `http://localhost:3000` —
 * "This site can't be reached" na cara de quem acabou de comprar.
 *
 * A regra: `localhost` só vale rodando `next dev`. Em produção, em script
 * de suporte, em cron, em qualquer outro lugar, um link com localhost é um
 * link quebrado — e é melhor cair no domínio oficial do que enviar isso.
 */

/** Domínio oficial. É o que vai no e-mail quando nada mais for confiável. */
export const SITE_CANONICO = "https://www.manualpraticodooutfit.com.br";

const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?$/i;

/** Base pública do site, sem barra no fim. */
export function baseDoSite(): string {
  const bruto =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const base = bruto.trim().replace(/\/$/, "");
  if (!base) return SITE_CANONICO;

  if (LOCAL.test(base) && process.env.NODE_ENV !== "development") return SITE_CANONICO;

  return base;
}

/** `baseDoSite()` + caminho, para montar link de e-mail sem concatenar à mão. */
export function urlDoSite(caminho: string): string {
  return `${baseDoSite()}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
