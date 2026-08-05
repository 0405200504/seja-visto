"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { baseDoSite } from "@/lib/site-url";

type Result = { ok: boolean; message: string };

/**
 * Reenvia o payload guardado para o próprio webhook, como se a Cakto
 * estivesse mandando de novo. O evento é marcado como pendente antes,
 * senão a trava de idempotência barraria o reprocessamento.
 */
export async function reprocessarWebhookAction(eventId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const { data: evento } = await db
    .from("webhook_events")
    .select("payload, event_type, user_email, status")
    .eq("provider", "cakto")
    .eq("event_id", eventId)
    .maybeSingle<{
      payload: Record<string, unknown>;
      event_type: string;
      user_email: string | null;
      status: string;
    }>();

  if (!evento) return { ok: false, message: "Evento não encontrado." };

  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: false, message: "CAKTO_WEBHOOK_SECRET não está configurado." };
  }

  // Libera a trava de idempotência só para esta reexecução.
  await db
    .from("webhook_events")
    .update({ status: "pending", error_message: null })
    .eq("provider", "cakto")
    .eq("event_id", eventId);

  const siteUrl = baseDoSite();

  // O segredo foi redigido antes de ir para o banco. Removemos a chave para o
  // webhook cair no header — senão ele leria "[redigido]" e recusaria.
  const payload = { ...evento.payload };
  delete payload.secret;

  try {
    const res = await fetch(`${siteUrl}/api/webhooks/cakto`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cakto-secret": secret },
      body: JSON.stringify(payload),
    });
    const corpo = await res.json().catch(() => ({}));

    await logAudit({
      actorId: profile.user_id,
      actorEmail: profile.email ?? null,
      action: "webhook.reprocessar",
      entityType: "webhook",
      entityId: eventId,
      entityLabel: evento.user_email ?? evento.event_type,
      after: { status: res.status, resposta: corpo },
    });

    revalidatePath("/admin/sistema/webhooks");

    if (!res.ok) {
      return { ok: false, message: `Falhou de novo (${res.status}). Veja o motivo na lista.` };
    }
    return { ok: true, message: "Reprocessado com sucesso." };
  } catch (err) {
    return {
      ok: false,
      message: `Não consegui reenviar: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Marca como resolvido à mão, quando você já liberou o acesso pelo admin. */
export async function marcarWebhookResolvidoAction(eventId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db
    .from("webhook_events")
    .update({ status: "ignored", error_message: "Resolvido manualmente pelo admin" })
    .eq("provider", "cakto")
    .eq("event_id", eventId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "webhook.resolver_manual",
    entityType: "webhook",
    entityId: eventId,
  });

  revalidatePath("/admin/sistema/webhooks");
  return { ok: true, message: "Marcado como resolvido." };
}
