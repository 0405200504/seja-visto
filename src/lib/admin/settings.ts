import { createAdminClient } from "@/lib/supabase/admin";

/** Leitura/escrita tipada da tabela app_settings. */

export type FitCheckSettings = {
  model: string;
  max_output_tokens: number;
  free_credits: number;
  daily_text_limit: number;
  /** instruções extras anexadas ao prompt padrão */
  prompt_extra: string;
  /** se preenchido, SUBSTITUI o prompt do sistema inteiro */
  system_prompt_override: string;
  /** custo estimado por 1.000 tokens, em centavos de R$ (para o KPI de custo) */
  token_price_per_1k_cents: number;
};

export const FIT_CHECK_DEFAULTS: FitCheckSettings = {
  model: "gpt-5.5",
  max_output_tokens: 1500,
  free_credits: 5,
  daily_text_limit: 60,
  prompt_extra: "",
  system_prompt_override: "",
  token_price_per_1k_cents: 3,
};

export type GatewaySettings = {
  /** taxa percentual da Cakto (ex: 8.99) usada quando o webhook não informa taxa */
  fee_percent: number;
  /** taxa fixa em centavos somada por transação */
  fee_fixed_cents: number;
};

export const GATEWAY_DEFAULTS: GatewaySettings = { fee_percent: 8.99, fee_fixed_cents: 0 };

export type TagsSettings = { tags: { name: string; color: string }[] };

export const TAG_COLORS = ["#2f6bff", "#2fbf71", "#e5a83b", "#e5484d", "#9a6bff", "#3bb5e5"];

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
