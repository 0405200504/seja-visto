import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Overrides de conteúdo estático (guias, estilos, glossário, plano, bônus).
 * O conteúdo-fonte vive no código; o admin salva ajustes (títulos, descrições,
 * ordem, ocultar) na tabela content_overrides e eles são aplicados por cima —
 * sem precisar de deploy.
 */

export type ContentKind = "guia" | "estilo" | "glossario" | "plano" | "bonus" | "quiz";

export type OverrideRow = {
  slug: string;
  patch: Record<string, string>;
  hidden: boolean;
  order_index: number | null;
};

/** Deduplicado por requisição: a mesma página nunca lê o mesmo `kind` duas vezes. */
export const getOverrides = cache(
  async (kind: ContentKind): Promise<Map<string, OverrideRow>> => {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("content_overrides")
        .select("slug, patch, hidden, order_index")
        .eq("kind", kind);
      return new Map((data ?? []).map((r) => [r.slug, r as OverrideRow]));
    } catch {
      return new Map();
    }
  }
);

/** Aplica patch/ocultar/ordem sobre a lista estática. */
export function applyOverrides<T extends object>(
  items: T[],
  overrides: Map<string, OverrideRow>,
  getKey: (item: T) => string
): T[] {
  const merged = items
    .map((item, index) => {
      const ov = overrides.get(getKey(item));
      if (!ov) return { item, index, hidden: false, order: index };
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(ov.patch ?? {})) {
        if (typeof v === "string" && v.trim() !== "") patch[k] = v;
      }
      return {
        item: { ...item, ...patch } as T,
        index,
        hidden: ov.hidden,
        order: ov.order_index ?? index,
      };
    })
    .filter((m) => !m.hidden)
    .sort((a, b) => a.order - b.order || a.index - b.index);

  return merged.map((m) => m.item);
}

/** Uma entrada específica com patch aplicado (páginas de detalhe). */
export function applyOverride<T extends object>(
  item: T | undefined,
  overrides: Map<string, OverrideRow>,
  key: string
): T | undefined {
  if (!item) return item;
  const ov = overrides.get(key);
  if (!ov || ov.hidden) return ov?.hidden ? undefined : item;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ov.patch ?? {})) {
    if (typeof v === "string" && v.trim() !== "") patch[k] = v;
  }
  return { ...item, ...patch } as T;
}
