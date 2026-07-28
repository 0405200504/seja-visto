"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ui/image-uploader";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm, type ConfirmOptions } from "@/components/admin/ui/confirm";

type Result = { ok: boolean; message: string };

/** Campo de imagem com upload — persiste via server action bound (value) => Result. */
export function ImageField({
  value,
  folder,
  action,
  aspectHint,
}: {
  value: string | null;
  folder: string;
  action: (value: string) => Promise<Result>;
  aspectHint?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  return (
    <ImageUploader
      value={value}
      folder={folder}
      aspectHint={aspectHint}
      onChange={async (url) => {
        const res = await action(url ?? "");
        if (!res.ok) toast({ title: res.message, kind: "error" });
        else router.refresh();
      }}
    />
  );
}

/** Botão de exclusão padrão (soft delete) com confirmação e undo via toast. */
export function DeleteEntityButton({
  label,
  confirm: confirmOptions,
  action,
  undoAction,
  redirectTo,
  className,
}: {
  label: string;
  confirm: ConfirmOptions;
  action: () => Promise<Result>;
  undoAction?: () => Promise<Result>;
  redirectTo?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const ok = await confirm(confirmOptions);
        if (!ok) return;
        setBusy(true);
        const res = await action();
        setBusy(false);
        toast({
          title: res.message,
          kind: res.ok ? "success" : "error",
          undo:
            res.ok && undoAction
              ? async () => {
                  await undoAction();
                  router.refresh();
                }
              : undefined,
        });
        if (res.ok) {
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        }
      }}
      className={
        className ??
        "flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
      }
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      {label}
    </button>
  );
}
