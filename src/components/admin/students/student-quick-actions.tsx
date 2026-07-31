"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail, MinusCircle, Sparkles } from "lucide-react";
import {
  addTokensAction,
  grantEntitlementAction,
  reenviarEmailAcessoAction,
  revokeEntitlementAction,
} from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { BONUSES } from "@/lib/bonuses";

const VALIDITY_OPTIONS = [
  { value: "", label: "Vitalício" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "180 dias" },
  { value: "365", label: "1 ano" },
];

/** Ações rápidas do aluno — usadas no drawer da lista e na página de detalhe. */
export function StudentQuickActions({
  userId,
  hasBase,
  compact,
}: {
  userId: string;
  hasBase: boolean;
  compact?: boolean;
}) {
  const [validity, setValidity] = useState("");
  const [entitlement, setEntitlement] = useState("base");
  const [tokens, setTokens] = useState("10");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const run = async (key: string, fn: () => Promise<{ ok: boolean; message: string }>, undo?: () => Promise<unknown>) => {
    setBusy(key);
    try {
      const res = await fn();
      toast({
        title: res.message,
        kind: res.ok ? "success" : "error",
        undo: res.ok && undo ? async () => { await undo(); router.refresh(); } : undefined,
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* liberar acesso */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">Liberar acesso</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={entitlement}
            onChange={(e) => setEntitlement(e.target.value)}
            className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
            aria-label="Produto ou bônus"
          >
            <option value="base">MPO (acesso principal)</option>
            <option value="economize-58">Pack completo (base + todos os bônus)</option>
            {BONUSES.map((b) => (
              <option key={b.key} value={b.key}>Bônus: {b.title}</option>
            ))}
          </select>
          {entitlement === "base" && (
            <select
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
              aria-label="Validade"
            >
              {VALIDITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <button
            disabled={busy !== null}
            onClick={() =>
              run(
                "grant",
                () => grantEntitlementAction(userId, entitlement, validity ? parseInt(validity, 10) : null),
                () => revokeEntitlementAction(userId, entitlement)
              )
            }
            className="flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy === "grant" ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
            Liberar
          </button>
        </div>
      </div>

      {/* tokens */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">Tokens de IA</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {["10", "50", "200"].map((n) => (
            <button
              key={n}
              disabled={busy !== null}
              onClick={() => run("tokens", () => addTokensAction(userId, parseInt(n, 10)), () => addTokensAction(userId, -parseInt(n, 10)))}
              className="flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-accent/50"
            >
              <Sparkles className="size-3 text-[#7ea2ff]" /> +{n}
            </button>
          ))}
          <input
            value={tokens}
            onChange={(e) => setTokens(e.target.value.replace(/\D/g, ""))}
            className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
            aria-label="Quantidade personalizada"
          />
          <button
            disabled={busy !== null || !tokens}
            onClick={() => run("tokens", () => addTokensAction(userId, parseInt(tokens, 10)), () => addTokensAction(userId, -parseInt(tokens, 10)))}
            className="h-8 rounded-lg bg-surface-3 px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-50"
          >
            {busy === "tokens" ? <Loader2 className="size-3.5 animate-spin" /> : "Adicionar"}
          </button>
        </div>
      </div>

      {/* e-mail de acesso */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">E-mail de acesso</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={busy !== null}
            onClick={async () => {
              const ok = await confirm({
                title: "Reenviar o e-mail de acesso?",
                message:
                  "O aluno recebe um link novo para criar a senha. O link anterior deixa de valer. Use quando o e-mail automático não chegou.",
                confirmLabel: "Reenviar",
              });
              if (!ok) return;
              run("email", () => reenviarEmailAcessoAction(userId));
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:border-accent/50 disabled:opacity-50"
          >
            {busy === "email" ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
            Reenviar e-mail de acesso
          </button>
        </div>
      </div>

      {/* revogar */}
      {hasBase && !compact && (
        <button
          disabled={busy !== null}
          onClick={async () => {
            const ok = await confirm({
              title: "Revogar acesso principal?",
              message:
                "O aluno perde imediatamente o acesso à plataforma (aulas, looks, bônus continuam registrados, mas bloqueados). Você pode liberar de novo a qualquer momento.",
              confirmLabel: "Revogar acesso",
            });
            if (!ok) return;
            run("revoke", () => revokeEntitlementAction(userId, "base"), () => grantEntitlementAction(userId, "base"));
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-danger/80 transition-colors hover:text-danger"
        >
          <MinusCircle className="size-3.5" />
          Revogar acesso principal…
        </button>
      )}
    </div>
  );
}
