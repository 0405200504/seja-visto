import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ActionDayCard } from "@/components/app/action-day-card";
import { Progress } from "@/components/ui/progress";
import { ACTION_PLAN_DAYS } from "@/lib/constants";
import type { ActionPlanProgress } from "@/lib/types";

export const metadata: Metadata = { title: "Plano de Ação" };

export default async function PlanoDeAcaoPage() {
  const { supabase, user } = await requireProfile();

  const { data: progress } = await supabase
    .from("action_plan_progress")
    .select("*")
    .eq("user_id", user.id)
    .returns<ActionPlanProgress[]>();

  const byDay = new Map((progress ?? []).map((p) => [p.day, p]));
  const completedCount = (progress ?? []).filter((p) => p.completed).length;
  const pct = Math.round((completedCount / ACTION_PLAN_DAYS.length) * 100);
  const firstIncomplete =
    ACTION_PLAN_DAYS.find((d) => !byDay.get(d.day)?.completed)?.day ?? null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Desafio prático"
        title="Plano de ação de 7 dias"
        description="Uma missão por dia para tirar o método do papel e transformar seu visual na prática."
      />

      <div className="mb-8 max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Trophy className="size-4 text-accent" />
            Sua evolução
          </span>
          <span className="font-display font-semibold text-accent">
            {completedCount}/7 dias
          </span>
        </div>
        <Progress value={pct} />
        {completedCount === 7 && (
          <p className="mt-3 text-sm font-medium text-success">
            Desafio completo! Seu guarda-roupa nunca mais será o mesmo. 🏆
          </p>
        )}
      </div>

      <div className="space-y-3">
        {ACTION_PLAN_DAYS.map((day) => {
          const row = byDay.get(day.day);
          return (
            <ActionDayCard
              key={day.day}
              day={day}
              completed={row?.completed ?? false}
              notes={row?.notes ?? ""}
              locked={false}
              defaultOpen={day.day === firstIncomplete}
            />
          );
        })}
      </div>
    </div>
  );
}
