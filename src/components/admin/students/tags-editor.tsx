"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, TagIcon } from "lucide-react";
import { setStudentTagsAction } from "@/app/actions/admin/students";
import { useToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/utils";

/** Editor de tags do aluno — usa o catálogo de Segmentos & Tags. */
export function TagsEditor({
  userId,
  current,
  catalog,
}: {
  userId: string;
  current: string[];
  catalog: { name: string; color: string }[];
}) {
  const [tags, setTags] = useState(current);
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const colorOf = (name: string) =>
    catalog.find((c) => c.name === name)?.color ?? "#8b96a8";

  const save = async (next: string[]) => {
    const prev = tags;
    setTags(next);
    setSaving(true);
    const res = await setStudentTagsAction(userId, next);
    setSaving(false);
    if (!res.ok) {
      setTags(prev);
      toast({ title: res.message, kind: "error" });
    } else {
      router.refresh();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex flex-wrap items-center gap-1"
        title="Editar tags"
      >
        {tags.length === 0 && (
          <span className="flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-[10px] text-muted-2">
            <TagIcon className="size-2.5" /> tags
          </span>
        )}
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: `${colorOf(t)}22`, color: colorOf(t) }}
          >
            {t}
          </span>
        ))}
        {saving && <Loader2 className="size-3 animate-spin text-muted-2" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="absolute left-0 top-full z-40 mt-1 w-52 rounded-xl border border-border bg-surface-2 p-1.5 shadow-card animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {catalog.map((c) => {
              const on = tags.includes(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => save(on ? tags.filter((t) => t !== c.name) : [...tags, c.name])}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
                >
                  <span
                    className={cn("flex size-4 items-center justify-center rounded border", on ? "text-white" : "border-border-strong")}
                    style={on ? { backgroundColor: c.color, borderColor: c.color } : undefined}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              );
            })}
            <div className="mt-1 flex items-center gap-1 border-t border-border pt-1.5">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim()) {
                    save([...tags, newTag.trim()]);
                    setNewTag("");
                  }
                }}
                placeholder="Nova tag…"
                className="h-7 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-[11px] text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
              />
              <button
                disabled={!newTag.trim()}
                onClick={() => { save([...tags, newTag.trim()]); setNewTag(""); }}
                className="rounded-lg border border-border p-1 text-muted transition-colors hover:text-foreground disabled:opacity-40"
                aria-label="Adicionar tag"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
