"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { conferirAntesDeEnviar, type MensagemFila } from "@/lib/whatsapp/fila";
import { enviarTexto } from "@/lib/whatsapp/uazapi";
import { podeEnviarPara } from "@/lib/whatsapp/config";
import { mascararTelefone } from "@/lib/whatsapp/phone";

type Result = { ok: boolean; message: string };

/** Cancela uma mensagem que ainda não saiu. */
export async function cancelarMensagemAction(id: number): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const { data, error } = await db
    .from("whatsapp_messages")
    .update({
      status: "cancelled",
      skip_reason: "cancelada no painel pelo admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["scheduled", "failed"])
    .select("id, message_type")
    .maybeSingle<{ id: number; message_type: string }>();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Essa mensagem já saiu ou já estava cancelada." };

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "whatsapp.cancelar",
    entityType: "whatsapp",
    entityId: String(id),
    entityLabel: data.message_type,
  });
  revalidatePath("/admin/whatsapp");
  return { ok: true, message: "Mensagem cancelada." };
}

/**
 * Reenvio manual.
 *
 * Passa pelas MESMAS verificações do envio automático (opt-out,
 * consentimento, estado do carrinho/assinatura, modo de teste). Um clique
 * no painel não é atalho para furar as regras — se a mensagem não faz mais
 * sentido, o reenvio é recusado com o motivo.
 */
export async function reenviarMensagemAction(id: number): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const { data: msg } = await db
    .from("whatsapp_messages")
    .select("id, dedupe_key, message_type, contact_id, cart_id, subscription_id, plan, body, scheduled_for, status, attempts")
    .eq("id", id)
    .maybeSingle<MensagemFila>();

  if (!msg) return { ok: false, message: "Mensagem não encontrada." };
  if (msg.status === "sent") return { ok: false, message: "Essa mensagem já foi enviada." };

  const veredito = await conferirAntesDeEnviar(db, msg);
  if (!veredito.enviar) {
    return { ok: false, message: `Reenvio recusado: ${veredito.motivo}` };
  }

  const { data: contato } = await db
    .from("whatsapp_contacts")
    .select("phone")
    .eq("id", msg.contact_id)
    .maybeSingle<{ phone: string }>();
  if (!contato) return { ok: false, message: "Contato não encontrado." };

  const permissao = podeEnviarPara(contato.phone);
  if (!permissao.ok) return { ok: false, message: `Reenvio recusado: ${permissao.motivo}` };

  const envio = await enviarTexto(contato.phone, msg.body);
  const agora = new Date().toISOString();

  await db
    .from("whatsapp_messages")
    .update(
      envio.ok
        ? {
            status: "sent",
            provider_message_id: envio.providerMessageId,
            response_code: envio.codigo,
            sent_at: agora,
            updated_at: agora,
            attempts: msg.attempts + 1,
            error_message: null,
            error_category: null,
          }
        : {
            status: "failed",
            error_category: envio.categoria,
            error_message: envio.motivo.slice(0, 300),
            response_code: envio.codigo,
            next_attempt_at: null,
            updated_at: agora,
            attempts: msg.attempts + 1,
          }
    )
    .eq("id", id);

  await logAudit({
    actorId: profile.user_id,
    actorEmail: profile.email ?? null,
    action: "whatsapp.reenviar",
    entityType: "whatsapp",
    entityId: String(id),
    entityLabel: msg.message_type,
    after: { enviado: envio.ok, destino: mascararTelefone(contato.phone) },
  });
  revalidatePath("/admin/whatsapp");

  return envio.ok
    ? { ok: true, message: "Mensagem reenviada." }
    : { ok: false, message: `Não saiu: ${envio.motivo}` };
}
