"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { deleteProductMapAction, upsertProductMapAction } from "@/app/actions/admin/revenue";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BONUSES } from "@/lib/bonuses";

export function ProductMapForm() {
  const [form, setForm] = useState({ caktoId: "", entitlement: "base", label: "", validityDays: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground">Mapear produto da Cakto</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Cole o ID do produto/oferta da Cakto e escolha o que ele libera na plataforma. Para pacotes de
        tokens de IA, use a chave <code className="rounded bg-surface-3 px-1">tokens-50</code>, <code className="rounded bg-surface-3 px-1">tokens-200</code> etc.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={form.caktoId}
          onChange={(e) => setForm((f) => ({ ...f, caktoId: e.target.value }))}
          placeholder="ID do produto na Cakto"
          className="h-10"
        />
        <Input
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="Apelido (ex: MPO lote 2)"
          className="h-10"
        />
        <select
          value={form.entitlement}
          onChange={(e) => setForm((f) => ({ ...f, entitlement: e.target.value }))}
          className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground"
        >
          <option value="base">MPO (acesso principal)</option>
          <option value="economize-58">Pack completo</option>
          {BONUSES.map((b) => (
            <option key={b.key} value={b.key}>Bônus: {b.title}</option>
          ))}
          <option value="tokens-50">Tokens de IA: 50</option>
          <option value="tokens-200">Tokens de IA: 200</option>
        </select>
        <div className="flex gap-2">
          <Input
            value={form.validityDays}
            onChange={(e) => setForm((f) => ({ ...f, validityDays: e.target.value.replace(/\D/g, "") }))}
            placeholder="Validade em dias (vazio = vitalício)"
            className="h-10"
          />
          <Button
            size="sm"
            className="h-10 shrink-0"
            disabled={busy || !form.caktoId.trim()}
            onClick={async () => {
              setBusy(true);
              const res = await upsertProductMapAction(form);
              setBusy(false);
              toast({ title: res.message, kind: res.ok ? "success" : "error" });
              if (res.ok) {
                setForm({ caktoId: "", entitlement: "base", label: "", validityDays: "" });
                router.refresh();
              }
            }}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DeleteMappingButton({ caktoId, label }: { caktoId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: `Remover o mapeamento "${label}"?`,
          message: "Novas compras desse produto na Cakto deixam de liberar acesso automaticamente até você mapear de novo. Acessos já liberados não mudam.",
          confirmLabel: "Remover",
        });
        if (!ok) return;
        setBusy(true);
        const res = await deleteProductMapAction(caktoId);
        setBusy(false);
        toast({ title: res.message, kind: res.ok ? "success" : "error" });
        router.refresh();
      }}
      className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
      aria-label={`Remover mapeamento ${label}`}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  );
}
