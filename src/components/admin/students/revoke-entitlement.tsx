"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { grantEntitlementAction, revokeEntitlementAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";

export function RevokeEntitlementButton({
  userId,
  entitlement,
  label,
}: {
  userId: string;
  entitlement: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: `Revogar "${label}"?`,
          message: "O aluno perde este acesso imediatamente. Dá para desfazer pelo botão do aviso ou liberando de novo.",
          confirmLabel: "Revogar",
        });
        if (!ok) return;
        setBusy(true);
        const res = await revokeEntitlementAction(userId, entitlement);
        setBusy(false);
        toast({
          title: res.message,
          kind: res.ok ? "success" : "error",
          undo: res.ok
            ? async () => {
                await grantEntitlementAction(userId, entitlement);
                router.refresh();
              }
            : undefined,
        });
        if (res.ok) router.refresh();
      }}
      className="shrink-0 rounded-md p-1 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
      aria-label={`Revogar ${label}`}
      title="Revogar este acesso"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
    </button>
  );
}
