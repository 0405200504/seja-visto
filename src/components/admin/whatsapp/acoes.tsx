"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, X } from "lucide-react";
import { cancelarMensagemAction, reenviarMensagemAction } from "@/app/actions/admin/whatsapp";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";

function useAcao() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const rodar = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    try {
      const res = await fn();
      toast({ title: res.message, kind: res.ok ? "success" : "error" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };
  return { busy, rodar };
}

export function CancelarMensagem({ id }: { id: number }) {
  const { busy, rodar } = useAcao();
  const confirm = useConfirm();

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: "Cancelar esta mensagem?",
          message: "Ela não será enviada. As outras da mesma sequência continuam agendadas.",
          confirmLabel: "Cancelar mensagem",
        });
        if (ok) rodar(() => cancelarMensagemAction(id));
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-danger disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
      Cancelar
    </button>
  );
}

export function ReenviarMensagem({ id }: { id: number }) {
  const { busy, rodar } = useAcao();
  const confirm = useConfirm();

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: "Reenviar agora?",
          message:
            "A mensagem passa pelas mesmas verificações do envio automático: opt-out, consentimento e situação atual do carrinho ou da assinatura. Se algo mudou, o reenvio é recusado.",
          confirmLabel: "Reenviar",
        });
        if (ok) rodar(() => reenviarMensagemAction(id));
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-accent disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
      Reenviar
    </button>
  );
}
