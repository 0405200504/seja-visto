"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createLookAction } from "@/app/actions/admin/content";
import { useToast } from "@/components/admin/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS } from "@/lib/constants";

const SELECTS: { name: "occasion" | "style" | "climate" | "level" | "base_color"; label: string; map: Record<string, string> }[] = [
  { name: "occasion", label: "Ocasião", map: OCCASIONS },
  { name: "style", label: "Estilo", map: STYLES },
  { name: "climate", label: "Clima", map: CLIMATES },
  { name: "level", label: "Nível", map: LEVELS },
  { name: "base_color", label: "Cor base", map: BASE_COLORS },
];

export function NewLookForm() {
  const [form, setForm] = useState({
    title: "",
    occasion: "dia-a-dia",
    style: "casual",
    climate: "meia-estacao",
    level: "facil",
    base_color: "preto",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">Título *</label>
        <Input
          autoFocus
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Streetwear básico para o dia a dia"
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SELECTS.map((s) => (
          <div key={s.name}>
            <label className="mb-1 block text-xs font-semibold text-muted">{s.label}</label>
            <select
              value={form[s.name]}
              onChange={(e) => setForm((f) => ({ ...f, [s.name]: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-surface-2 px-2.5 text-sm text-foreground"
            >
              {Object.entries(s.map).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={busy || !form.title.trim()}
        onClick={async () => {
          setBusy(true);
          const res = await createLookAction(form);
          setBusy(false);
          toast({ title: res.message, kind: res.ok ? "success" : "error" });
          if (res.ok && res.id) router.push(`/admin/conteudo/looks/${res.id}`);
        }}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Criar e continuar editando
      </Button>
    </div>
  );
}
