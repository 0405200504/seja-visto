"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { ALL_ENTITLEMENT_KEYS, BONUSES } from "@/lib/bonuses";

type Result = { ok: boolean; message: string };

const EDITABLE_FIELDS = new Set(["name", "admin_notes", "style_goal", "preferred_style", "main_difficulty"]);

async function studentLabel(userId: string): Promise<string> {
  const db = createAdminClient();
  const { data } = await db.from("users_profile").select("name, email").eq("user_id", userId).maybeSingle();
  return data?.name ?? data?.email ?? userId;
}

export async function updateStudentFieldAction(userId: string, field: string, value: string): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!EDITABLE_FIELDS.has(field)) return { ok: false, message: "Campo não editável." };

  const db = createAdminClient();
  const { data: before } = await db.from("users_profile").select(field).eq("user_id", userId).maybeSingle();
  const { error } = await db
    .from("users_profile")
    .update({ [field]: value || null })
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: `aluno.editar_${field}`,
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    before,
    after: { [field]: value },
  });
  revalidatePath("/admin/alunos");
  return { ok: true, message: "Salvo." };
}

export async function setStudentTagsAction(userId: string, tags: string[]): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const clean = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 12);

  const { data: before } = await db.from("users_profile").select("tags").eq("user_id", userId).maybeSingle();
  const { error } = await db.from("users_profile").update({ tags: clean }).eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.tags",
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    before,
    after: { tags: clean },
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: "Tags atualizadas." };
}

export async function grantEntitlementAction(
  userId: string,
  entitlement: string,
  validityDays?: number | null
): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!ALL_ENTITLEMENT_KEYS.includes(entitlement) && !/^tokens[-:_]?\d+$/.test(entitlement)) {
    return { ok: false, message: "Produto ou bônus inválido." };
  }
  const db = createAdminClient();

  let expiresAt: string | null = null;
  if (validityDays != null) {
    const { data: existing } = await db
      .from("user_entitlements")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("entitlement", entitlement)
      .maybeSingle();
    const base =
      existing?.expires_at && new Date(existing.expires_at) > new Date()
        ? new Date(existing.expires_at)
        : new Date();
    base.setDate(base.getDate() + validityDays);
    expiresAt = base.toISOString();
  }

  const rows =
    entitlement === "economize-58"
      ? [
          { user_id: userId, entitlement: "base", source: "admin:manual:pack-58", expires_at: expiresAt },
          { user_id: userId, entitlement: "economize-58", source: "admin:manual" },
          ...BONUSES.map((b) => ({ user_id: userId, entitlement: b.key, source: "admin:manual:pack-58" })),
        ]
      : [{ user_id: userId, entitlement, source: "admin:manual", expires_at: expiresAt }];

  const { error } = await db
    .from("user_entitlements")
    .upsert(rows, { onConflict: "user_id,entitlement", ignoreDuplicates: entitlement === "economize-58" });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.liberar_acesso",
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    after: { entitlement, validityDays: validityDays ?? "vitalício" },
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: `Acesso "${entitlement}" liberado.` };
}

export async function revokeEntitlementAction(userId: string, entitlement: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("user_entitlements")
    .delete()
    .eq("user_id", userId)
    .eq("entitlement", entitlement);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.revogar_acesso",
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    before: { entitlement },
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: `Acesso "${entitlement}" revogado.` };
}

export async function addTokensAction(userId: string, amount: number): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10000) {
    return { ok: false, message: "Quantidade inválida." };
  }
  const db = createAdminClient();
  const { data, error } = await db.rpc("add_fit_check_credits", { p_user: userId, p_amount: amount });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.adicionar_tokens",
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    after: { amount, novo_saldo: data },
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: `${amount > 0 ? "+" : ""}${amount} tokens · novo saldo: ${data}.` };
}

export async function toggleAdminAction(userId: string, isAdmin: boolean): Promise<Result> {
  const { profile } = await requireAdmin();
  if (userId === profile.user_id && !isAdmin) {
    return { ok: false, message: "Você não pode remover o próprio acesso de admin." };
  }
  const db = createAdminClient();
  const { error } = await db.from("users_profile").update({ is_admin: isAdmin }).eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: isAdmin ? "aluno.tornar_admin" : "aluno.remover_admin",
    entityType: "aluno",
    entityId: userId,
    entityLabel: await studentLabel(userId),
    after: { is_admin: isAdmin },
  });
  revalidatePath("/admin/alunos");
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: isAdmin ? "Agora é admin." : "Privilégio de admin removido." };
}

export async function deleteStudentAction(userId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  if (userId === profile.user_id) return { ok: false, message: "Você não pode excluir a própria conta." };

  const label = await studentLabel(userId);
  const db = createAdminClient();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.excluir_conta",
    entityType: "aluno",
    entityId: userId,
    entityLabel: label,
    before: { conta: label },
  });
  revalidatePath("/admin/alunos");
  return { ok: true, message: `Conta de ${label} excluída definitivamente.` };
}

/* ---------- ações em massa da lista ---------- */

export async function bulkStudentsAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 500);
  if (ids.length === 0) return { ok: false, message: "Nenhum aluno selecionado." };

  if (actionId === "liberar_base") {
    const rows = ids.map((id) => ({ user_id: id, entitlement: "base", source: "admin:bulk" }));
    const { error } = await db
      .from("user_entitlements")
      .upsert(rows, { onConflict: "user_id,entitlement", ignoreDuplicates: true });
    if (error) return { ok: false, message: error.message };
    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: "aluno.bulk_liberar_base", entityType: "aluno",
      entityLabel: `${ids.length} alunos`, after: { ids },
    });
    return { ok: true, message: `Acesso base liberado para ${ids.length} alunos.` };
  }

  if (actionId === "tokens_10") {
    for (const id of ids) {
      await db.rpc("add_fit_check_credits", { p_user: id, p_amount: 10 });
    }
    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: "aluno.bulk_tokens", entityType: "aluno",
      entityLabel: `${ids.length} alunos`, after: { ids, amount: 10 },
    });
    return { ok: true, message: `+10 tokens para ${ids.length} alunos.` };
  }

  return { ok: false, message: "Ação desconhecida." };
}

/* ---------- export CSV (resultado filtrado) ---------- */

export async function csvStudentsAction(queryString: string) {
  await requireAdmin();
  const { fetchStudents } = await import("@/lib/admin/queries/students");
  const { paramsFromQueryString, toCsv } = await import("@/lib/admin/list");

  const params = paramsFromQueryString(queryString, { sort: "created_at.desc" });
  const { rows } = await fetchStudents(params);

  const content = toCsv(
    ["Nome", "E-mail", "Status", "Admin", "Onboarding", "Tags", "Objetivo", "Estilo", "Aulas concluídas", "Tokens", "Total gasto (R$)", "Cadastro", "Último acesso"],
    rows.map((r) => [
      r.name, r.email,
      r.hasBase ? "Ativo" : "Sem acesso",
      r.is_admin ? "sim" : "não",
      r.onboarding_completed ? "completo" : "incompleto",
      r.tags.join(", "),
      r.style_goal, r.preferred_style,
      r.lessonsDone,
      r.tokenBalance ?? "",
      (r.totalSpentCents / 100).toFixed(2).replace(".", ","),
      new Date(r.created_at).toLocaleDateString("pt-BR"),
      r.last_seen_at ? new Date(r.last_seen_at).toLocaleDateString("pt-BR") : "nunca",
    ])
  );

  return { filename: `alunos-${new Date().toISOString().slice(0, 10)}.csv`, content };
}
