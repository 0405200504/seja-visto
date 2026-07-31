import Link from "next/link";
import { CheckCircle2, XCircle, MessageSquare, Clock, Ban, AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { configWhatsApp } from "@/lib/whatsapp/config";
import { statusInstancia } from "@/lib/whatsapp/uazapi";
import { mascararTelefone } from "@/lib/whatsapp/phone";
import { dataBR } from "@/lib/whatsapp/templates";
import { CancelarMensagem, ReenviarMensagem } from "@/components/admin/whatsapp/acoes";

export const dynamic = "force-dynamic";

const ROTULO: Record<string, string> = {
  cart_recovery_1: "Carrinho · 1ª",
  cart_recovery_2: "Carrinho · 2ª",
  cart_recovery_3: "Carrinho · 3ª",
  monthly_renewal_reminder: "Mensal · lembrete",
  monthly_payment_failed: "Mensal · recusada",
  monthly_payment_pending: "Mensal · pendente",
  monthly_access_suspended: "Mensal · suspenso",
  annual_renewal_15_days: "Anual · 15 dias",
  annual_renewal_3_days: "Anual · 3 dias",
  annual_payment_failed: "Anual · recusada",
  annual_payment_pending: "Anual · pendente",
  annual_access_suspended: "Anual · suspenso",
  renewal_payment_confirmed: "Renovação confirmada",
};

const COR_STATUS: Record<string, string> = {
  sent: "text-success",
  scheduled: "text-muted",
  processing: "text-warning",
  failed: "text-danger",
  cancelled: "text-muted-2",
  skipped: "text-muted-2",
};

function Kpi({ rotulo, valor, icone: Icone, tom }: { rotulo: string; valor: number; icone: typeof Clock; tom?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icone className="size-3.5" />
        {rotulo}
      </div>
      <p className={`mt-1 text-2xl font-bold ${tom ?? "text-foreground"}`}>{valor}</p>
    </div>
  );
}

export default async function WhatsAppPage() {
  await requireAdmin();
  const cfg = configWhatsApp();
  const db = createAdminClient();
  const instancia = await statusInstancia();

  const so = { count: "exact" as const, head: true };
  const em = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();

  const [agendadas, enviadas, falhas, optOuts, carrinhos, mensaisProximas, anuaisProximas, pendentes] =
    await Promise.all([
      db.from("whatsapp_messages").select("id", so).eq("status", "scheduled"),
      db.from("whatsapp_messages").select("id", so).eq("status", "sent"),
      db.from("whatsapp_messages").select("id", so).eq("status", "failed"),
      db.from("whatsapp_contacts").select("id", so).not("opted_out_at", "is", null),
      db.from("whatsapp_carts").select("id", so).eq("status", "aberto"),
      db.from("subscriptions").select("id", so).eq("plan", "mensal").eq("status", "ativa").lt("next_charge_at", em(7)),
      db.from("subscriptions").select("id", so).eq("plan", "anual").eq("status", "ativa").lt("next_charge_at", em(30)),
      db.from("subscriptions").select("id", so).in("status", ["pendente", "suspensa"]),
    ]).then((rs) => rs.map((r) => r.count ?? 0));

  const { data: mensagens } = await db
    .from("whatsapp_messages")
    .select("id, message_type, status, scheduled_for, sent_at, attempts, error_message, skip_reason, plan, contact_id")
    .order("created_at", { ascending: false })
    .limit(40);

  const contatoIds = [...new Set((mensagens ?? []).map((m) => m.contact_id))];
  const { data: contatos } = await db
    .from("whatsapp_contacts")
    .select("id, phone, name")
    .in("id", contatoIds.length ? contatoIds : [-1]);
  const porId = new Map((contatos ?? []).map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">WhatsApp</h1>
        <p className="mt-0.5 text-xs text-muted">
          Recuperação de carrinho e avisos de renovação. O WhatsApp não é mais usado para o e-mail
          de acesso — isso agora é só por e-mail.
        </p>
      </div>

      {/* Estado do motor */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start gap-2.5">
            {instancia.conectada ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Instância uazapi</p>
              <p className="text-xs text-muted">
                {instancia.conectada
                  ? `Conectada${instancia.perfil ? ` como ${instancia.perfil}` : ""}.`
                  : `${instancia.estado}${instancia.motivo ? ` — ${instancia.motivo}` : ""}`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-foreground">Automações</p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted">
            <li>Fila: {cfg.filaAtiva ? "ligada" : "DESLIGADA"}</li>
            <li>Carrinho abandonado: {cfg.carrinhoAtivo ? "ligada" : "DESLIGADA"}</li>
            <li>Renovação: {cfg.renovacaoAtiva ? "ligada" : "DESLIGADA"}</li>
            <li className={cfg.modoTeste ? "font-semibold text-warning" : ""}>
              Modo de teste: {cfg.modoTeste ? `LIGADO (${cfg.numerosDeTeste.length} número(s) autorizado(s))` : "desligado"}
            </li>
          </ul>
        </div>
      </div>

      {cfg.modoTeste && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="size-4" /> Modo de teste ligado
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Só os números em <code>WHATSAPP_TEST_NUMBERS</code> recebem mensagem. Qualquer outro
            destinatário aparece como <strong>skipped</strong> com o motivo. Desligue em
            <code> WHATSAPP_AUTOMATION_TEST_MODE</code> quando terminar os testes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi rotulo="Agendadas" valor={agendadas} icone={Clock} />
        <Kpi rotulo="Enviadas" valor={enviadas} icone={MessageSquare} tom="text-success" />
        <Kpi rotulo="Falhas" valor={falhas} icone={AlertTriangle} tom={falhas ? "text-danger" : undefined} />
        <Kpi rotulo="Opt-outs" valor={optOuts} icone={Ban} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi rotulo="Carrinhos abertos" valor={carrinhos} icone={Clock} />
        <Kpi rotulo="Mensais em 7 dias" valor={mensaisProximas} icone={Clock} />
        <Kpi rotulo="Anuais em 30 dias" valor={anuaisProximas} icone={Clock} />
        <Kpi rotulo="Cobranças pendentes" valor={pendentes} icone={AlertTriangle} tom={pendentes ? "text-warning" : undefined} />
      </div>

      {/* Histórico */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Últimas mensagens</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Cliente</th>
                <th className="px-3 py-2 text-left font-medium">Mensagem</th>
                <th className="px-3 py-2 text-left font-medium">Quando</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Motivo</th>
                <th className="px-3 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(mensagens ?? []).map((m) => {
                const c = porId.get(m.contact_id);
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">{c?.name ?? "—"}</div>
                      {/* Telefone completo nunca aparece na tela. */}
                      <div className="text-muted-2">{c ? mascararTelefone(c.phone) : "—"}</div>
                    </td>
                    <td className="px-3 py-2 text-foreground">{ROTULO[m.message_type] ?? m.message_type}</td>
                    <td className="px-3 py-2 text-muted">
                      {dataBR(m.sent_at ?? m.scheduled_for)}
                      {m.attempts > 1 && <span className="text-muted-2"> · {m.attempts}ª tentativa</span>}
                    </td>
                    <td className={`px-3 py-2 font-medium ${COR_STATUS[m.status] ?? "text-muted"}`}>{m.status}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-muted-2" title={m.error_message ?? m.skip_reason ?? ""}>
                      {m.error_message ?? m.skip_reason ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {(m.status === "scheduled" || m.status === "failed") && <CancelarMensagem id={m.id} />}
                      {(m.status === "failed" || m.status === "cancelled" || m.status === "skipped") && (
                        <ReenviarMensagem id={m.id} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {(mensagens ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    Nenhuma mensagem ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Histórico por cliente em <Link href="/admin/alunos" className="text-accent hover:underline">Alunos</Link>.
      </p>
    </div>
  );
}
