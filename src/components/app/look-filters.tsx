"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS, COLOR_SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FILTER_GROUPS: { param: string; field: keyof LookFacet; label: string; options: Record<string, string> }[] = [
  { param: "ocasiao", field: "occasion", label: "Ocasião", options: OCCASIONS },
  { param: "estilo", field: "style", label: "Estilo", options: STYLES },
  { param: "clima", field: "climate", label: "Clima", options: CLIMATES },
  { param: "nivel", field: "level", label: "Nível", options: LEVELS },
  { param: "cor", field: "base_color", label: "Cor base", options: BASE_COLORS },
];

export type LookFacet = {
  occasion: string;
  style: string;
  climate: string;
  level: string;
  base_color: string;
};

export function LookFilters({ facets }: { facets: LookFacet[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const hasFilters = FILTER_GROUPS.some((g) => searchParams.get(g.param));

  function setFilter(param: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || params.get(param) === value) {
      params.delete(param);
    } else {
      params.set(param, value);
    }
    startTransition(() => {
      router.replace(`/combinacoes${params.size ? `?${params}` : ""}`, { scroll: false });
    });
  }

  /** Quantos looks existiriam se este valor fosse aplicado, mantendo os filtros das outras seções. */
  function countFor(field: keyof LookFacet, value: string) {
    return facets.filter((look) =>
      FILTER_GROUPS.every((g) => {
        if (g.field === field) return look[field] === value;
        const active = searchParams.get(g.param);
        return !active || look[g.field] === active;
      })
    ).length;
  }

  return (
    <div className={cn("space-y-4", pending && "opacity-70")}>
      {FILTER_GROUPS.map((group) => {
        const active = searchParams.get(group.param);
        return (
          <div key={group.param}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(group.options).map(([value, label]) => {
                const isActive = active === value;
                const count = countFor(group.field, value);
                const isDisabled = count === 0 && !isActive;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setFilter(group.param, value)}
                    title={isDisabled ? "Nenhuma combinação com os filtros atuais" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "border-accent bg-accent-soft text-foreground cursor-pointer"
                        : isDisabled
                          ? "border-border/50 bg-surface/50 text-muted/40 cursor-not-allowed"
                          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground cursor-pointer"
                    )}
                  >
                    {group.param === "cor" && (
                      <span
                        className={cn("size-2.5 rounded-full ring-1 ring-white/20", isDisabled && "opacity-40")}
                        style={{ background: COLOR_SWATCHES[value] }}
                      />
                    )}
                    {label}
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        isActive ? "text-foreground/70" : "text-muted/60"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasFilters && (
        <button
          type="button"
          onClick={() => startTransition(() => router.replace("/combinacoes", { scroll: false }))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer"
        >
          <X className="size-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
