import { z } from "zod";

/**
 * Variáveis que PODEM ir para o navegador. Este arquivo é importável do
 * cliente, então tudo aqui é público por definição.
 *
 * REGRA: nunca adicione algo sem o prefixo NEXT_PUBLIC_ aqui. O prefixo
 * embute o valor no bundle JS — o que entra neste arquivo, entra no
 * navegador de qualquer visitante.
 *
 * As referências abaixo são escritas literalmente (process.env.NEXT_PUBLIC_X)
 * porque o Next.js substitui o texto em tempo de build; um acesso dinâmico
 * (process.env[nome]) resultaria em undefined no cliente.
 */

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_RENEW_URL: z.string().url().optional(),
});

const raw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_RENEW_URL: process.env.NEXT_PUBLIC_RENEW_URL,
};

export type ClientEnv = z.infer<typeof schema>;

let cache: ClientEnv | null = null;

export function clientEnv(): ClientEnv {
  if (cache) return cache;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const problemas = parsed.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variáveis públicas inválidas:\n${problemas}`);
  }
  cache = parsed.data;
  return cache;
}
