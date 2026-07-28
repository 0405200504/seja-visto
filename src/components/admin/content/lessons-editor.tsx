"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2, Users } from "lucide-react";
import {
  createLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  restoreLessonAction,
  updateLessonFieldAction,
} from "@/app/actions/admin/content";
import { SortableList } from "@/components/admin/ui/sortable-list";
import { MarkdownEditor } from "@/components/admin/ui/markdown-editor";
import { InlineText } from "@/components/admin/ui/inline-edit";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import { num } from "@/lib/admin/format";

export type LessonData = {
  id: string;
  title: string;
  content: string | null;
  completions: number;
};

/**
 * Editor de aulas do módulo: reordenar arrastando, título inline,
 * conteúdo em markdown com autosave — nunca precisa de botão "Salvar".
 */
export function LessonsEditor({ moduleId, lessons }: { moduleId: string; lessons: LessonData[] }) {
  const sp = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(sp.get("aula"));
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <SortableList
        onReorder={(ids) => reorderLessonsAction(moduleId, ids)}
        items={lessons.map((lesson) => ({
          id: lesson.id,
          node: (
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpenId((o) => (o === lesson.id ? null : lesson.id))}
                  className="shrink-0 rounded-md p-0.5 text-muted-2 transition-colors hover:text-foreground"
                  aria-label={openId === lesson.id ? "Recolher aula" : "Editar conteúdo da aula"}
                >
                  {openId === lesson.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
                <InlineText
                  value={lesson.title}
                  action={updateLessonFieldAction.bind(null, lesson.id, "title")}
                  className="min-w-0 flex-1 text-sm font-medium text-foreground"
                />
                <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-2" title="Alunos que concluíram">
                  <Users className="size-3" /> {num(lesson.completions)}
                </span>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Excluir a aula "${lesson.title}"?`,
                      message: "Ela some do método na hora e fica 30 dias na lixeira. O progresso dos alunos é preservado se você restaurar.",
                      confirmLabel: "Excluir aula",
                    });
                    if (!ok) return;
                    const res = await deleteLessonAction(lesson.id);
                    toast({
                      title: res.message,
                      kind: res.ok ? "success" : "error",
                      undo: res.ok ? async () => { await restoreLessonAction(lesson.id); router.refresh(); } : undefined,
                    });
                    router.refresh();
                  }}
                  className="shrink-0 rounded-md p-1 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label={`Excluir aula ${lesson.title}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {openId === lesson.id && (
                <div className="mt-2">
                  <MarkdownEditor
                    initial={lesson.content ?? ""}
                    onSave={(v) => updateLessonFieldAction(lesson.id, "content", v)}
                    minRows={12}
                  />
                </div>
              )}
            </div>
          ),
        }))}
      />

      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && newTitle.trim() && !creating) {
              setCreating(true);
              const res = await createLessonAction(moduleId, newTitle);
              setCreating(false);
              toast({ title: res.message, kind: res.ok ? "success" : "error" });
              if (res.ok) {
                setNewTitle("");
                if (res.id) setOpenId(res.id);
                router.refresh();
              }
            }
          }}
          placeholder="Título da nova aula… (Enter cria)"
          className="h-10 min-w-0 flex-1 rounded-lg border border-dashed border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
        <button
          disabled={creating || !newTitle.trim()}
          onClick={async () => {
            setCreating(true);
            const res = await createLessonAction(moduleId, newTitle);
            setCreating(false);
            toast({ title: res.message, kind: res.ok ? "success" : "error" });
            if (res.ok) {
              setNewTitle("");
              if (res.id) setOpenId(res.id);
              router.refresh();
            }
          }}
          className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Nova aula
        </button>
      </div>
    </div>
  );
}
