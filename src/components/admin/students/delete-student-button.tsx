"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteStudentAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { cn } from "@/lib/utils";

/**
 * Botão de excluir conta — mesmo aviso e mesma confirmação em qualquer lugar.
 *
 * Exige digitar o nome do aluno antes de liberar o botão, porque não há
 * desfazer: a conta some do Auth e leva junto progresso, acessos e fits.
 */
export function DeleteStudentButton({
  userId,
  name,
  isAdmin,
  redirectTo,
  className,
}: {
  userId: string;
  name: string;
  isAdmin?: boolean;
  /** Para onde ir depois de excluir (na página do aluno, volta para a lista). */
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
        if (isAdmin) {
          toast({
            title: "Esta conta é admin. Remova o privilégio de admin antes de excluir.",
            kind: "error",
          });
          return;
        }
        const ok = await confirm({
          title: "Excluir a conta definitivamente?",
          message: `Isso apaga a conta de ${name}, o progresso nas aulas, favoritos, conversas de IA, fits enviados e todos os acessos. Esta ação NÃO tem desfazer — as vendas já registradas continuam no financeiro.`,
          typeToConfirm: name,
          confirmLabel: "Excluir conta",
          danger: true,
        });
        if (!ok) return;
        setBusy(true);
        const res = await deleteStudentAction(userId);
        toast({ title: res.message, kind: res.ok ? "success" : "error" });
        setBusy(false);
        if (res.ok) {
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        }
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-left text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50",
        className
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Excluir conta…
    </button>
  );
}
