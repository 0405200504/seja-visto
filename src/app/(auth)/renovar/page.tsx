import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CreditCard, HelpCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { configWhatsApp } from "@/lib/whatsapp/config";
import { brl, dataBR } from "@/lib/whatsapp/templates";

export const metadata: Metadata = { title: "Sua assinatura" };
export const dynamic = "force-dynamic";

/**
 * Destino dos links das mensagens de renovação.
 *
 * A Cakto não oferece portal do cliente nem link individual de atualização
 * de pagamento. Em vez de mandar um link genérico de checkout — que não
 * diz nada sobre a situação da pessoa —, esta página exige login, mostra
 * o plano e o vencimento reais e leva ao checkout certo.
 */
export default async function RenovarPage() {
  const { profile, user } = await requireProfile();
  const cfg = configWhatsApp();
  const db = createAdminClient();

  const { data: assinatura } = await db
    .from("subscriptions")
    .select("plan, status, amount_cents, next_charge_at")
    .eq("user_id", user.id)
    .order("next_charge_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      plan: "mensal" | "anual";
      status: string;
      amount_cents: number;
      next_charge_at: string | null;
    }>();

  // Sem assinatura registrada, cai para o acesso vigente do aluno.
  const { data: acesso } = await db
    .from("user_entitlements")
    .select("expires_at")
    .eq("user_id", user.id)
    .eq("entitlement", "base")
    .maybeSingle<{ expires_at: string | null }>();

  const plano = assinatura?.plan ?? null;
  const vence = assinatura?.next_charge_at ?? acesso?.expires_at ?? null;
  const ativo = vence ? new Date(vence) > new Date() : Boolean(acesso);
  const checkout = plano === "mensal" ? cfg.checkoutMensal : cfg.checkoutAnual;
  const primeiro = (profile.name || "Aluno").split(" ")[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-xl font-bold text-foreground">Sua assinatura do MPO</h1>
        <p className="mt-1 text-sm text-muted">
          Olá, {primeiro}. Aqui ficam os dados da sua assinatura e o caminho para renovar.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-border bg-surface-2 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Plano</dt>
            <dd className="font-semibold text-foreground">
              {plano === "mensal" ? "Mensal" : plano === "anual" ? "Anual" : "Não identificado"}
            </dd>
          </div>
          {assinatura && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Valor</dt>
              <dd className="font-semibold text-foreground">
                {brl(assinatura.amount_cents)}
                {plano === "mensal" ? " por mês" : plano === "anual" ? " por ano" : ""}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Situação</dt>
            <dd className={`font-semibold ${ativo ? "text-success" : "text-danger"}`}>
              {ativo ? "Ativa" : "Vencida"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <CalendarClock className="size-3.5" />
              {ativo ? "Próxima renovação" : "Venceu em"}
            </dt>
            <dd className="font-semibold text-foreground">{vence ? dataBR(vence) : "—"}</dd>
          </div>
        </dl>

        <a
          href={checkout}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <CreditCard className="size-4" />
          {ativo ? "Atualizar forma de pagamento" : "Reativar minha assinatura"}
        </a>
        <p className="mt-2 text-center text-xs text-muted">
          Você será levado ao checkout seguro da Cakto.
        </p>
      </div>

      <div id="cancelar" className="scroll-mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HelpCircle className="size-4 text-muted" />
          Cancelamento e ajuda
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Para cancelar a renovação automática, escreva para{" "}
          <a href={`mailto:${cfg.suporteEmail}`} className="font-medium text-accent hover:underline">
            {cfg.suporteEmail}
          </a>{" "}
          com o e-mail usado na compra. O cancelamento é confirmado por escrito e você mantém o
          acesso até o fim do período já pago.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Se você recebeu uma mensagem no WhatsApp e não quer mais receber, responda{" "}
          <strong className="text-foreground">PARAR</strong> naquela conversa.
        </p>
      </div>

      <p className="text-center text-xs text-muted">
        <Link href="/dashboard" className="hover:underline">
          Voltar para a plataforma
        </Link>
      </p>
    </div>
  );
}
