"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2, Undo2 } from "lucide-react";
import { bulkSalesAction, markRefundAction } from "@/app/actions/admin/revenue";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";

/** Ações do drawer de uma transação. */
export function SaleActions({
  saleId,
  status,
  isTest,
}: {
  saleId: string;
  status: string;
  isTest: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const refunded = status !== "approved";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={busy !== null}
        onClick={async () => {
          if (!refunded) {
            const ok = await confirm({
              title: "Marcar como reembolsada?",
              message:
                "A transação sai da receita e entra na taxa de reembolso. Isso NÃO devolve o dinheiro na Cakto (faça lá) e NÃO revoga o acesso do aluno automaticamente.",
              confirmLabel: "Marcar reembolso",
            });
            if (!ok) return;
          }
          setBusy("refund");
          const res = await markRefundAction(saleId, !refunded);
          setBusy(null);
          toast({
            title: res.message,
            kind: res.ok ? "success" : "error",
            undo: res.ok ? async () => { await markRefundAction(saleId, refunded); router.refresh(); } : undefined,
          });
          router.refresh();
        }}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong"
      >
        {busy === "refund" ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
        {refunded ? "Desfazer reembolso" : "Marcar como reembolsada"}
      </button>

      <button
        disabled={busy !== null}
        onClick={async () => {
          setBusy("test");
          const res = await bulkSalesAction(isTest ? "desmarcar_teste" : "marcar_teste", {
            ids: [saleId],
            allFiltered: false,
            queryString: "",
          });
          setBusy(null);
          toast({ title: res.message, kind: res.ok ? "success" : "error" });
          router.refresh();
        }}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong"
      >
        {busy === "test" ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}
        {isTest ? "Tirar do modo teste" : "Marcar como teste"}
      </button>
    </div>
  );
}
