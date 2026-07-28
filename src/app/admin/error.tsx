"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">Algo deu errado ao carregar esta tela.</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted">
        {error.message || "Erro inesperado."} Se acontecer de novo, veja o log de auditoria ou me chame.
      </p>
      <Button size="sm" className="mt-1 h-9" onClick={reset}>
        <RotateCcw className="size-3.5" />
        Tentar de novo
      </Button>
    </div>
  );
}
