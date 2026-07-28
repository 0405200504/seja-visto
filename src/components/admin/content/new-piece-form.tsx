"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createWardrobeAction } from "@/app/actions/admin/content";
import { useToast } from "@/components/admin/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WARDROBE_CATEGORIES, PRIORITIES } from "@/lib/constants";

export function NewPieceForm() {
  const [form, setForm] = useState({ name: "", category: "camisetas", priority: "essencial" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Nome *</label>
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Camiseta branca premium"
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Categoria</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="h-10 w-full rounded-xl border border-border bg-surface-2 px-2.5 text-sm text-foreground"
          >
            {Object.entries(WARDROBE_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Prioridade</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="h-10 w-full rounded-xl border border-border bg-surface-2 px-2.5 text-sm text-foreground"
          >
            {Object.entries(PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <Button
        className="w-full"
        disabled={busy || !form.name.trim()}
        onClick={async () => {
          setBusy(true);
          const res = await createWardrobeAction(form);
          setBusy(false);
          toast({ title: res.message, kind: res.ok ? "success" : "error" });
          if (res.ok && res.id) router.push(`/admin/conteudo/pecas/${res.id}`);
        }}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Criar e continuar editando
      </Button>
    </div>
  );
}
