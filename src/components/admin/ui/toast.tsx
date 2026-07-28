"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastInput = {
  title: string;
  description?: string;
  kind?: "success" | "error" | "info";
  /** Ação de desfazer — mantém o toast aberto por 10s. */
  undo?: () => Promise<void> | void;
};

type Toast = ToastInput & { id: number; leaving?: boolean };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200);
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { ...input, id }]);
      setTimeout(() => dismiss(id), input.undo ? 10_000 : 4_500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-surface-2 p-3.5 shadow-card transition-all duration-200",
              t.leaving ? "translate-y-2 opacity-0" : "animate-fade-up"
            )}
            role="status"
          >
            {t.kind === "error" ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            ) : t.kind === "info" ? (
              <Info className="mt-0.5 size-4 shrink-0 text-[#7ea2ff]" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
              )}
            </div>
            {t.undo && (
              <button
                onClick={async () => {
                  dismiss(t.id);
                  try {
                    await t.undo!();
                    push({ title: "Ação desfeita." });
                  } catch {
                    push({ title: "Não foi possível desfazer.", kind: "error" });
                  }
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border-strong px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3"
              >
                <Undo2 className="size-3" />
                Desfazer
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-muted-2 transition-colors hover:text-foreground"
              aria-label="Fechar aviso"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
