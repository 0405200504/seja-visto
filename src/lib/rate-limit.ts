import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limit por janela deslizante, contado no Postgres.
 *
 * Precisa ser no banco: a Vercel roda várias instâncias em paralelo e um
 * contador em memória não enxerga as requisições que caíram na outra.
 *
 * Falha ABERTO de propósito — se o banco estiver fora, é melhor deixar a
 * compra passar do que recusar cliente pagante. A exceção é o Fit Check,
 * que falha fechado porque ali cada requisição custa dinheiro.
 */
export async function checarRateLimit(
  bucket: string,
  limite: number,
  janelaSegundos: number,
  { falharFechado = false }: { falharFechado?: boolean } = {}
): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("checar_rate_limit", {
      p_bucket: bucket,
      p_limite: limite,
      p_janela_segundos: janelaSegundos,
    });
    if (error) {
      console.error("[rate-limit] falhou:", bucket, error.message);
      return !falharFechado;
    }
    return data === true;
  } catch (err) {
    console.error("[rate-limit] exceção:", bucket, err);
    return !falharFechado;
  }
}

/** IP do cliente atrás do proxy da Vercel. */
export function ipDaRequisicao(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

/**
 * IP dentro de uma Server Action, onde não existe objeto Request.
 *
 * Server Action não recebe a requisição como argumento, então sem isto os
 * fluxos de login/cadastro/reset só conseguiam limitar por e-mail — e quem
 * troca o e-mail a cada tentativa passava sem limite nenhum.
 */
export async function ipDoServerAction(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "desconhecido";
}
