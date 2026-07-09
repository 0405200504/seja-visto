import { notFound } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { deleteModule, upsertLesson, deleteLesson } from "@/app/actions/admin";
import { PageHeader } from "@/components/app/page-header";
import { ModuleForm } from "@/components/admin/module-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson, Module } from "@/lib/types";

function LessonFields({ moduleId, lesson }: { moduleId: string; lesson?: Lesson }) {
  return (
    <form action={upsertLesson} className="space-y-4">
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      <input type="hidden" name="module_id" value={moduleId} />

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label>Título da aula *</Label>
          <Input name="title" defaultValue={lesson?.title} required />
        </div>
        <div className="space-y-2">
          <Label>Ordem</Label>
          <Input name="order_index" type="number" defaultValue={lesson?.order_index ?? 0} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <Textarea
          name="content"
          rows={8}
          defaultValue={lesson?.content ?? ""}
          placeholder={"Use parágrafos separados por linha em branco.\n\n## Subtítulo\n\n- item de lista\n- outro item"}
        />
      </div>

      <Button type="submit" size="sm">
        {lesson ? "Salvar aula" : "Adicionar aula"}
      </Button>
    </form>
  );
}

export default async function EditarModuloPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: mod }, { data: lessons }] = await Promise.all([
    supabase.from("modules").select("*").eq("id", moduleId).single<Module>(),
    supabase
      .from("lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index")
      .returns<Lesson[]>(),
  ]);

  if (!mod) notFound();

  return (
    <div className="animate-fade-up space-y-12">
      <div>
        <PageHeader title="Editar módulo" description={mod.title} />
        <ModuleForm module={mod} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">Aulas do módulo</h2>
        <p className="mb-5 text-sm text-muted">
          {lessons?.length ?? 0} aulas — clique para expandir e editar.
        </p>

        <div className="max-w-3xl space-y-2.5">
          {(lessons ?? []).map((lesson) => (
            <details
              key={lesson.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="mr-3 text-xs text-muted">#{lesson.order_index}</span>
                  {lesson.title}
                </span>
                <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-border px-5 py-5">
                <LessonFields moduleId={mod.id} lesson={lesson} />
                <form action={deleteLesson}>
                  <input type="hidden" name="id" value={lesson.id} />
                  <input type="hidden" name="module_id" value={mod.id} />
                  <Button variant="danger" size="sm" type="submit">
                    <Trash2 className="size-3.5" />
                    Excluir aula
                  </Button>
                </form>
              </div>
            </details>
          ))}

          <details className="group overflow-hidden rounded-2xl border border-dashed border-border-strong bg-surface/50">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
              <Plus className="size-4" />
              Adicionar nova aula
            </summary>
            <div className="border-t border-border px-5 py-5">
              <LessonFields moduleId={mod.id} />
            </div>
          </details>
        </div>
      </div>

      <div className="max-w-3xl rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <h3 className="mb-1 text-sm font-semibold text-danger">Zona de perigo</h3>
        <p className="mb-4 text-sm text-muted">
          Excluir o módulo remove também todas as aulas e o progresso associado.
        </p>
        <form action={deleteModule}>
          <input type="hidden" name="id" value={mod.id} />
          <Button variant="danger" size="sm" type="submit">
            <Trash2 className="size-3.5" />
            Excluir módulo
          </Button>
        </form>
      </div>
    </div>
  );
}
