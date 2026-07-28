/**
 * Seletor GLOBAL de período do admin. A escolha vive em um cookie
 * (persiste entre páginas) e pode ser sobrescrita por ?periodo= na URL.
 * Todas as métricas comparam o período atual com o imediatamente anterior
 * de mesma duração.
 */

export type PeriodKey = "hoje" | "7d" | "30d" | "90d" | "mes" | "custom";

export type Period = {
  key: PeriodKey;
  label: string;
  from: Date;
  to: Date;       // exclusivo
  prevFrom: Date;
  prevTo: Date;
  days: number;
};

export const PERIOD_COOKIE = "admin_period";

export const PERIOD_LABELS: Record<Exclude<PeriodKey, "custom">, string> = {
  hoje: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  mes: "Este mês",
};

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3 (sem horário de verão)

/** Meia-noite de hoje no fuso de Brasília, expressa em UTC. */
function startOfTodayBrt(): Date {
  const now = new Date(Date.now() - BRT_OFFSET_MS);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(start + BRT_OFFSET_MS);
}

function daysAgo(base: Date, days: number): Date {
  return new Date(base.getTime() - days * 86_400_000);
}

export function resolvePeriod(raw: string | undefined): Period {
  const value = raw && raw.length > 0 ? raw : "30d";
  const today = startOfTodayBrt();
  const tomorrow = daysAgo(today, -1);

  if (value.startsWith("custom:")) {
    const [, fromStr, toStr] = value.split(":");
    const from = new Date(`${fromStr}T00:00:00-03:00`);
    const to = new Date(new Date(`${toStr}T00:00:00-03:00`).getTime() + 86_400_000);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && to > from) {
      const span = to.getTime() - from.getTime();
      return {
        key: "custom",
        label: `${from.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} – ${new Date(to.getTime() - 1).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
        from, to,
        prevFrom: new Date(from.getTime() - span),
        prevTo: from,
        days: Math.round(span / 86_400_000),
      };
    }
  }

  if (value === "hoje") {
    return {
      key: "hoje", label: PERIOD_LABELS.hoje,
      from: today, to: tomorrow,
      prevFrom: daysAgo(today, 1), prevTo: today,
      days: 1,
    };
  }

  if (value === "mes") {
    const now = new Date(Date.now() - BRT_OFFSET_MS);
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) + BRT_OFFSET_MS);
    const prevFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1) + BRT_OFFSET_MS);
    return {
      key: "mes", label: PERIOD_LABELS.mes,
      from, to: tomorrow,
      prevFrom, prevTo: from,
      days: Math.max(1, Math.round((tomorrow.getTime() - from.getTime()) / 86_400_000)),
    };
  }

  const days = value === "hoje" ? 1 : value === "7d" ? 7 : value === "90d" ? 90 : 30;
  const key: PeriodKey = value === "7d" || value === "90d" ? value : "30d";
  const from = daysAgo(today, days - 1);
  return {
    key, label: PERIOD_LABELS[key],
    from, to: tomorrow,
    prevFrom: daysAgo(from, days), prevTo: from,
    days,
  };
}

/** Chaves de dia (YYYY-MM-DD em BRT) para montar séries diárias. */
export function dayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(d.getTime() - BRT_OFFSET_MS).toISOString().slice(0, 10);
}

export function eachDay(period: Period): string[] {
  const out: string[] = [];
  for (let t = period.from.getTime(); t < period.to.getTime(); t += 86_400_000) {
    out.push(dayKey(new Date(t)));
  }
  return out;
}
