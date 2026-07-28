import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { num, pct } from "@/lib/admin/format";
import { SortableList } from "@/components/admin/ui/sortable-list";
import { InlineText } from "@/components/admin/ui/inline-edit";
import { NewModuleForm } from "@/components/admin/content/new-module-form";
import { DeleteEntityButton } from "@/components/admin/content/content-helpers";
import {
  deleteModuleAction,
  reorderModulesAction,
  restoreModuleAction,
  updateModuleFieldAction,
} from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

export default async function MetodoPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [modulesRes, lessonsRes, progressRes, studentsRes] = await Promise.all([
    db.from("modules").select("*").is("deleted_at", null).order("order_index"),
    db.from("lessons").select("id, module_id").is("deleted_at", null),
    db.from("user_progress").select("lesson_id").eq("completed", true).limit(50000),
    db.from("users_profile").select("*", { count: "exact", head: true }).eq("is_admin", false),
  ]);

  const modules = modulesRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const students = studentsRes.count ?? 0;

  const lessonsByModule = new Map<string, string[]>();
  for (const l of lessons) {
    lessonsByModule.set(l.module_id, [...(lessonsByModule.get(l.module_id) ?? []), l.id]);
  }
  const completionsByLesson = new Map<string, number>();
  for (const p of progressRes.data ?? []) {
    completionsByLesson.set(p.lesson_id, (completionsByLesson.get(p.lesson_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Método</h1>
          <p className="mt-0.5 text-xs text-muted">
            {num(modules.length)} módulos · {num(lessons.length)} aulas — arraste para reordenar; a ordem vale na hora para os alunos.
          </p>
        </div>
        <NewModuleForm />
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <BookOpen className="mx-auto size-6 text-muted-2" />
          <p className="mt-2 text-sm text-muted">Nenhum módulo ainda — crie o primeiro acima.</p>
        </div>
      ) : (
        <SortableList
          onReorder={reorderModulesAction}
          items={modules.map((mod, i) => {
            const modLessons = lessonsByModule.get(mod.id) ?? [];
            const completions = modLessons.reduce((a, id) => a + (completionsByLesson.get(id) ?? 0), 0);
            const completionPct =
              students > 0 && modLessons.length > 0 ? (completions / (students * modLessons.length)) * 100 : 0;
            return {
              id: mod.id,
              node: (
                <div className="flex items-center gap-3">
                  {mod.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mod.cover_image_url} alt="" className="size-11 shrink-0 rounded-lg border border-border object-cover" />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-3 font-display text-sm font-bold text-muted">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <InlineText
                      value={mod.title}
                      action={updateModuleFieldAction.bind(null, mod.id, "title")}
                      className="text-sm font-semibold text-foreground"
                    />
                    <p className="mt-0.5 pl-1 text-[11px] text-muted-2">
                      {modLessons.length} aulas · conclusão média {pct(completionPct)}
                    </p>
                  </div>
                  <DeleteEntityButton
                    label=""
                    confirm={{
                      title: `Excluir o módulo "${mod.title}"?`,
                      message: `O módulo e as ${modLessons.length} aulas dele somem do método na hora e ficam 30 dias na lixeira.`,
                      typeToConfirm: mod.title,
                      confirmLabel: "Excluir módulo",
                    }}
                    action={deleteModuleAction.bind(null, mod.id)}
                    undoAction={restoreModuleAction.bind(null, mod.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
                  />
                  <Link
                    href={`/admin/conteudo/metodo/${mod.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border-strong"
                  >
                    Aulas <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
