import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateTime, relTime } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { WebhookActions } from "@/components/admin/system/webhook-actions";

export const dynamic = "force-dynamic";

type EventoRow = {
  event_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  user_email: string | null;
  created_at: string;
  payload: Record<string, unknown>;
};

function statusBadge(status: string) {
  if (status === "processed") return <Badge variant="success">processado</Badge>;
  if (status === "failed")
    return <Badge className="border-danger/30 bg-danger/10 text-danger">falhou</Badge>;
  if (status === "ignored") return <Badge variant="outline">resolvido à mão</Badge>;
  return <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">pendente</Badge>;
}

export default async function WebhooksPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [{ data: falhos }, { data: recentes }, { count: totalFalhos }] = await Promise.all([
    db
      .from("webhook_events")
      .select("*")
      .in("status", ["failed", "pending"])
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<EventoRow[]>(),
    db
      .from("webhook_events")
      .select("event_id, event_type, status, user_email, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("webhook_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  const comProblema = falhos ?? [];

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Webhooks da Cakto</h1>
        <p className="text-sm text-muted">
          Todo evento recebido fica registrado aqui, com o conteúdo completo. Serve
          para reprocessar uma compra que falhou e para conferir uma disputa com
          cliente.
        </p>
      </header>

      {/* ---------- Precisa de ação ---------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Precisam de ação
          {totalFalhos ? (
            <Badge className="border-danger/30 bg-danger/10 text-danger">{totalFalhos}</Badge>
          ) : null}
        </h2>

        {comProblema.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              Nenhum webhook pendente. Toda compra que chegou foi processada.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {comProblema.map((e) => (
              <li
                key={e.event_id}
                className="space-y-3 rounded-xl border border-danger/25 bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {e.user_email ?? "sem e-mail"}
                    </p>
                    <p className="text-xs text-muted-2">
                      {e.event_type} · {relTime(e.created_at)} · {dateTime(e.created_at)}
                    </p>
                  </div>
                  {statusBadge(e.status)}
                </div>

                {e.error_message && (
                  <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[11px] leading-relaxed text-danger">
                    {e.error_message}
                  </p>
                )}

                <WebhookActions eventId={e.event_id} />

                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted transition-colors hover:text-foreground">
                    Ver o conteúdo recebido
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Histórico ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Últimos eventos recebidos</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Cliente
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Evento
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Quando
                </th>
              </tr>
            </thead>
            <tbody>
              {(recentes ?? []).map((e) => (
                <tr key={e.event_id} className="border-b border-border last:border-0">
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-foreground">
                    {e.user_email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{e.event_type}</td>
                  <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                  <td className="px-4 py-2.5 text-muted-2">{relTime(e.created_at)}</td>
                </tr>
              ))}
              {(recentes ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Nenhum evento recebido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
