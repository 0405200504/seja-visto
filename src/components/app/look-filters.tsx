"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS, COLOR_SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FILTER_GROUPS: { param: string; label: string; options: Record<string, string> }[] = [
  { param: "ocasiao", label: "Ocasião", options: OCCASIONS },
  { param: "estilo", label: "Estilo", options: STYLES },
  { param: "clima", label: "Clima", options: CLIMATES },
  { param: "nivel", label: "Nível", options: LEVELS },
  { param: "cor", label: "Cor base", options: BASE_COLORS },
];

export function LookFilters() {
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

  return (
    <div className={cn("space-y-4", pending && "opacity-70")}>
      {FILTER_GROUPS.map((group) => {
        const active = searchParams.get(group.param);
        return (
          <div key={group.param}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {group.label}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {Object.entries(group.options).map(([value, label]) => {
                const isActive = active === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(group.param, value)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                      isActive
                        ? "border-accent bg-accent-soft text-foreground"
                        : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    {group.param === "cor" && (
                      <span
                        className="size-2.5 rounded-full ring-1 ring-white/20"
                        style={{ background: COLOR_SWATCHES[value] }}
                      />
                    )}
                    {label}
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
