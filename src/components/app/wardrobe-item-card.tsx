"use client";

import { useOptimistic, useTransition } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { setWardrobeStatus } from "@/app/actions/user";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/types";

const PRIORITY_STYLE: Record<string, { label: string; className: string }> = {
  essencial: { label: "Essencial", className: "bg-accent-soft text-[#7ea2ff] border-accent/30" },
  intermediaria: { label: "Intermediária", className: "bg-surface-3 text-muted border-border" },
  avancada: { label: "Avançada", className: "bg-surface-3 text-muted border-border" },
};

export function WardrobeItemCard({
  item,
  status,
}: {
  item: WardrobeItem;
  status: "tenho" | "quero_comprar" | null;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const priority = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.intermediaria;

  function set(next: "tenho" | "quero_comprar") {
    startTransition(async () => {
      const value = optimistic === next ? null : next;
      setOptimistic(value);
      await setWardrobeStatus(item.id, value);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-surface p-5 shadow-card transition-colors",
        optimistic === "tenho" ? "border-success/30" : "border-border"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-display text-[15px] font-semibold leading-snug">{item.name}</h3>
        <Badge className={cn("shrink-0 border", priority.className)}>{priority.label}</Badge>
      </div>

      {item.description && (
        <p className="text-sm leading-relaxed text-muted">{item.description}</p>
      )}

      {item.how_to_use && (
        <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground/80">Como usar: </span>
          {item.how_to_use}
        </p>
      )}

      <div className="mt-4 flex gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => set("tenho")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]",
            optimistic === "tenho"
              ? "border-success/40 bg-success/15 text-success"
              : "border-border text-muted hover:border-border-strong hover:text-foreground"
          )}
        >
          <Check className="size-3.5" />
          Já tenho
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => set("quero_comprar")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]",
            optimistic === "quero_comprar"
              ? "border-accent/50 bg-accent-soft text-[#7ea2ff]"
              : "border-border text-muted hover:border-border-strong hover:text-foreground"
          )}
        >
          <ShoppingBag className="size-3.5" />
          Quero comprar
        </button>
      </div>
    </div>
  );
}
