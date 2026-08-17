import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ListChecks } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { ModuleHero } from "@/components/app/module-hero";
import { LessonList } from "@/components/app/lesson-list";
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
      supabase.from("modules").select("id, title").order("order_index"),
    ]);

  if (!mod) notFound();

  const ordem = ((allModules ?? []) as { id: string; title: string }[]).filter(Boolean);
  const posicao = ordem.findIndex((m) => m.id === mod.id);
  const moduleIndex = posicao + 1;
  const proximo = posicao >= 0 ? ordem[posicao + 1] : undefined;

  // Só conta progresso de aula que ainda existe neste módulo — assim o
  // percentual nunca passa de 100% se uma aula sair do ar.
  const idsDasAulas = new Set((lessons ?? []).map((l) => l.id));
  const completedIds = (progress ?? [])
    .map((p) => p.lesson_id)
    .filter((id): id is string => Boolean(id) && idsDasAulas.has(id));
  const total = lessons?.length ?? 0;

  return (
    <div className="animate-fade-up">
      <ModuleHero
        title={mod.title}
        description={mod.description}
        coverUrl={mod.cover_image_url}
        index={moduleIndex}
        feitas={completedIds.length}
        total={total}
      />

      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <ListChecks className="size-5 text-accent" />
        Aulas
      </h2>
      <LessonList moduleId={mod.id} lessons={lessons ?? []} completedIds={completedIds} />

      {proximo && (
        <Link
          href={`/metodo/${proximo.id}`}
          className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:border-border-strong hover:shadow-glow"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Próximo módulo
            </span>
            <span className="mt-1 block truncate font-display text-base font-semibold text-foreground">
              {proximo.title}
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-accent" />
        </Link>
      )}
    </div>
  );
}
