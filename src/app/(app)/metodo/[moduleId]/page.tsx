import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { ModuleCover } from "@/components/app/module-cover";
import { LessonList } from "@/components/app/lesson-list";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Lesson, Module } from "@/lib/types";

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const { supabase, user } = await requireProfile();

  const [{ data: mod }, { data: lessons }, { data: progress }, { data: allModules }] =
    await Promise.all([
      supabase.from("modules").select("*").eq("id", moduleId).single<Module>(),
      supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index")
        .returns<Lesson[]>(),
      supabase
        .from("user_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("module_id", moduleId)
        .eq("completed", true),
      supabase.from("modules").select("id").order("order_index"),
    ]);

  if (!mod) notFound();

  const moduleIndex = (allModules ?? []).findIndex((m) => m.id === mod.id) + 1;
  const completedIds = (progress ?? []).map((p) => p.lesson_id).filter(Boolean) as string[];
  const total = lessons?.length ?? 0;
  const pct = total ? Math.round((completedIds.length / total) * 100) : 0;

  return (
    <div className="animate-fade-up">
      <Link
        href="/metodo"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para o método
      </Link>

      <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-card">
        <div className="relative aspect-[16/6] sm:aspect-[16/4]">
          <ModuleCover coverUrl={mod.cover_image_url} title={mod.title} index={moduleIndex} />
        </div>
        <div className="bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">{mod.title}</h1>
            {pct === 100 && (
              <Badge variant="success">
                <CheckCircle2 className="size-3" />
                Concluído
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {mod.description}
          </p>
          <div className="mt-6 max-w-sm">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>
                {completedIds.length}/{total} aulas concluídas
              </span>
              <span className="font-medium text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Aulas</h2>
      <LessonList moduleId={mod.id} lessons={lessons ?? []} completedIds={completedIds} />
    </div>
  );
}
