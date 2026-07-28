"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { deleteStudentAction, toggleAdminAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";

/** Zona de risco do aluno — ações perigosas isoladas no fim da tela. */
export function StudentDangerZone({
  userId,
  name,
  isAdmin,
}: {
  userId: string;
  name: string;
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <section className="rounded-xl border border-danger/25 bg-danger/[0.03] p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-danger">Zona de risco</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Ações abaixo têm efeito imediato. Tudo fica registrado no log de auditoria.
      </p>

      <div className="mt-3 space-y-2">
        <button
          disabled={busy !== null}
          onClick={async () => {
            const ok = await confirm({
              title: isAdmin ? "Remover privilégio de admin?" : "Tornar este aluno admin?",
              message: isAdmin
                ? `${name} perde acesso a todo o painel administrativo, mas continua como aluno normal.`
                : `${name} passa a ver e editar TUDO neste painel: vendas, alunos, conteúdo e configurações. Conceda apenas a pessoas de total confiança.`,
              confirmLabel: isAdmin ? "Remover admin" : "Tornar admin",
            });
            if (!ok) return;
            setBusy("admin");
            const res = await toggleAdminAction(userId, !isAdmin);
            toast({ title: res.message, kind: res.ok ? "success" : "error" });
            setBusy(null);
            router.refresh();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-border-strong"
        >
          {busy === "admin" ? <Loader2 className="size-3.5 animate-spin" /> : isAdmin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
          {isAdmin ? "Remover privilégio de admin" : "Tornar admin"}
        </button>

        <button
          disabled={busy !== null}
          onClick={async () => {
            const ok = await confirm({
              title: "Excluir a conta definitivamente?",
              message: `Isso apaga a conta de ${name}, o progresso nas aulas, favoritos, conversas de IA e acessos. Esta ação NÃO tem desfazer — as vendas já registradas são mantidas no financeiro.`,
              typeToConfirm: name,
              confirmLabel: "Excluir conta",
            });
            if (!ok) return;
            setBusy("delete");
            const res = await deleteStudentAction(userId);
            toast({ title: res.message, kind: res.ok ? "success" : "error" });
            setBusy(null);
            if (res.ok) router.push("/admin/alunos");
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-left text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
        >
          {busy === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          Excluir conta…
        </button>
      </div>
    </section>
  );
}
