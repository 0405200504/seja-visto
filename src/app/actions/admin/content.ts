"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { paramsFromQueryString, toCsv } from "@/lib/admin/list";
import {
  OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS,
  WARDROBE_CATEGORIES, PRIORITIES,
} from "@/lib/constants";

type Result = { ok: boolean; message: string };

function revalidateContent() {
  revalidatePath("/combinacoes");
  revalidatePath("/guarda-roupa");
  revalidatePath("/metodo");
  revalidatePath("/admin/conteudo/looks");
  revalidatePath("/admin/conteudo/pecas");
  revalidatePath("/admin/conteudo/metodo");
}

async function audit(action: string, entityType: string, entityId: string | null, entityLabel: string | null, before?: unknown, after?: unknown) {
  const { profile } = await requireAdmin();
  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action, entityType, entityId, entityLabel, before, after,
  });
}

/* ================= LOOKS ================= */

const LOOK_ENUMS: Record<string, Record<string, string>> = {
  occasion: OCCASIONS,
  style: STYLES,
  climate: CLIMATES,
  level: LEVELS,
  base_color: BASE_COLORS,
};

export async function updateLookFieldAction(id: string, field: string, value: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (field === "title") {
    if (!value.trim()) return { ok: false, message: "O título não pode ficar vazio." };
    patch.title = value.trim();
  } else if (["description", "why_it_works", "image_url"].includes(field)) {
    patch[field] = value.trim() || null;
  } else if (field === "pieces" || field === "adaptations") {
    patch[field] = value.split("\n").map((l) => l.trim()).filter(Boolean);
  } else if (field in LOOK_ENUMS) {
    if (!(value in LOOK_ENUMS[field])) return { ok: false, message: "Valor inválido." };
    patch[field] = value;
  } else {
    return { ok: false, message: "Campo não editável." };
  }

  const { data: before } = await db.from("looks").select(`title, ${field}`).eq("id", id).maybeSingle();
  const { error } = await db.from("looks").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(`look.editar_${field}`, "look", id, (before as { title?: string } | null)?.title ?? null, before, patch);
  revalidateContent();
  return { ok: true, message: "Salvo." };
}

export async function createLookAction(input: {
  title: string; occasion: string; style: string; climate: string; level: string; base_color: string;
}): Promise<Result & { id?: string }> {
  await requireAdmin();
  if (!input.title.trim()) return { ok: false, message: "Dê um título ao look." };
  for (const key of ["occasion", "style", "climate", "level", "base_color"] as const) {
    if (!(input[key] in LOOK_ENUMS[key])) return { ok: false, message: "Preencha todos os campos." };
  }
  const db = createAdminClient();
  const { data, error } = await db
    .from("looks")
    .insert({ ...input, title: input.title.trim(), pieces: [], adaptations: [] })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("look.criar", "look", data.id, input.title, undefined, input);
  revalidateContent();
  return { ok: true, message: "Look criado — complete os detalhes.", id: data.id };
}

export async function duplicateLookAction(id: string): Promise<Result & { id?: string }> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: look } = await db.from("looks").select("*").eq("id", id).maybeSingle();
  if (!look) return { ok: false, message: "Look não encontrado." };

  const { id: _omit, created_at: _omit2, deleted_at: _omit3, ...rest } = look;
  void _omit; void _omit2; void _omit3;
  const { data, error } = await db
    .from("looks")
    .insert({ ...rest, title: `${look.title} (cópia)` })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("look.duplicar", "look", data.id, `${look.title} (cópia)`);
  revalidateContent();
  return { ok: true, message: "Look duplicado.", id: data.id };
}

export async function bulkLooksAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 1000);
  if (!ids.length) return { ok: false, message: "Nada selecionado." };

  if (actionId === "excluir") {
    const { error } = await db.from("looks").update({ deleted_at: new Date().toISOString() }).in("id", ids);
    if (error) return { ok: false, message: error.message };
    await audit("look.bulk_excluir", "look", null, `${ids.length} looks`, { ids });
    revalidateContent();
    return { ok: true, message: `${ids.length} looks movidos para a lixeira (30 dias para restaurar).` };
  }
  if (actionId === "restaurar") {
    const { error } = await db.from("looks").update({ deleted_at: null }).in("id", ids);
    if (error) return { ok: false, message: error.message };
    await audit("look.bulk_restaurar", "look", null, `${ids.length} looks`, { ids });
    revalidateContent();
    return { ok: true, message: `${ids.length} looks restaurados.` };
  }
  if (actionId === "duplicar") {
    if (ids.length > 20) return { ok: false, message: "Duplique no máximo 20 por vez." };
    for (const id of ids) await duplicateLookAction(id);
    return { ok: true, message: `${ids.length} looks duplicados.` };
  }
  return { ok: false, message: "Ação desconhecida." };
}

export async function csvLooksAction(queryString: string) {
  await requireAdmin();
  const { fetchLooks } = await import("@/lib/admin/queries/looks");
  const params = paramsFromQueryString(queryString, { sort: "created_at.desc" });
  const { rows } = await fetchLooks(params);
  const content = toCsv(
    ["Título", "Estilo", "Ocasião", "Clima", "Nível", "Cor base", "Peças", "Tem imagem", "Curtidas", "Criado em"],
    rows.map((r) => [
      r.title, STYLES[r.style] ?? r.style, OCCASIONS[r.occasion] ?? r.occasion,
      CLIMATES[r.climate] ?? r.climate, LEVELS[r.level] ?? r.level, BASE_COLORS[r.base_color] ?? r.base_color,
      (r.pieces ?? []).join(" | "), r.image_url ? "sim" : "não", r.likes,
      new Date(r.created_at).toLocaleDateString("pt-BR"),
    ])
  );
  return { filename: `looks-${new Date().toISOString().slice(0, 10)}.csv`, content };
}

/* ================= PEÇAS ================= */

export async function updateWardrobeFieldAction(id: string, field: string, value: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (field === "name") {
    if (!value.trim()) return { ok: false, message: "O nome não pode ficar vazio." };
    patch.name = value.trim();
  } else if (["description", "how_to_use", "image_url"].includes(field)) {
    patch[field] = value.trim() || null;
  } else if (field === "category") {
    if (!(value in WARDROBE_CATEGORIES)) return { ok: false, message: "Categoria inválida." };
    patch.category = value;
  } else if (field === "priority") {
    if (!(value in PRIORITIES)) return { ok: false, message: "Prioridade inválida." };
    patch.priority = value;
  } else {
    return { ok: false, message: "Campo não editável." };
  }

  const { data: before } = await db.from("wardrobe_items").select("name").eq("id", id).maybeSingle();
  const { error } = await db.from("wardrobe_items").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(`peca.editar_${field}`, "peca", id, before?.name ?? null, before, patch);
  revalidateContent();
  return { ok: true, message: "Salvo." };
}

export async function createWardrobeAction(input: { name: string; category: string; priority: string }): Promise<Result & { id?: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { ok: false, message: "Dê um nome à peça." };
  if (!(input.category in WARDROBE_CATEGORIES) || !(input.priority in PRIORITIES)) {
    return { ok: false, message: "Escolha categoria e prioridade." };
  }
  const db = createAdminClient();
  const { data, error } = await db.from("wardrobe_items").insert({ ...input, name: input.name.trim() }).select("id").single();
  if (error) return { ok: false, message: error.message };

  await audit("peca.criar", "peca", data.id, input.name);
  revalidateContent();
  return { ok: true, message: "Peça criada — complete os detalhes.", id: data.id };
}

export async function bulkWardrobeAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 500);
  if (!ids.length) return { ok: false, message: "Nada selecionado." };

  if (actionId === "excluir" || actionId === "restaurar") {
    const deletedAt = actionId === "excluir" ? new Date().toISOString() : null;
    const { error } = await db.from("wardrobe_items").update({ deleted_at: deletedAt }).in("id", ids);
    if (error) return { ok: false, message: error.message };
    await audit(`peca.bulk_${actionId}`, "peca", null, `${ids.length} peças`, { ids });
    revalidateContent();
    return {
      ok: true,
      message: actionId === "excluir" ? `${ids.length} peças movidas para a lixeira.` : `${ids.length} peças restauradas.`,
    };
  }
  return { ok: false, message: "Ação desconhecida." };
}

/* ================= MÓDULOS & AULAS ================= */

export async function createModuleAction(title: string): Promise<Result & { id?: string }> {
  await requireAdmin();
  if (!title.trim()) return { ok: false, message: "Dê um título ao módulo." };
  const db = createAdminClient();
  const { data: last } = await db.from("modules").select("order_index").order("order_index", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("modules")
    .insert({ title: title.trim(), order_index: (last?.order_index ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("modulo.criar", "modulo", data.id, title);
  revalidateContent();
  return { ok: true, message: "Módulo criado.", id: data.id };
}

export async function updateModuleFieldAction(id: string, field: string, value: string): Promise<Result> {
  await requireAdmin();
  if (!["title", "description", "cover_image_url"].includes(field)) return { ok: false, message: "Campo não editável." };
  if (field === "title" && !value.trim()) return { ok: false, message: "O título não pode ficar vazio." };

  const db = createAdminClient();
  const { data: before } = await db.from("modules").select("title").eq("id", id).maybeSingle();
  const { error } = await db.from("modules").update({ [field]: value.trim() || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(`modulo.editar_${field}`, "modulo", id, before?.title ?? null, before, { [field]: value });
  revalidateContent();
  return { ok: true, message: "Salvo." };
}

export async function deleteModuleAction(id: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: mod } = await db.from("modules").select("title").eq("id", id).maybeSingle();
  const now = new Date().toISOString();
  const { error } = await db.from("modules").update({ deleted_at: now }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await db.from("lessons").update({ deleted_at: now }).eq("module_id", id).is("deleted_at", null);

  await audit("modulo.excluir", "modulo", id, mod?.title ?? null);
  revalidateContent();
  return { ok: true, message: `Módulo "${mod?.title}" e suas aulas foram para a lixeira.` };
}

export async function restoreModuleAction(id: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("modules").update({ deleted_at: null }).eq("id", id);
  await db.from("lessons").update({ deleted_at: null }).eq("module_id", id);
  await audit("modulo.restaurar", "modulo", id, null);
  revalidateContent();
  return { ok: true, message: "Módulo restaurado." };
}

export async function reorderModulesAction(ids: string[]): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await db.from("modules").update({ order_index: i + 1 }).eq("id", ids[i]);
    if (error) return { ok: false, message: error.message };
  }
  await audit("modulo.reordenar", "modulo", null, `${ids.length} módulos`, undefined, { ids });
  revalidateContent();
  return { ok: true, message: "Ordem salva." };
}

export async function createLessonAction(moduleId: string, title: string): Promise<Result & { id?: string }> {
  await requireAdmin();
  if (!title.trim()) return { ok: false, message: "Dê um título à aula." };
  const db = createAdminClient();
  const { data: last } = await db
    .from("lessons").select("order_index").eq("module_id", moduleId)
    .order("order_index", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("lessons")
    .insert({ module_id: moduleId, title: title.trim(), order_index: (last?.order_index ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await audit("aula.criar", "aula", data.id, title);
  revalidateContent();
  revalidatePath(`/admin/conteudo/metodo/${moduleId}`);
  return { ok: true, message: "Aula criada.", id: data.id };
}

export async function updateLessonFieldAction(id: string, field: string, value: string): Promise<Result> {
  await requireAdmin();
  if (!["title", "content"].includes(field)) return { ok: false, message: "Campo não editável." };
  if (field === "title" && !value.trim()) return { ok: false, message: "O título não pode ficar vazio." };

  const db = createAdminClient();
  const { data: before } = await db.from("lessons").select("title, module_id").eq("id", id).maybeSingle();
  const { error } = await db.from("lessons").update({ [field]: field === "content" ? value : value.trim() }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit(`aula.editar_${field}`, "aula", id, before?.title ?? null);
  revalidateContent();
  if (before?.module_id) revalidatePath(`/admin/conteudo/metodo/${before.module_id}`);
  return { ok: true, message: "Salvo." };
}

export async function deleteLessonAction(id: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  const { data: lesson } = await db.from("lessons").select("title, module_id").eq("id", id).maybeSingle();
  const { error } = await db.from("lessons").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await audit("aula.excluir", "aula", id, lesson?.title ?? null);
  revalidateContent();
  if (lesson?.module_id) revalidatePath(`/admin/conteudo/metodo/${lesson.module_id}`);
  return { ok: true, message: `Aula "${lesson?.title}" foi para a lixeira.` };
}

export async function restoreLessonAction(id: string): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("lessons").update({ deleted_at: null }).eq("id", id);
  await audit("aula.restaurar", "aula", id, null);
  revalidateContent();
  return { ok: true, message: "Aula restaurada." };
}

export async function reorderLessonsAction(moduleId: string, ids: string[]): Promise<Result> {
  await requireAdmin();
  const db = createAdminClient();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await db.from("lessons").update({ order_index: i + 1 }).eq("id", ids[i]).eq("module_id", moduleId);
    if (error) return { ok: false, message: error.message };
  }
  await audit("aula.reordenar", "aula", null, `${ids.length} aulas`, undefined, { moduleId, ids });
  revalidateContent();
  revalidatePath(`/admin/conteudo/metodo/${moduleId}`);
  return { ok: true, message: "Ordem das aulas salva." };
}
