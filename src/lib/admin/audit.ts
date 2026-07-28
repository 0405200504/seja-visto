import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEntry = {
  actorId: string;
  actorEmail: string | null;
  /** ex: "look.editar", "aluno.revogar_acesso" */
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Grava uma linha no log de auditoria. Nunca lança erro — auditoria não pode
 * derrubar a ação principal; falhas vão para o console do servidor.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;

    const admin = createAdminClient();
    const { error } = await admin.from("audit_log").insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      entity_label: entry.entityLabel ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ip,
    });
    if (error) console.error("audit_log:", error.message);
  } catch (err) {
    console.error("audit_log:", err);
  }
}
