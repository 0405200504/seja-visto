import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Camera,
  GraduationCap,
  KeyRound,
  Receipt,
  UserPlus,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPeriod } from "@/lib/admin/period-server";
import { getDashboardData } from "@/lib/admin/metrics";
import { brl, delta, num, pct, relTime } from "@/lib/admin/format";
import { KpiCard } from "@/components/admin/ui/kpi-card";
import { RevenueChart, FunnelChart } from "@/components/admin/ui/charts";

export const dynamic = "force-dynamic";

const TIMELINE_ICONS = {
  venda: Receipt,
  cadastro: UserPlus,
  aula: BookOpen,
  fit: Camera,
  token: GraduationCap,
  acesso: KeyRound,
};

function TopList({ title, items, unit }: { title: string; items: { label: string; count: number; href: string }[]; unit: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">{title}</h3>
      {items.length === 0 ? (
        <p className="py-3 text-xs text-muted-2">Sem dados ainda.</p>
      ) : (
        <ol className="space-y-1">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] transition-colors hover:bg-surface-2"
              >
                <span className="w-4 shrink-0 text-[11px] tabular-nums text-muted-2">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-muted">{item.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {num(item.count)} <span className="font-normal text-muted-2">{unit}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminDashboard(props: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await requireAdmin();
  const sp = await props.searchParams;
  const period = await getPeriod(sp.periodo);
  const data = await getDashboardData(period);

  const fmtValue = (k: (typeof data.kpis)[number]) =>
    k.format === "brl" ? brl(k.value) : k.format === "pct" ? pct(k.value) : num(k.value);
  const fmtDeltaAbs = (k: (typeof data.kpis)[number]) => {
    const diff = k.value - k.prev;
    const sign = diff > 0 ? "+" : "";
    if (k.format === "brl") return sign + brl(diff);
    if (k.format === "pct") return `${sign}${diff.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`;
    return sign + num(diff);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-xs text-muted">
          {period.label} · comparando com o período anterior de mesma duração · vendas de teste excluídas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((k) => (
          <KpiCard
            key={k.id}
            label={k.label}
            value={fmtValue(k)}
            previousLabel="período anterior"
            deltaPct={delta(k.value, k.prev)}
            deltaAbs={fmtDeltaAbs(k)}
            goodWhenUp={k.goodWhenUp}
            spark={k.spark}
            href={k.href}
            hint={k.hint}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Receita por dia */}
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <RevenueChart days={data.chartDays} />
        </div>

        {/* Precisa da sua atenção */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            <AlertCircle className="size-3.5 text-[#e5a83b]" />
            Precisa da sua atenção
          </h3>
          {data.attention.length === 0 ? (
            <p className="py-4 text-xs text-muted-2">Tudo em dia — nada pendente. 🎉</p>
          ) : (
            <ul className="space-y-1">
              {data.attention.map((a) => (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5a83b]/10 text-[11px] font-bold tabular-nums text-[#e5a83b]">
                      {a.count > 99 ? "99+" : a.count}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{a.label}</span>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[#7ea2ff]">
                      {a.action}
                      <ArrowRight className="size-3" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funil */}
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Funil do período</h3>
            <Link href="/admin/crescimento/funil" className="flex items-center gap-1 text-[11px] font-semibold text-[#7ea2ff] hover:underline">
              Ver funil completo <ArrowRight className="size-3" />
            </Link>
          </div>
          <FunnelChart stages={data.funnel} />
        </div>

        {/* Atividade recente */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">Atividade recente</h3>
          {data.timeline.length === 0 ? (
            <p className="py-4 text-xs text-muted-2">Nenhuma atividade ainda.</p>
          ) : (
            <ul className="max-h-80 space-y-0.5 overflow-y-auto pr-1">
              {data.timeline.map((e, i) => {
                const Icon = TIMELINE_ICONS[e.kind] ?? Receipt;
                return (
                  <li key={i}>
                    <Link href={e.href} className="flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2">
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-2" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-muted">{e.title}</span>
                        <span className="block text-[10px] text-muted-2">{relTime(e.at)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Top listas */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <TopList title="Looks mais curtidos" items={data.topLooks} unit="curtidas" />
        <TopList title="Aulas mais concluídas" items={data.topAulas} unit="alunos" />
        <TopList title="Aulas menos concluídas" items={data.bottomAulas} unit="alunos" />
        <TopList title="Links com mais cliques no período" items={data.topLinks} unit="cliques" />
      </div>
    </div>
  );
}
