import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/admin/ui/charts";
import { cn } from "@/lib/utils";

/**
 * Stat tile padrão: número grande SEMPRE com contexto — comparativo com o
 * período anterior (absoluto + % + seta) e sparkline. Todo KPI é clicável
 * e leva à lista filtrada que gerou o número.
 */
export function KpiCard({
  label,
  value,
  previousLabel,
  deltaPct,
  deltaAbs,
  /** true quando subir é bom (receita) / false quando subir é ruim (reembolso, custo) */
  goodWhenUp = true,
  spark,
  href,
  hint,
}: {
  label: string;
  value: string;
  previousLabel: string;
  deltaPct: number | null;
  deltaAbs?: string;
  goodWhenUp?: boolean;
  spark?: number[];
  href: string;
  hint?: string;
}) {
  const up = deltaPct !== null && deltaPct > 0.5;
  const down = deltaPct !== null && deltaPct < -0.5;
  const flat = !up && !down;
  const good = flat ? null : up === goodWhenUp;

  return (
    <Link
      href={href}
      title={hint ?? `Ver detalhe de ${label.toLowerCase()}`}
      className="group flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">{label}</p>
        {spark && spark.length > 1 && <Sparkline points={spark} width={72} height={22} className="shrink-0 opacity-80" />}
      </div>
      <div>
        <p className="font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold tabular-nums",
              flat ? "text-muted" : good ? "text-success" : "text-danger"
            )}
          >
            {flat ? <Minus className="size-3" /> : up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {deltaPct === null
              ? "novo"
              : `${Math.abs(deltaPct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          </span>
          {deltaAbs && <span className="tabular-nums">({deltaAbs})</span>}
          <span>vs. {previousLabel}</span>
        </p>
      </div>
    </Link>
  );
}
