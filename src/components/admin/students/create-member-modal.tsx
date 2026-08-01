"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import { createMemberAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Modal para criar uma nova conta de membro pelo admin.
 *
 * O admin informa e-mail e nome (opcional). A conta é criada com senha
 * temporária aleatória e o membro recebe e-mail com link para definir
 * a própria senha.
 */
export function CreateMemberModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const reset = () => {
    setEmail("");
    setName("");
    setBusy(false);
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    reset();
  };

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await createMemberAction(email, name || undefined);
      toast({
        title: res.message,
        kind: res.ok ? "success" : "error",
      });
      if (res.ok) {
        close();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <UserPlus className="size-3.5" />
        Novo membro
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={close}
          onKeyDown={(e) => e.key === "Escape" && close()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Criar novo membro"
            className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-surface p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <UserPlus className="size-4.5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Novo membro</h2>
              </div>
              <button
                onClick={close}
                disabled={busy}
                className="rounded-md p-1 text-muted-2 transition-colors hover:text-foreground disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              A conta será criada e o membro receberá um e-mail com link para definir a própria senha.
            </p>

            {/* Formulário */}
            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="create-member-email" className="mb-1 block text-xs font-semibold text-muted-2">
                  E-mail *
                </label>
                <Input
                  id="create-member-email"
                  type="email"
                  autoFocus
                  required
                  placeholder="novo@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && email.trim() && submit()}
                  disabled={busy}
                  className="h-10"
                />
              </div>
              <div>
                <label htmlFor="create-member-name" className="mb-1 block text-xs font-semibold text-muted-2">
                  Nome <span className="font-normal text-muted-2">(opcional)</span>
                </label>
                <Input
                  id="create-member-name"
                  type="text"
                  placeholder="Nome do membro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && email.trim() && submit()}
                  disabled={busy}
                  className="h-10"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" size="sm" className="h-9" onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-9"
                disabled={busy || !email.trim()}
                onClick={submit}
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UserPlus className="size-3.5" />
                )}
                {busy ? "Criando…" : "Criar conta e enviar e-mail"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
