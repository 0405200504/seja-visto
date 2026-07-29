"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Check } from "lucide-react";
import {
  reprocessarWebhookAction,
  marcarWebhookResolvidoAction,
} from "@/app/actions/admin/webhooks";

export function WebhookActions({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  const executar = (fn: (id: string) => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const r = await fn(eventId);
      setMensagem(r.message);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(reprocessarWebhookAction)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border-strong disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
          Reprocessar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(marcarWebhookResolvidoAction)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Check className="size-3.5" />
          Já resolvi à mão
        </button>
      </div>
      {mensagem && <p className="text-xs text-muted">{mensagem}</p>}
    </div>
  );
}
