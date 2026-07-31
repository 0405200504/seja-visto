"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { removeTagEverywhereAction, saveTagCatalogAction } from "@/app/actions/admin/system";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { TAG_COLORS } from "@/lib/admin/settings-shared";
import { num } from "@/lib/admin/format";

export function TagCatalogEditor({
  tags,
  usage,
}: {
  tags: { name: string; color: string }[];
  usage: Record<string, number>;
}) {
  const [list, setList] = useState(tags);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const persist = async (next: { name: string; color: string }[]) => {
    setList(next);
    setBusy(true);
    const res = await saveTagCatalogAction(next);
    setBusy(false);
    toast({ title: res.message, kind: res.ok ? "success" : "error" });
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Catálogo de tags</h2>
        {busy && <Loader2 className="size-3.5 animate-spin text-muted" />}
      </div>

      <ul className="space-y-1.5">
        {list.map((tag, i) => (
          <li key={tag.name} className="flex items-center gap-2">
            <input
              type="color"
              value={tag.color}
              onChange={(e) => {
                const next = [...list];
                next[i] = { ...tag, color: e.target.value };
                setList(next);
              }}
              onBlur={() => persist(list)}
              className="size-6 cursor-pointer rounded border border-border bg-transparent"
              aria-label={`Cor da tag ${tag.name}`}
            />
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
            >
              {tag.name}
            </span>
            <span className="flex-1 text-[11px] text-muted-2">{num(usage[tag.name] ?? 0)} alunos</span>
            <button
              onClick={async () => {
                const count = usage[tag.name] ?? 0;
                const ok = await confirm({
                  title: `Excluir a tag "${tag.name}"?`,
                  message:
                    count > 0
                      ? `Ela sai do catálogo e é removida dos ${count} alunos que a têm.`
                      : "Ela sai do catálogo (nenhum aluno usa esta tag).",
                  confirmLabel: "Excluir tag",
                });
                if (!ok) return;
                if (count > 0) await removeTagEverywhereAction(tag.name);
                persist(list.filter((t) => t.name !== tag.name));
              }}
              className="rounded-md p-1 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label={`Excluir tag ${tag.name}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {list.length === 0 && <p className="py-2 text-xs text-muted-2">Nenhuma tag ainda — crie a primeira abaixo.</p>}
      </ul>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              persist([...list, { name: newName.trim(), color: TAG_COLORS[list.length % TAG_COLORS.length] }]);
              setNewName("");
            }
          }}
          placeholder="Nova tag (ex: VIP, Suporte, Lote 1)…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
        <button
          disabled={!newName.trim() || busy}
          onClick={() => {
            persist([...list, { name: newName.trim(), color: TAG_COLORS[list.length % TAG_COLORS.length] }]);
            setNewName("");
          }}
          className="flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white disabled:opacity-40"
        >
          <Plus className="size-3.5" /> Criar
        </button>
      </div>
    </div>
  );
}
