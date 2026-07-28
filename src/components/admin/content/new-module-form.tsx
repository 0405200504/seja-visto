"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createModuleAction } from "@/app/actions/admin/content";
import { useToast } from "@/components/admin/ui/toast";

export function NewModuleForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (sp.get("novo") === "1") {
      setOpen(true);
      const params = new URLSearchParams(sp.toString());
      params.delete("novo");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [sp, router, pathname]);

  const create = async () => {
    setBusy(true);
    const res = await createModuleAction(title);
    setBusy(false);
    toast({ title: res.message, kind: res.ok ? "success" : "error" });
    if (res.ok && res.id) router.push(`/admin/conteudo/metodo/${res.id}`);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="size-3.5" /> Novo módulo
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) create();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Título do módulo… (Enter cria)"
        className="h-9 w-64 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
      />
      <button
        disabled={busy || !title.trim()}
        onClick={create}
        className="flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        Criar
      </button>
    </div>
  );
}
