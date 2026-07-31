import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/env.server";

/**
 * Client administrativo (service role) — SOMENTE para uso no servidor
 * (webhooks e rotinas internas). Ignora RLS.
 *
 * O "server-only" acima faz o build falhar se este módulo for importado de
 * um componente "use client": a service role dá acesso total ao banco, e
 * embutida no bundle seria o pior vazamento possível do projeto.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = serverEnv();

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
