"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * <DetailPanel/> — drawer lateral padrão do admin. Abre à direita sem tirar
 * a pessoa da lista; ↑/↓ percorrem os registros; "abrir em página cheia"
 * leva à rota do registro.
 */
export function DetailDrawer({
  open,
  onClose,
  onPrev,
  onNext,
  fullHref,
  title,
  subtitle,
  footer,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  fullHref?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (e.key === "Escape" && !typing) onClose();
      if (typing) return;
      if (e.key === "ArrowUp" && onPrev) { e.preventDefault(); onPrev(); }
      if (e.key === "ArrowDown" && onNext) { e.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-surface shadow-card",
          "animate-[drawer-in_0.2s_ease]",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-foreground">{title}</div>
            {subtitle && <div className="mt-0.5 truncate text-xs text-muted">{subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(onPrev || onNext) && (
              <>
                <button
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  aria-label="Registro anterior (↑)"
                  title="Anterior (↑)"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  aria-label="Próximo registro (↓)"
                  title="Próximo (↓)"
                >
                  <ChevronDown className="size-4" />
                </button>
              </>
            )}
            {fullHref && (
              <Link
                href={fullHref}
                className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:text-foreground"
                aria-label="Abrir em página cheia"
                title="Abrir em página cheia"
              >
                <Maximize2 className="size-4" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:text-foreground"
              aria-label="Fechar (Esc)"
              title="Fechar (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-border px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}
