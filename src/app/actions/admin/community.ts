"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";

type Result = { ok: boolean; message: string };

function revalidateCommunity() {
  revalidatePath("/combinacoes/comunidade");
  revalidatePath("/admin/comunidade");
  revalidatePath("/admin", "layout"); // badge da sidebar
}

export async function bulkFitsAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 500);
  if (!ids.length) return { ok: false, message: "Nada selecionado." };

  if (actionId === "aprovar" || actionId === "recusar" || actionId === "pendente") {
    const status = actionId === "aprovar" ? "approved" : actionId === "recusar" ? "rejected" : "pending";
    const { error } = await db.from("community_fits").update({ status }).in("id", ids);
    if (error) return { ok: false, message: error.message };

    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: `fit.${actionId}`, entityType: "fit",
      entityLabel: `${ids.length} fits`, after: { ids, status },
    });
    revalidateCommunity();
    const verbo = actionId === "aprovar" ? "aprovados" : actionId === "recusar" ? "recusados" : "de volta para pendentes";
    return { ok: true, message: `${ids.length} fits ${verbo}.` };
  }

  if (actionId === "excluir") {
    const { data: fits } = await db.from("community_fits").select("id, image_path").in("id", ids);
    const { error } = await db.from("community_fits").delete().in("id", ids);
    if (error) return { ok: false, message: error.message };
    const paths = (fits ?? []).map((f) => f.image_path).filter(Boolean);
    if (paths.length) await db.storage.from("fits").remove(paths);

    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: "fit.excluir", entityType: "fit",
      entityLabel: `${ids.length} fits`, before: { ids },
    });
    revalidateCommunity();
    return { ok: true, message: `${ids.length} fits excluídos definitivamente (foto incluída).` };
  }

  return { ok: false, message: "Ação desconhecida." };
}

export async function deleteFitCommentAction(commentId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { data: before } = await db.from("fit_comments").select("content, author_name").eq("id", commentId).maybeSingle();
  const { error } = await db.from("fit_comments").delete().eq("id", commentId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "comentario.excluir", entityType: "comentario", entityId: commentId,
    entityLabel: before?.author_name ?? null, before,
  });
  revalidateCommunity();
  return { ok: true, message: "Comentário removido." };
}
