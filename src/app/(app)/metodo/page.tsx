import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { ModuleBillboard } from "@/components/app/module-billboard";
import { ModuleRail } from "@/components/app/module-rail";
import { ModulePoster, type ModuleCardData } from "@/components/app/module-poster";
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

  const cards: (ModuleCardData & { description: string | null })[] = (
    (modules as Module[] | null) ?? []
  ).map((mod, i) => {
    const total = lessonsPerModule.get(mod.id) ?? 0;
    // O progresso nunca passa do total de aulas do módulo: se uma aula sair do
    // ar pelo admin, o registro antigo não pode virar "5 de 4 aulas".
    const done = Math.min(donePerModule.get(mod.id) ?? 0, total);
    return {
      id: mod.id,
      title: mod.title,
      description: mod.description,
      coverUrl: mod.cover_image_url,
      index: i + 1,
      total,
      done,
    };
  });

  if (cards.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
        Os módulos do método aparecem aqui assim que o conteúdo for publicado.
      </div>
    );
  }

  const emAndamento = cards.filter((c) => c.done > 0 && c.done < c.total);
  const concluidos = cards.filter((c) => c.total > 0 && c.done >= c.total);

  // Destaque: o módulo já começado (o primeiro deles) ou o próximo da fila.
  const destaque = emAndamento[0] ?? cards.find((c) => c.done < c.total) ?? cards[0];

  const totalAulas = cards.reduce((s, c) => s + c.total, 0);
  const totalFeitas = cards.reduce((s, c) => s + c.done, 0);
  const pctGeral = totalAulas ? Math.round((totalFeitas / totalAulas) * 100) : 0;

  return (
    <div className="animate-fade-up">
      <ModuleBillboard
        mod={destaque}
        description={destaque.description}
        resumo={`${totalAulas} aulas no método · ${pctGeral}% concluído`}
      />

      <div className="space-y-9 sm:space-y-11">
        {emAndamento.length > 0 && (
          <ModuleRail title="Continue assistindo" hint="Você começou, falta terminar">
            {emAndamento.map((mod) => (
              <ModulePoster key={mod.id} mod={mod} />
            ))}
          </ModuleRail>
        )}

        <ModuleRail title="Todos os módulos" hint={`${cards.length} módulos · na ordem certa`}>
          {cards.map((mod) => (
            <ModulePoster key={mod.id} mod={mod} />
          ))}
        </ModuleRail>

        {concluidos.length > 0 && (
          <ModuleRail title="Concluídos" hint="Volte quando quiser revisar">
            {concluidos.map((mod) => (
              <ModulePoster key={mod.id} mod={mod} />
            ))}
          </ModuleRail>
        )}

        {pctGeral === 100 && (
          <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.07] p-5">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <p className="text-sm text-foreground">
              Método completo. Agora é manutenção: use o Plano de Ação e o Catálogo de
              Outfits toda semana.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
