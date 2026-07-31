"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { enviarEmailTesteAction } from "@/app/actions/admin/system";
import { useToast } from "@/components/admin/ui/toast";

/**
 * Disparo de teste do e-mail de acesso.
 *
 * O endereço é digitado na hora e nada é gravado aqui: o envio acontece no
 * servidor, com o mesmo remetente e o mesmo layout do e-mail real.
 */
export function EmailTeste({ padrao }: { padrao?: string }) {
  const [email, setEmail] = useState(padrao ?? "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const enviar = async () => {
    setBusy(true);
    try {
      const res = await enviarEmailTesteAction(email);
      toast({ title: res.message, kind: res.ok ? "success" : "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground">Enviar e-mail de teste</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Manda para o endereço abaixo uma cópia do e-mail de acesso, com o mesmo remetente e o
        mesmo layout do envio real. O botão do e-mail aponta para a tela de login — nenhum link
        de senha verdadeiro é gerado. Abra no celular e no computador e confira também se a
        resposta vai para suporte@manualpraticodooutfit.com.br.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground"
          aria-label="E-mail de destino do teste"
        />
        <button
          onClick={enviar}
          disabled={busy || !email}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Enviar teste
        </button>
      </div>
    </div>
  );
}
