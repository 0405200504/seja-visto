"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { ALL_ENTITLEMENT_KEYS, BONUSES } from "@/lib/bonuses";
import { enviarEmailDeAcesso } from "@/lib/email/acesso";

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

/**
 * Reenvia o e-mail de acesso, com um link de senha novo.
 *
 * É a saída manual para quando o envio automático falhou (provedor fora do
 * ar, caixa cheia, e-mail digitado errado e corrigido depois). Não cria
 * conta, não mexe em acesso e não reaproveita link antigo.
 *
 * A chave de idempotência leva a hora do clique: o envio automático
 * continua acontecendo uma única vez, e o reenvio manual — que é uma
 * decisão sua — nunca fica travado por ela.
 */
export async function reenviarEmailAcessoAction(userId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const { data: aluno } = await db
    .from("users_profile")
    .select("email, name")
    .eq("user_id", userId)
    .maybeSingle<{ email: string | null; name: string | null }>();

  if (!aluno?.email) return { ok: false, message: "Este aluno não tem e-mail cadastrado." };

  const envio = await enviarEmailDeAcesso(db, {
    userId,
    email: aluno.email,
    nome: aluno.name,
    chave: `acesso:user:${userId}:manual:${Date.now()}`,
  });

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.reenviar_email_acesso",
    entityType: "aluno",
    entityId: userId,
    entityLabel: aluno.name ?? aluno.email,
    after: { enviado: envio.enviado, via: envio.via ?? null },
  });

  if (!envio.enviado) {
    return { ok: false, message: `O e-mail não saiu: ${envio.motivo ?? "motivo desconhecido"}` };
  }
  revalidatePath(`/admin/alunos/${userId}`);
  return { ok: true, message: `E-mail de acesso reenviado para ${aluno.email}.` };
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

/* ---------- criação de conta pelo admin ---------- */

/**
 * Cria uma conta nova para um membro diretamente pelo painel.
 *
 * Fluxo:
 *  1. Cria o usuário no Supabase Auth (e-mail já confirmado).
 *  2. Garante que o perfil existe na users_profile.
 *  3. Gera um link de recuperação (define senha) e envia o e-mail de acesso.
 *
 * A senha inicial é aleatória e nunca é revelada ao admin — o membro
 * define a própria senha ao clicar no link do e-mail.
 */
export async function createMemberAction(email: string, name?: string): Promise<Result> {
  const { profile } = await requireAdmin();

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, message: "E-mail inválido." };
  }

  const db = createAdminClient();

  // Senha aleatória forte — nunca é revelada ao admin nem ao membro.
  const tempPassword =
    Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 32) + "A1!";

  const { data: newUser, error: createError } = await db.auth.admin.createUser({
    email: trimmedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: name?.trim() || undefined },
  });

  if (createError) {
    if (createError.message?.toLowerCase().includes("already") ||
        createError.message?.toLowerCase().includes("exists")) {
      return { ok: false, message: "Já existe uma conta com esse e-mail." };
    }
    return { ok: false, message: `Erro ao criar conta: ${createError.message}` };
  }

  const userId = newUser.user.id;
  const cleanName = name?.trim() || null;

  // Garante perfil na users_profile
  await db.from("users_profile").upsert(
    {
      user_id: userId,
      email: trimmedEmail,
      name: cleanName,
      onboarding_completed: false,
      is_admin: false,
      tags: [],
    },
    { onConflict: "user_id" }
  );

  // Link de criar senha (30 dias) + e-mail de acesso, uma coisa só.
  const envio = await enviarEmailDeAcesso(db, {
    userId,
    email: trimmedEmail,
    nome: cleanName,
    chave: `acesso:user:${userId}`,
  });

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "aluno.criar_conta",
    entityType: "aluno",
    entityId: userId,
    entityLabel: cleanName ?? trimmedEmail,
    after: { email: trimmedEmail, emailEnviado: envio.enviado, via: envio.via ?? null },
  });

  revalidatePath("/admin/alunos");

  if (!envio.enviado) {
    return {
      ok: true,
      message: `Conta criada para ${trimmedEmail}, mas o e-mail não saiu (${envio.motivo ?? "motivo desconhecido"}). Use "Reenviar e-mail de acesso" na página do aluno.`,
    };
  }

  return { ok: true, message: `Conta criada e e-mail de acesso enviado para ${trimmedEmail}.` };
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
