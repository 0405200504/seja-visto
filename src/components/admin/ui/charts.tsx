"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* =========================================================
   Gráficos do admin — SVG puro, tema dark, uma série por eixo.
   Cor de dados: accent (#2f6bff), validada sobre #0c111a.
   ========================================================= */

const ACCENT = "#2f6bff";

/* ---------- Sparkline (dentro de stat tiles) ---------- */

export function Sparkline({
  points,
  width = 96,
  height = 28,
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2 || points.every((p) => p === 0)) {
    return <div style={{ width, height }} className={className} aria-hidden />;
  }
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const y = (v: number) => height - 2 - ((v - min) / range) * (height - 4);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={area} fill={ACCENT} opacity={0.12} />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Gráfico de receita (barras + acumulado) ---------- */

export type DayPoint = { key: string; label: string; value: number };

function bucketize(days: DayPoint[], granularity: "dia" | "semana" | "mes"): DayPoint[] {
  if (granularity === "dia") return days;
  const buckets = new Map<string, DayPoint>();
  for (const d of days) {
    const date = new Date(`${d.key}T12:00:00-03:00`);
    let key: string;
    let label: string;
    if (granularity === "semana") {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = monday.toISOString().slice(0, 10);
      label = `sem. ${monday.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
    } else {
      key = d.key.slice(0, 7);
      label = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    }
    const existing = buckets.get(key);
    if (existing) existing.value += d.value;
    else buckets.set(key, { key, label, value: d.value });
  }
  return [...buckets.values()];
}

export function RevenueChart({
  days,
  formatValue,
  title = "Receita aprovada por dia",
}: {
  days: DayPoint[];
  /** formata centavos → "R$ 1.234,00" (roda no cliente) */
  formatValue?: (v: number) => string;
  title?: string;
}) {
  const [granularity, setGranularity] = useState<"dia" | "semana" | "mes">("dia");
  const [mode, setMode] = useState<"diario" | "acumulado">("diario");
  const [hover, setHover] = useState<number | null>(null);

  const fmt = formatValue ?? ((v: number) => (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));

  const data = useMemo(() => {
    const base = bucketize(days, granularity);
    if (mode === "diario") return base;
    let acc = 0;
    return base.map((d) => ({ ...d, value: (acc += d.value) }));
  }, [days, granularity, mode]);

  const W = 720;
  const H = 200;
  const PAD_L = 8;
  const PAD_B = 22;
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerH = H - PAD_B - 8;
  const n = data.length;
  const slot = (W - PAD_L) / Math.max(n, 1);
  const barW = Math.max(3, Math.min(36, slot - 2)); // gap mínimo de 2px entre barras

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: 8 + innerH * (1 - f),
    value: max * f,
  }));

  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {mode === "acumulado" ? "Receita acumulada" : title}
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-border p-0.5 text-[11px]">
            {(["diario", "acumulado"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("rounded-md px-2 py-0.5 capitalize transition-colors", mode === m ? "bg-surface-3 text-foreground" : "text-muted")}
              >
                {m === "diario" ? "Diário" : "Acumulado"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border p-0.5 text-[11px]">
            {(["dia", "semana", "mes"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={cn("rounded-md px-2 py-0.5 capitalize transition-colors", granularity === g ? "bg-surface-3 text-foreground" : "text-muted")}
              >
                {g === "mes" ? "Mês" : g === "semana" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
          {gridLines.map((g, i) => (
            <line key={i} x1={PAD_L} x2={W} y1={g.y} y2={g.y} stroke="#1e2938" strokeWidth={1} />
          ))}
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * innerH);
            const x = PAD_L + i * slot + (slot - barW) / 2;
            const yTop = 8 + innerH - h;
            return (
              <g key={d.key}>
                <rect
                  x={PAD_L + i * slot}
                  y={0}
                  width={slot}
                  height={H - PAD_B}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                <rect
                  x={x}
                  y={yTop}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill={ACCENT}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  style={{ pointerEvents: "none" }}
                />
                {/* rótulo direto apenas no maior valor */}
                {i === maxIdx && d.value > 0 && n <= 45 && (
                  <text
                    x={Math.min(Math.max(x + barW / 2, 30), W - 40)}
                    y={Math.max(yTop - 5, 10)}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#8b96a8"
                  >
                    {fmt(d.value)}
                  </text>
                )}
              </g>
            );
          })}
          {/* eixo x: primeiro, meio e último rótulo */}
          {n > 0 &&
            [0, Math.floor((n - 1) / 2), n - 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((i) => (
                <text
                  key={i}
                  x={PAD_L + i * slot + slot / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#5c677a"
                >
                  {data[i].label}
                </text>
              ))}
        </svg>

        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-center shadow-card"
            style={{ left: `${((PAD_L + hover * slot + slot / 2) / W) * 100}%` }}
          >
            <p className="whitespace-nowrap text-[10px] text-muted">{data[hover].label}</p>
            <p className="whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
              {fmt(data[hover].value)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Funil ---------- */

export function FunnelChart({
  stages,
}: {
  stages: { label: string; value: number; href?: string; hint?: string }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ol className="space-y-1">
      {stages.map((stage, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const conv = prev && prev > 0 ? (stage.value / prev) * 100 : null;
        const widthPct = Math.max((stage.value / max) * 100, 2);
        const inner = (
          <div className="group">
            {i > 0 && (
              <p className="py-0.5 pl-1 text-[10px] tabular-nums text-muted-2">
                ↓ {conv === null ? "—" : `${conv.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                {conv !== null && conv < 100 && (
                  <span className="ml-1 text-muted-2">
                    (perde {(100 - conv).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)
                  </span>
                )}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="h-7 flex-1 overflow-hidden rounded-md bg-surface-2">
                <div
                  className="flex h-full items-center rounded-md bg-accent/80 pl-2 transition-all group-hover:bg-accent"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-white">
                    {stage.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
              <span className="w-40 shrink-0 truncate text-xs text-muted" title={stage.hint ?? stage.label}>
                {stage.label}
              </span>
            </div>
          </div>
        );
        return (
          <li key={stage.label}>
            {stage.href ? (
              <a href={stage.href} className="block rounded-lg px-1 py-0.5 transition-colors hover:bg-surface-2/60">
                {inner}
              </a>
            ) : (
              <div className="px-1 py-0.5">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
