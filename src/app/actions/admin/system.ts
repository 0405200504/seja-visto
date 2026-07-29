"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { getSetting, setSetting } from "@/lib/admin/settings";

type Result = { ok: boolean; message: string };

/** Salva um campo de uma chave de app_settings (Fit Check, gateway, tags…). */
export async function saveSettingFieldAction(key: string, field: string, value: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const allowed: Record<string, Set<string>> = {
    fit_check: new Set(["model", "model_text", "max_output_tokens", "free_credits", "daily_text_limit", "prompt_extra", "system_prompt_override", "token_price_per_1k_cents", "monthly_budget_reais"]),
    gateway: new Set(["fee_percent", "fee_fixed_cents"]),
  };
  if (!allowed[key]?.has(field)) return { ok: false, message: "Configuração desconhecida." };

  const current = await getSetting<Record<string, unknown>>(key, {});
  const numeric = ["max_output_tokens", "free_credits", "daily_text_limit", "token_price_per_1k_cents", "fee_fixed_cents", "fee_percent", "monthly_budget_reais"];
  const parsed = numeric.includes(field) ? parseFloat(value.replace(",", ".")) : value;
  if (numeric.includes(field) && !Number.isFinite(parsed)) return { ok: false, message: "Valor numérico inválido." };

  const next = { ...current, [field]: parsed };
  try {
    await setSetting(key, next, profile.user_id);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Erro ao salvar." };
  }

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `config.${key}.${field}`, entityType: "config", entityId: key,
    entityLabel: key, before: { [field]: current[field] }, after: { [field]: parsed },
  });
  revalidatePath("/admin/sistema", "layout");
  return { ok: true, message: "Configuração salva." };
}

/** Catálogo de tags de alunos (Segmentos & Tags). */
export async function saveTagCatalogAction(tags: { name: string; color: string }[]): Promise<Result> {
  const { profile } = await requireAdmin();
  const clean = tags
    .map((t) => ({ name: t.name.trim().slice(0, 30), color: /^#[0-9a-fA-F]{6}$/.test(t.color) ? t.color : "#8b96a8" }))
    .filter((t) => t.name);
  const unique = [...new Map(clean.map((t) => [t.name.toLowerCase(), t])).values()];

  try {
    await setSetting("student_tags", { tags: unique }, profile.user_id);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Erro ao salvar." };
  }

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "config.tags", entityType: "config", entityId: "student_tags",
    entityLabel: "catálogo de tags", after: { tags: unique },
  });
  revalidatePath("/admin/segmentos");
  revalidatePath("/admin/alunos");
  return { ok: true, message: "Catálogo de tags salvo." };
}

/** Renomeia/remove uma tag em todos os alunos que a possuem. */
export async function removeTagEverywhereAction(name: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { data: students } = await db.from("users_profile").select("user_id, tags").overlaps("tags", [name]).limit(10000);
  for (const s of students ?? []) {
    await db
      .from("users_profile")
      .update({ tags: ((s.tags ?? []) as string[]).filter((t) => t !== name) })
      .eq("user_id", s.user_id);
  }

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "config.tag_remover", entityType: "config", entityId: "student_tags",
    entityLabel: name, before: { name, alunos: (students ?? []).length },
  });
  revalidatePath("/admin/segmentos");
  revalidatePath("/admin/alunos");
  return { ok: true, message: `Tag "${name}" removida de ${(students ?? []).length} alunos.` };
}

/* ---------- Lixeira ---------- */

const TRASH_TABLES: Record<string, { table: string; labelCol: string; paths: string[] }> = {
  look: { table: "looks", labelCol: "title", paths: ["/combinacoes", "/admin/conteudo/looks"] },
  peca: { table: "wardrobe_items", labelCol: "name", paths: ["/guarda-roupa", "/admin/conteudo/pecas"] },
  modulo: { table: "modules", labelCol: "title", paths: ["/metodo", "/admin/conteudo/metodo"] },
  aula: { table: "lessons", labelCol: "title", paths: ["/metodo", "/admin/conteudo/metodo"] },
  link: { table: "tracking_links", labelCol: "slug", paths: ["/admin/crescimento/links"] },
};

export async function restoreFromTrashAction(kind: string, id: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const cfg = TRASH_TABLES[kind];
  if (!cfg) return { ok: false, message: "Tipo desconhecido." };
  const db = createAdminClient();

  const { data: row } = await db.from(cfg.table).select(cfg.labelCol).eq("id", id).maybeSingle();
  const { error } = await db.from(cfg.table).update({ deleted_at: null }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `${kind}.restaurar`, entityType: kind, entityId: id,
    entityLabel: (row as Record<string, string> | null)?.[cfg.labelCol] ?? null,
  });
  for (const p of cfg.paths) revalidatePath(p);
  revalidatePath("/admin/sistema/lixeira");
  return { ok: true, message: "Registro restaurado." };
}

export async function purgeFromTrashAction(kind: string, id: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const cfg = TRASH_TABLES[kind];
  if (!cfg) return { ok: false, message: "Tipo desconhecido." };
  const db = createAdminClient();

  const { data: row } = await db.from(cfg.table).select(cfg.labelCol).eq("id", id).maybeSingle();
  const { error } = await db.from(cfg.table).delete().eq("id", id).not("deleted_at", "is", null);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `${kind}.excluir_definitivo`, entityType: kind, entityId: id,
    entityLabel: (row as Record<string, string> | null)?.[cfg.labelCol] ?? null,
  });
  revalidatePath("/admin/sistema/lixeira");
  return { ok: true, message: "Excluído definitivamente." };
}
