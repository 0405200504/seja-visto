/**
 * Substituto de `server-only` nos testes (ver vitest.config.ts).
 *
 * O pacote real lança exceção ao ser importado fora de um Server Component,
 * o que impediria qualquer teste de módulo de servidor. A proteção continua
 * ativa no `next build` — este arquivo não é usado em produção.
 */
export {};
