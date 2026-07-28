"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { extendEntitlementAction } from "@/app/actions/admin/revenue";
import { useToast } from "@/components/admin/ui/toast";

export function ExtendEntitlementButton({ entId, days = 30 }: { entId: string; days?: number }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <button
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        const res = await extendEntitlementAction(entId, days);
        setBusy(false);
        toast({ title: res.message, kind: res.ok ? "success" : "error" });
        router.refresh();
      }}
      className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-accent/50"
      title={`Estender por ${days} dias`}
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <CalendarPlus className="size-3" />}
      +{days}d
    </button>
  );
}
