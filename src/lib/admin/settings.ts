import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Leitura/escrita da tabela app_settings. Só servidor.
 *
 * As constantes puras (preços, taxas, defaults) moram em ./settings-shared,
 * que é importável do navegador. Elas são reexportadas aqui para os
 * consumidores de servidor continuarem importando de um lugar só — mas
 * componentes "use client" devem importar de "@/lib/admin/settings-shared"
 * direto, senão puxam o service role para o grafo do cliente.
 */

export * from "./settings-shared";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = createAdminClient();
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  return { ...fallback, ...(data.value as Partial<T>) };
}

export async function setSetting(key: string, value: unknown, updatedBy?: string) {
  const db = createAdminClient();
  const { error } = await db
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy ?? null });
  if (error) throw new Error(error.message);
}
