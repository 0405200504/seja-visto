"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ALL_ENTITLEMENT_KEYS } from "@/lib/bonuses";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  OCCASIONS,
  STYLES,
  CLIMATES,
  LEVELS,
  BASE_COLORS,
  WARDROBE_CATEGORIES,
  PRIORITIES,
} from "@/lib/constants";

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function text(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v || null;
}

/* ---------- Looks ---------- */

export async function upsertLook(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    description: text(formData.get("description")),
    occasion: String(formData.get("occasion") ?? ""),
    style: String(formData.get("style") ?? ""),
    climate: String(formData.get("climate") ?? ""),
    level: String(formData.get("level") ?? ""),
    base_color: String(formData.get("base_color") ?? ""),
    image_url: text(formData.get("image_url")),
    pieces: lines(formData.get("pieces")),
    why_it_works: text(formData.get("why_it_works")),
    adaptations: lines(formData.get("adaptations")),
  };

  if (
    !payload.title ||
    !(payload.occasion in OCCASIONS) ||
    !(payload.style in STYLES) ||
    !(payload.climate in CLIMATES) ||
    !(payload.level in LEVELS) ||
    !(payload.base_color in BASE_COLORS)
  ) {
    throw new Error("Preencha todos os campos obrigatórios do look.");
  }

  const { error } = id
    ? await supabase.from("looks").update(payload).eq("id", id)
    : await supabase.from("looks").insert(payload);

  if (error) throw new Error(`Erro ao salvar look: ${error.message}`);

  revalidatePath("/combinacoes");
  revalidatePath("/admin/looks");
  redirect("/admin/looks");
}

export async function deleteLook(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("looks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/combinacoes");
  revalidatePath("/admin/looks");
}

/* ---------- Módulos ---------- */

export async function upsertModule(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    description: text(formData.get("description")),
    order_index: Number(formData.get("order_index") ?? 0),
    cover_image_url: text(formData.get("cover_image_url")),
  };

  if (!payload.title) throw new Error("O módulo precisa de um título.");

  const { data, error } = id
    ? await supabase.from("modules").update(payload).eq("id", id).select("id").single()
    : await supabase.from("modules").insert(payload).select("id").single();

  if (error) throw new Error(`Erro ao salvar módulo: ${error.message}`);

  revalidatePath("/metodo");
  revalidatePath("/admin/modulos");
  redirect(`/admin/modulos/${data.id}`);
}

export async function deleteModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("modules").delete().eq("id", String(formData.get("id")));
  revalidatePath("/metodo");
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos");
}

/* ---------- Aulas ---------- */

export async function upsertLesson(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const moduleId = String(formData.get("module_id") ?? "");
  const payload = {
    module_id: moduleId,
    title: String(formData.get("title") ?? "").trim(),
    content: text(formData.get("content")),
    order_index: Number(formData.get("order_index") ?? 0),
  };

  if (!payload.title || !moduleId) throw new Error("A aula precisa de título e módulo.");

  const { error } = id
    ? await supabase.from("lessons").update(payload).eq("id", id)
    : await supabase.from("lessons").insert(payload);

  if (error) throw new Error(`Erro ao salvar aula: ${error.message}`);

  revalidatePath("/metodo");
  revalidatePath(`/admin/modulos/${moduleId}`);
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const moduleId = String(formData.get("module_id") ?? "");
  await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
  revalidatePath("/metodo");
  revalidatePath(`/admin/modulos/${moduleId}`);
}

/* ---------- Peças do guarda-roupa ---------- */

export async function upsertWardrobeItem(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    description: text(formData.get("description")),
    how_to_use: text(formData.get("how_to_use")),
    image_url: text(formData.get("image_url")),
  };

  if (
    !payload.name ||
    !(payload.category in WARDROBE_CATEGORIES) ||
    !(payload.priority in PRIORITIES)
  ) {
    throw new Error("Preencha nome, categoria e prioridade da peça.");
  }

  const { error } = id
    ? await supabase.from("wardrobe_items").update(payload).eq("id", id)
    : await supabase.from("wardrobe_items").insert(payload);

  if (error) throw new Error(`Erro ao salvar peça: ${error.message}`);

  revalidatePath("/guarda-roupa");
  revalidatePath("/admin/pecas");
  redirect("/admin/pecas");
}

export async function deleteWardrobeItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("wardrobe_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/guarda-roupa");
  revalidatePath("/admin/pecas");
}

/* ---------- Vendas (Cakto) ---------- */

export async function upsertCaktoMapping(formData: FormData) {
  const { supabase } = await requireAdmin();

  const caktoId = String(formData.get("cakto_id") ?? "").trim();
  const entitlement = String(formData.get("entitlement") ?? "").trim();
  const label = text(formData.get("label"));

  if (!caktoId || !ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Informe o ID do produto na Cakto e escolha um produto/bônus válido.");
  }

  const { error } = await supabase
    .from("cakto_product_map")
    .upsert({ cakto_id: caktoId, entitlement, label });

  if (error) throw new Error(`Erro ao salvar mapeamento: ${error.message}`);
  revalidatePath("/admin/vendas");
}

export async function deleteCaktoMapping(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("cakto_product_map")
    .delete()
    .eq("cakto_id", String(formData.get("cakto_id")));
  revalidatePath("/admin/vendas");
}

export async function grantEntitlementManually(formData: FormData) {
  const { supabase } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const entitlement = String(formData.get("entitlement") ?? "").trim();

  if (!email || !ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Informe o e-mail do aluno e escolha um produto/bônus válido.");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) {
    throw new Error(`Nenhum aluno encontrado com o e-mail ${email}.`);
  }

  const { error } = await supabase
    .from("user_entitlements")
    .upsert(
      { user_id: profile.user_id, entitlement, source: "admin:manual" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );

  if (error) throw new Error(`Erro ao liberar acesso: ${error.message}`);
  revalidatePath("/admin/vendas");
}

/* ---------- Gerenciamento de Alunos ---------- */

export async function deleteStudentAction(userId: string) {
  await requireAdmin();
  
  // Como o usuário está em auth.users, precisamos usar a service_role
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Erro ao excluir aluno do sistema: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function grantStudentEntitlementAction(userId: string, entitlement: string) {
  const { supabase } = await requireAdmin();

  if (!ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Produto ou bônus inválido.");
  }

  const { error } = await supabase
    .from("user_entitlements")
    .upsert(
      { user_id: userId, entitlement, source: "admin:manual" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(`Erro ao liberar acesso: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function revokeStudentEntitlementAction(userId: string, entitlement: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("user_entitlements")
    .delete()
    .eq("user_id", userId)
    .eq("entitlement", entitlement);

  if (error) {
    throw new Error(`Erro ao revogar acesso: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function toggleAdminStatusAction(userId: string, isAdmin: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("users_profile")
    .update({ is_admin: isAdmin })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Erro ao atualizar privilégios do usuário: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}
