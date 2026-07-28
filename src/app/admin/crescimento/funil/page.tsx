import { requireAdmin } from "@/lib/auth";
import { getPeriod } from "@/lib/admin/period-server";
import { getDashboardData } from "@/lib/admin/metrics";
import { pct } from "@/lib/admin/format";
import { FunnelChart } from "@/components/admin/ui/charts";

export const dynamic = "force-dynamic";

export default async function FunilPage() {
  await requireAdmin();
  const period = await getPeriod();
  const data = await getDashboardData(period);

  const first = data.funnel[0]?.value ?? 0;
  const last = data.funnel[data.funnel.length - 1]?.value ?? 0;
  const overall = first > 0 ? (last / first) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Funil & Conversão</h1>
        <p className="mt-0.5 text-xs text-muted">
          {period.label} · do clique no link até o primeiro Fit Check — cada etapa mostra a % que passou
          da anterior. Clique numa etapa para abrir a lista que gerou o número.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <FunnelChart stages={data.funnel} />
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Conversão ponta a ponta no período: <strong className="text-foreground">{pct(overall)}</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-xs leading-relaxed text-muted">
        <p className="mb-1 font-semibold text-foreground">Como ler este funil</p>
        <p>
          “Cliques nos links” conta só os links /l/… criados em Links & UTMs (cliques diretos no site não
          entram). O checkout acontece dentro da Cakto, então a etapa clique → venda embute a página de
          vendas + checkout. As etapas de conta, onboarding, aulas e Fit Check consideram o que aconteceu
          dentro do período selecionado no topo.
        </p>
      </div>
    </div>
  );
}
