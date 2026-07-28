"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ConfirmOptions = {
  title: string;
  /** Explica exatamente o efeito da ação. */
  message: string;
  confirmLabel?: string;
  /** Se definido, exige digitar esse texto para liberar o botão. */
  typeToConfirm?: string;
  danger?: boolean;
};

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(
  () => Promise.resolve(false)
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(v: boolean) => void>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setTyped("");
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  };

  const blocked = !!opts?.typeToConfirm && typed.trim() !== opts.typeToConfirm.trim();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
          onKeyDown={(e) => e.key === "Escape" && close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-surface p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              {opts.danger !== false && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <AlertTriangle className="size-4.5" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{opts.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{opts.message}</p>
              </div>
            </div>

            {opts.typeToConfirm && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs text-muted">
                  Digite <strong className="text-foreground">{opts.typeToConfirm}</strong> para confirmar:
                </p>
                <Input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !blocked && close(true)}
                  placeholder={opts.typeToConfirm}
                  className="h-10"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" className="h-9" onClick={() => close(false)}>
                Cancelar
              </Button>
              <Button
                variant={opts.danger === false ? "default" : "danger"}
                size="sm"
                className="h-9"
                disabled={blocked}
                autoFocus={!opts.typeToConfirm}
                onClick={() => close(true)}
              >
                {opts.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
