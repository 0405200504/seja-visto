"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toggleAdminAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { DeleteStudentButton } from "@/components/admin/students/delete-student-button";

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

        <DeleteStudentButton userId={userId} name={name} isAdmin={isAdmin} redirectTo="/admin/alunos" />
        {isAdmin && (
          <p className="text-[11px] leading-relaxed text-muted-2">
            Para excluir esta conta, remova antes o privilégio de admin.
          </p>
        )}
      </div>
    </section>
  );
}
