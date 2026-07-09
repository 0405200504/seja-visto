import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ModuleCover } from "@/components/app/module-cover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Module } from "@/lib/types";

export const metadata: Metadata = { title: "Método" };

export default async function MetodoPage() {
  const { supabase, user } = await requireProfile();

  const [{ data: modules }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("modules").select("*").order("order_index"),
    supabase.from("lessons").select("id, module_id"),
    supabase
      .from("user_progress")
      .select("module_id, lesson_id")
      .eq("user_id", user.id)
      .eq("completed", true),
  ]);

  const lessonsPerModule = new Map<string, number>();
  for (const l of lessons ?? []) {
    lessonsPerModule.set(l.module_id, (lessonsPerModule.get(l.module_id) ?? 0) + 1);
  }
  const donePerModule = new Map<string, number>();
  for (const p of progress ?? []) {
    if (p.lesson_id) {
      donePerModule.set(p.module_id, (donePerModule.get(p.module_id) ?? 0) + 1);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="O Método"
        title="Módulos do programa"
        description="Do diagnóstico ao plano de ação: siga a ordem para construir seu estilo com base sólida."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {((modules as Module[] | null) ?? []).map((mod, i) => {
          const total = lessonsPerModule.get(mod.id) ?? 0;
          const done = donePerModule.get(mod.id) ?? 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const complete = total > 0 && done >= total;

          return (
            <Link
              key={mod.id}
              href={`/metodo/${mod.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow"
            >
              <div className="relative aspect-[16/8] overflow-hidden">
                <ModuleCover coverUrl={mod.cover_image_url} title={mod.title} index={i + 1} />
                {complete && (
                  <Badge variant="success" className="absolute right-3 top-3">
                    <CheckCircle2 className="size-3" />
                    Concluído
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-display text-base font-semibold leading-snug">
                  {mod.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted leading-relaxed">
                  {mod.description}
                </p>
                <div className="mt-auto pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                    <span>
                      {done}/{total} aulas
                    </span>
                    <span className="font-medium text-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
