"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { createManualSaleAction2 } from "@/app/actions/admin/revenue";
import { useToast } from "@/components/admin/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BONUSES } from "@/lib/bonuses";

/** Lançamento de venda manual — abre pelo botão ou por ?nova=1 (menu Criar / Cmd+K). */
export function ManualSaleModal({ defaultFeePercent }: { defaultFeePercent: number }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    amount: "",
    paymentMethod: "pix",
    entitlement: "base",
    applyFee: false,
  });

  useEffect(() => {
    if (sp.get("nova") === "1") {
      setOpen(true);
      const params = new URLSearchParams(sp.toString());
      params.delete("nova");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [sp, router, pathname]);

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const emailInvalid = form.email.length > 0 && !form.email.includes("@");
  const amountInvalid = form.amount.length > 0 && !(parseFloat(form.amount.replace(",", ".")) > 0);

  return (
    <>
      <Button size="sm" className="h-9" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Lançar venda manual
      </Button>

      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Lançar venda manual</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground" aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">E-mail do aluno *</label>
                <Input value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="aluno@email.com" className="h-10" />
                {emailInvalid && <p className="mt-1 text-[11px] text-danger">Digite um e-mail válido.</p>}
                <p className="mt-1 text-[11px] text-muted-2">Se não existir conta, ela é criada e o aluno recebe a senha por e-mail.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Nome</label>
                <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Nome do aluno" className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Valor (R$) *</label>
                  <Input value={form.amount} onChange={(e) => set("amount")(e.target.value)} placeholder="197,00" className="h-10" />
                  {amountInvalid && <p className="mt-1 text-[11px] text-danger">Valor precisa ser maior que zero.</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Método</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => set("paymentMethod")(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground"
                  >
                    <option value="pix">Pix</option>
                    <option value="credit_card">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="manual">Outro / manual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Produto / acesso liberado</label>
                <select
                  value={form.entitlement}
                  onChange={(e) => set("entitlement")(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground"
                >
                  <option value="base">MPO (acesso principal)</option>
                  <option value="economize-58">Pack completo (base + bônus)</option>
                  {BONUSES.map((b) => (
                    <option key={b.key} value={b.key}>Bônus: {b.title}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={form.applyFee}
                  onChange={(e) => set("applyFee")(e.target.checked)}
                  className="size-3.5 accent-[#2f6bff]"
                />
                Descontar taxa de gateway ({defaultFeePercent.toLocaleString("pt-BR")}%) na receita líquida
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" className="h-9" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                size="sm"
                className="h-9"
                disabled={busy || !form.email || emailInvalid || !form.amount || amountInvalid}
                onClick={async () => {
                  setBusy(true);
                  const res = await createManualSaleAction2({
                    email: form.email,
                    name: form.name,
                    amount: form.amount,
                    paymentMethod: form.paymentMethod,
                    entitlement: form.entitlement,
                    feePercent: form.applyFee ? defaultFeePercent : 0,
                  });
                  setBusy(false);
                  toast({ title: res.message, kind: res.ok ? "success" : "error" });
                  if (res.ok) {
                    setOpen(false);
                    setForm({ email: "", name: "", amount: "", paymentMethod: "pix", entitlement: "base", applyFee: false });
                    router.refresh();
                  }
                }}
              >
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                Lançar venda
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
