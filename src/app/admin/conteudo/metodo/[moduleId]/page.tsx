import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AutosaveForm, AutosaveInput, AutosaveTextarea } from "@/components/admin/ui/autosave";
import { ImageField } from "@/components/admin/content/content-helpers";
import { LessonsEditor, type LessonData } from "@/components/admin/content/lessons-editor";
import { updateModuleFieldAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

export default async function ModuloPage(props: { params: Promise<{ moduleId: string }> }) {
  await requireAdmin();
  const { moduleId } = await props.params;
  const db = createAdminClient();

  const [{ data: mod }, lessonsRes, progressRes] = await Promise.all([
    db.from("modules").select("*").eq("id", moduleId).maybeSingle(),
    db.from("lessons").select("id, title, content, order_index").eq("module_id", moduleId).is("deleted_at", null).order("order_index"),
    db.from("user_progress").select("lesson_id").eq("completed", true).eq("module_id", moduleId),
  ]);
  if (!mod || mod.deleted_at) notFound();

  const completions = new Map<string, number>();
  for (const p of progressRes.data ?? []) {
    completions.set(p.lesson_id, (completions.get(p.lesson_id) ?? 0) + 1);
  }

  const lessons: LessonData[] = (lessonsRes.data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    content: l.content,
    completions: completions.get(l.id) ?? 0,
  }));

  const updateField = updateModuleFieldAction.bind(null, moduleId);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/admin/conteudo/metodo" className="mb-1 flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="size-3" /> Todos os módulos
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">{mod.title}</h1>
      </div>

      <AutosaveForm action={updateField} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:col-span-2">
          <AutosaveInput name="title" label="Título do módulo" initial={mod.title} validate={(v) => (v.trim() ? null : "O título é obrigatório.")} />
          <AutosaveTextarea name="description" label="Descrição" initial={mod.description ?? ""} rows={3} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold text-muted">Capa do módulo</p>
          <ImageField
            value={mod.cover_image_url}
            folder="modulos"
            action={updateModuleFieldAction.bind(null, moduleId, "cover_image_url")}
            aspectHint="ideal 16:9"
          />
        </div>
      </AutosaveForm>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Aulas ({lessons.length})</h2>
        <p className="mb-3 text-xs text-muted">
          Arraste para reordenar · clique na seta para editar o conteúdo (markdown com preview e autosave).
        </p>
        <LessonsEditor moduleId={moduleId} lessons={lessons} />
      </section>
    </div>
  );
}
