"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Heading2, List, Loader2, PenLine } from "lucide-react";
import { LessonContent } from "@/components/app/lesson-content";
import { cn } from "@/lib/utils";

/**
 * Editor de conteúdo longo: markdown leve (## títulos, - listas, parágrafos)
 * com barra de formatação, abas Editar/Visualizar (lado a lado em telas
 * grandes), contagem de palavras, tempo de leitura e autosave (800ms).
 */
export function MarkdownEditor({
  initial,
  onSave,
  minRows = 14,
}: {
  initial: string;
  onSave: (value: string) => Promise<{ ok: boolean; message?: string }>;
  minRows?: number;
}) {
  const [value, setValue] = useState(initial);
  const [tab, setTab] = useState<"editar" | "ver">("editar");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const words = useMemo(() => (value.trim() ? value.trim().split(/\s+/).length : 0), [value]);
  const minutes = Math.max(1, Math.round(words / 200));

  const schedule = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await onSave(next);
        if (!res.ok) throw new Error(res.message);
        setStatus("saved");
        setSavedAt(new Date());
        router.refresh();
      } catch {
        setStatus("error");
      }
    }, 800);
  };

  const insert = (prefix: string) => {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const needsBreak = before.length > 0 && !before.endsWith("\n\n");
    const inserted = `${before}${needsBreak ? "\n\n" : ""}${prefix}${after}`;
    schedule(inserted);
    requestAnimationFrame(() => {
      area.focus();
      const pos = start + (needsBreak ? 2 : 0) + prefix.length;
      area.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-2/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => insert("## Título da seção")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          title="Inserir título de seção (## )"
        >
          <Heading2 className="size-3.5" /> Título
        </button>
        <button
          type="button"
          onClick={() => insert("- item da lista")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          title="Inserir lista (- )"
        >
          <List className="size-3.5" /> Lista
        </button>

        <div className="mx-1 h-4 w-px bg-border" />

        <div className="flex rounded-lg border border-border p-0.5 lg:hidden">
          {(["editar", "ver"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors",
                tab === t ? "bg-surface-3 text-foreground" : "text-muted"
              )}
            >
              {t === "editar" ? <PenLine className="size-3" /> : <Eye className="size-3" />}
              {t === "editar" ? "Editar" : "Visualizar"}
            </button>
          ))}
        </div>

        <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-2">
          <span>{words.toLocaleString("pt-BR")} palavras · ~{minutes} min de leitura</span>
          {status === "saving" && <Loader2 className="size-3 animate-spin" />}
          {status === "saved" && savedAt && (
            <span className="flex items-center gap-1 text-muted">
              <CheckCircle2 className="size-3 text-success" />
              Salvo às {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {status === "error" && <span className="text-danger">erro ao salvar</span>}
        </span>
      </div>

      <div className="grid lg:grid-cols-2">
        <textarea
          ref={areaRef}
          value={value}
          rows={minRows}
          onChange={(e) => schedule(e.target.value)}
          placeholder={"Escreva o conteúdo…\n\n## Use títulos assim\n\n- e listas assim"}
          className={cn(
            "w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-2",
            tab !== "editar" && "hidden lg:block"
          )}
        />
        <div
          className={cn(
            "border-border bg-surface-2/40 px-4 py-3 lg:border-l",
            tab !== "ver" && "hidden lg:block"
          )}
        >
          {value.trim() ? (
            <LessonContent content={value} />
          ) : (
            <p className="text-xs italic text-muted-2">A pré-visualização aparece aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}
