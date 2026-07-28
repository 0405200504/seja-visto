"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";

type Result = { ok: boolean; message: string };

export async function createTrackingLinkAction2(input: {
  slug: string;
  destinationUrl: string;
  description: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}): Promise<Result> {
  const { profile } = await requireAdmin();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  let destination = input.destinationUrl.trim();
  if (!slug || !destination) return { ok: false, message: "Slug e URL de destino são obrigatórios." };
  if (!/^https?:\/\//.test(destination)) destination = `https://${destination}`;

  try {
    const url = new URL(destination);
    if (input.utmSource.trim()) url.searchParams.set("utm_source", input.utmSource.trim());
    if (input.utmMedium.trim()) url.searchParams.set("utm_medium", input.utmMedium.trim());
    if (input.utmCampaign.trim()) url.searchParams.set("utm_campaign", input.utmCampaign.trim());
    destination = url.toString();
  } catch {
    return { ok: false, message: "URL de destino inválida." };
  }

  const db = createAdminClient();
  const { data: existing } = await db.from("tracking_links").select("id, deleted_at").eq("slug", slug).maybeSingle();
  if (existing && !existing.deleted_at) return { ok: false, message: `O slug "${slug}" já existe.` };
  if (existing) await db.from("tracking_links").delete().eq("id", existing.id);

  const { error } = await db.from("tracking_links").insert({
    slug,
    destination_url: destination,
    description: input.description.trim() || null,
    clicks_count: 0,
  });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "link.criar", entityType: "link", entityId: slug, entityLabel: `/l/${slug}`,
    after: { slug, destination },
  });
  revalidatePath("/admin/crescimento/links");
  return { ok: true, message: `Link /l/${slug} criado.` };
}

export async function updateLinkFieldAction(id: string, field: string, value: string): Promise<Result> {
  const { profile } = await requireAdmin();
  if (!["destination_url", "description"].includes(field)) return { ok: false, message: "Campo não editável." };
  if (field === "destination_url" && value && !/^https?:\/\//.test(value)) value = `https://${value}`;

  const db = createAdminClient();
  const { data: before } = await db.from("tracking_links").select("slug, destination_url, description").eq("id", id).maybeSingle();
  const { error } = await db.from("tracking_links").update({ [field]: value.trim() || null }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `link.editar_${field}`, entityType: "link", entityId: id,
    entityLabel: before ? `/l/${before.slug}` : null, before, after: { [field]: value },
  });
  revalidatePath("/admin/crescimento/links");
  return { ok: true, message: "Salvo." };
}

export async function bulkLinksAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 200);
  if (!ids.length) return { ok: false, message: "Nada selecionado." };

  if (actionId === "excluir" || actionId === "restaurar") {
    const deletedAt = actionId === "excluir" ? new Date().toISOString() : null;
    const { error } = await db.from("tracking_links").update({ deleted_at: deletedAt }).in("id", ids);
    if (error) return { ok: false, message: error.message };
    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: `link.bulk_${actionId}`, entityType: "link",
      entityLabel: `${ids.length} links`, after: { ids },
    });
    revalidatePath("/admin/crescimento/links");
    return {
      ok: true,
      message:
        actionId === "excluir"
          ? `${ids.length} links desativados (o histórico de cliques fica guardado; /l/slug passa a cair na home).`
          : `${ids.length} links reativados.`,
    };
  }
  return { ok: false, message: "Ação desconhecida." };
}
