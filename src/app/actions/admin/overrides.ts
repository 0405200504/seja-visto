"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import type { ContentKind } from "@/lib/content-overrides";

type Result = { ok: boolean; message: string };

const KINDS = new Set(["guia", "estilo", "glossario", "plano", "bonus", "quiz"]);

const STUDENT_PATHS: Record<string, string[]> = {
  guia: ["/guias"],
  estilo: ["/estilos"],
  glossario: ["/mais-procurados"],
  plano: ["/plano-de-acao"],
  bonus: ["/bonus"],
  quiz: ["/onboarding"],
};

function revalidateKind(kind: string) {
  for (const p of STUDENT_PATHS[kind] ?? []) revalidatePath(p, "layout");
  revalidatePath(`/admin/conteudo`, "layout");
}

export async function saveOverrideFieldAction(
  kind: ContentKind,
  slug: string,
  field: string,
  value: string
): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!KINDS.has(kind)) return { ok: false, message: "Tipo inválido." };
  const db = createAdminClient();

  const { data: existing } = await db
    .from("content_overrides")
    .select("patch")
    .eq("kind", kind)
    .eq("slug", slug)
    .maybeSingle();

  const patch = { ...((existing?.patch as Record<string, string>) ?? {}), [field]: value };
  const { error } = await db
    .from("content_overrides")
    .upsert({ kind, slug, patch, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `conteudo.${kind}.editar_${field}`, entityType: `conteudo:${kind}`,
    entityId: slug, entityLabel: slug, before: existing?.patch, after: patch,
  });
  revalidateKind(kind);
  return { ok: true, message: "Salvo." };
}

export async function setOverrideHiddenAction(kind: ContentKind, slug: string, hidden: boolean): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!KINDS.has(kind)) return { ok: false, message: "Tipo inválido." };
  const db = createAdminClient();

  const { error } = await db
    .from("content_overrides")
    .upsert({ kind, slug, hidden, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: hidden ? `conteudo.${kind}.ocultar` : `conteudo.${kind}.exibir`,
    entityType: `conteudo:${kind}`, entityId: slug, entityLabel: slug,
    after: { hidden },
  });
  revalidateKind(kind);
  return { ok: true, message: hidden ? "Item oculto para os alunos." : "Item visível de novo." };
}

export async function reorderOverridesAction(kind: ContentKind, slugs: string[]): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!KINDS.has(kind)) return { ok: false, message: "Tipo inválido." };
  const db = createAdminClient();

  for (let i = 0; i < slugs.length; i++) {
    const { error } = await db
      .from("content_overrides")
      .upsert({ kind, slug: slugs[i], order_index: i, updated_at: new Date().toISOString() });
    if (error) return { ok: false, message: error.message };
  }

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `conteudo.${kind}.reordenar`, entityType: `conteudo:${kind}`,
    entityLabel: `${slugs.length} itens`, after: { slugs },
  });
  revalidateKind(kind);
  return { ok: true, message: "Ordem salva." };
}

export async function resetOverrideAction(kind: ContentKind, slug: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("content_overrides").delete().eq("kind", kind).eq("slug", slug);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `conteudo.${kind}.restaurar_padrao`, entityType: `conteudo:${kind}`,
    entityId: slug, entityLabel: slug,
  });
  revalidateKind(kind);
  return { ok: true, message: "Item de volta ao texto original do produto." };
}
