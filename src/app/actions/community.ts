"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireProfile, requireUser } from "@/lib/auth";

export type ReactionTarget = { fitId?: string; lookId?: string };
export type ReactionKind = "like" | "save";

function targetPaths(target: ReactionTarget): string[] {
  return target.fitId
    ? ["/combinacoes/comunidade", `/combinacoes/comunidade/${target.fitId}`]
    : ["/combinacoes", `/combinacoes/${target.lookId}`];
}

/* ---------- Envio de fits pelos alunos ---------- */

export async function submitFit(imagePath: string, caption: string) {
  const { supabase, user, profile } = await requireProfile();

  // A foto precisa estar na pasta do próprio usuário no bucket.
  if (!imagePath.startsWith(`${user.id}/`)) {
    throw new Error("Caminho de imagem inválido.");
  }

  const { error } = await supabase.from("community_fits").insert({
    user_id: user.id,
    author_name: profile.name,
    image_path: imagePath,
    caption: caption.trim().slice(0, 300) || null,
  });

  if (error) throw new Error(`Erro ao enviar o fit: ${error.message}`);

  revalidatePath("/combinacoes/comunidade");
  revalidatePath("/admin/fits");
}

export async function deleteFit(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "");

  const { data: fit } = await supabase
    .from("community_fits")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (!fit) return;

  // A RLS garante que só o dono ou o admin apagam. Mas quando ela bloqueia,
  // o delete devolve 0 linhas SEM erro — antes o código seguia adiante
  // achando que tinha dado certo.
  const { data: apagados, error } = await supabase
    .from("community_fits")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`Erro ao excluir o fit: ${error.message}`);
  if (!apagados?.length) throw new Error("Você não pode excluir este fit.");

  await supabase.storage.from("fits").remove([fit.image_path]);

  revalidatePath("/combinacoes/comunidade");
  revalidatePath("/favoritos");
  revalidatePath("/admin/fits");
  if (redirectTo) redirect(redirectTo);
}

/* ---------- Curtir / salvar ---------- */

export async function toggleReaction(
  target: ReactionTarget,
  kind: ReactionKind,
  isActive: boolean
) {
  const { supabase, user } = await requireUser();

  const column = target.fitId ? "fit_id" : "look_id";
  const id = target.fitId ?? target.lookId;
  if (!id) throw new Error("Alvo da reação inválido.");

  if (isActive) {
    await supabase
      .from("fit_reactions")
      .delete()
      .eq("user_id", user.id)
      .eq(column, id)
      .eq("kind", kind);
  } else {
    await supabase
      .from("fit_reactions")
      .upsert(
        { user_id: user.id, [column]: id, kind },
        { onConflict: `user_id,${column},kind`, ignoreDuplicates: true }
      );
  }

  for (const path of targetPaths(target)) revalidatePath(path);
  if (kind === "save") revalidatePath("/favoritos");
}

/* ---------- Comentários ---------- */

export async function addComment(target: ReactionTarget, content: string) {
  const { supabase, user, profile } = await requireProfile();

  const clean = content.trim().slice(0, 500);
  if (!clean) return;

  const column = target.fitId ? "fit_id" : "look_id";
  const id = target.fitId ?? target.lookId;
  if (!id) throw new Error("Alvo do comentário inválido.");

  const { error } = await supabase.from("fit_comments").insert({
    user_id: user.id,
    author_name: profile.name,
    [column]: id,
    content: clean,
  });

  if (error) throw new Error(`Erro ao comentar: ${error.message}`);

  for (const path of targetPaths(target)) revalidatePath(path);
}

export async function deleteComment(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");

  const { data: comment } = await supabase
    .from("fit_comments")
    .select("look_id, fit_id")
    .eq("id", id)
    .maybeSingle();
  if (!comment) return;

  // RLS garante que só o autor ou o admin conseguem apagar.
  await supabase.from("fit_comments").delete().eq("id", id);

  const target: ReactionTarget = comment.fit_id
    ? { fitId: comment.fit_id }
    : { lookId: comment.look_id ?? undefined };
  for (const path of targetPaths(target)) revalidatePath(path);
}

/* ---------- Moderação (admin) ---------- */

export async function moderateFit(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "rejected"].includes(status)) {
    throw new Error("Ação de moderação inválida.");
  }

  const { error } = await supabase
    .from("community_fits")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(`Erro ao moderar o fit: ${error.message}`);

  revalidatePath("/admin/fits");
  revalidatePath("/combinacoes/comunidade");
}
