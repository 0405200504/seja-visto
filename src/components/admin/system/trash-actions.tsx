"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { purgeFromTrashAction, restoreFromTrashAction } from "@/app/actions/admin/system";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";

export function TrashRowActions({ kind, id, label }: { kind: string; id: string; label: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <span className="flex items-center gap-1.5">
      <button
        disabled={busy !== null}
        onClick={async () => {
          setBusy("restore");
          const res = await restoreFromTrashAction(kind, id);
          setBusy(null);
          toast({ title: res.message, kind: res.ok ? "success" : "error" });
          router.refresh();
        }}
        className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-accent/50"
      >
        {busy === "restore" ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
        Restaurar
      </button>
      <button
        disabled={busy !== null}
        onClick={async () => {
          const ok = await confirm({
            title: "Excluir definitivamente?",
            message: `"${label}" será apagado PARA SEMPRE — sem volta.`,
            typeToConfirm: label,
            confirmLabel: "Excluir para sempre",
          });
          if (!ok) return;
          setBusy("purge");
          const res = await purgeFromTrashAction(kind, id);
          setBusy(null);
          toast({ title: res.message, kind: res.ok ? "success" : "error" });
          router.refresh();
        }}
        className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] font-semibold text-danger transition-colors hover:bg-danger/20"
      >
        {busy === "purge" ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
        Apagar
      </button>
    </span>
  );
}
