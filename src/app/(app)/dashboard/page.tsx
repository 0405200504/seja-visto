import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarCheck,
  Heart,
  Layers,
  Palette,
  Play,
  Shirt,
  Sparkles,
  Tag,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LookCard } from "@/components/app/look-card";
import { STYLE_GOALS, STYLES } from "@/lib/constants";
import type { Look, Module } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

const GOAL_TO_OCCASION: Record<string, string> = {
  "dia-a-dia": "dia-a-dia",
  elegancia: "trabalho",
  "sair-date": "date",
  presenca: "noite",
  "guarda-roupa": "dia-a-dia",
};

const SHORTCUTS = [
  { href: "/metodo", label: "Começar o método", icon: BookOpen },
  { href: "/combinacoes", label: "Ver combinações", icon: Layers },
  { href: "/guias", label: "Guias de estilo", icon: BookMarked },
  { href: "/estilos", label: "Os 9 estilos", icon: Palette },
  { href: "/mais-procurados", label: "Mais procurados", icon: Tag },
  { href: "/guarda-roupa", label: "Guarda-roupa essencial", icon: Shirt },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/plano-de-acao", label: "Plano de 7 dias", icon: CalendarCheck },
];

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireProfile();

  const preferredStyle = profile.preferred_style ?? "casual";
  const recommendedOccasion = GOAL_TO_OCCASION[profile.style_goal ?? ""] ?? "dia-a-dia";

  const [
    { data: modules },
    { data: lessonCounts },
    { data: progressRows },
    { data: styleLooks },
    { data: favorites },
    { count: planDays },
  ] = await Promise.all([
    supabase.from("modules").select("*").order("order_index"),
    supabase.from("lessons").select("module_id"),
    supabase
      .from("user_progress")
      .select("module_id, lesson_id")
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("looks")
      .select("*")
      .or(`style.eq.${preferredStyle},occasion.eq.${recommendedOccasion}`)
      .limit(4),
    supabase.from("user_favorites").select("look_id").eq("user_id", user.id),
    supabase
      .from("action_plan_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
  ]);

  const completedLessonIds = new Set(
    (progressRows ?? []).map((p) => p.lesson_id).filter(Boolean)
  );
  const completedByModule = new Map<string, number>();
  for (const p of progressRows ?? []) {
    if (p.lesson_id) {
      completedByModule.set(p.module_id, (completedByModule.get(p.module_id) ?? 0) + 1);
    }
  }

  const totalLessons = lessonCounts?.length ?? 0;
  const overallProgress = totalLessons
    ? Math.round((completedLessonIds.size / totalLessons) * 100)
    : 0;

  // Próximo módulo recomendado: o primeiro (em ordem) que ainda não foi concluído.
  const lessonsPerModule = new Map<string, number>();
  for (const l of lessonCounts ?? []) {
    lessonsPerModule.set(l.module_id, (lessonsPerModule.get(l.module_id) ?? 0) + 1);
  }

  const nextModule =
    (modules as Module[] | null)?.find((m) => {
      const total = lessonsPerModule.get(m.id) ?? 0;
      return total === 0 || (completedByModule.get(m.id) ?? 0) < total;
    }) ?? (modules as Module[] | null)?.[0];

  const favoriteIds = new Set((favorites ?? []).map((f) => f.look_id));
  const firstName = profile.name?.split(" ")[0] ?? "Bem-vindo";

  return (
    <div className="animate-fade-up space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/15 blur-[100px]" />
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
          Sua central de estilo
        </p>
        <h1 className="text-2xl font-bold sm:text-4xl">
          Fala, {firstName}.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Objetivo: <span className="text-foreground">{STYLE_GOALS[profile.style_goal ?? ""] ?? "definir seu estilo"}</span>
          {" · "}Seu estilo:{" "}
          <Link href={`/estilos/${preferredStyle}`} className="text-accent hover:underline">
            {STYLES[preferredStyle] ?? "—"}
          </Link>
        </p>

        <div className="mt-8 max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted">Progresso geral do método</span>
            <span className="font-display font-semibold text-accent">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} />
          <p className="mt-2 text-xs text-muted-2">
            {completedLessonIds.size} de {totalLessons} aulas concluídas · {planDays ?? 0}/7 dias do plano
          </p>
        </div>
      </section>

      {/* Atalhos */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:bg-surface-2"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <s.icon className="size-4" />
              </span>
              <span className="text-sm font-medium leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Próximo módulo */}
      {nextModule && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">Continue de onde parou</h2>
            <Link href="/metodo" className="text-sm text-accent hover:underline">
              Ver método
            </Link>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="accent" className="mb-3">
                  <Sparkles className="size-3" />
                  Recomendado para você
                </Badge>
                <h3 className="font-display text-lg font-semibold">{nextModule.title}</h3>
                <p className="mt-1 max-w-lg text-sm text-muted leading-relaxed">
                  {nextModule.description}
                </p>
              </div>
              <Link href={`/metodo/${nextModule.id}`}>
                <Button size="lg" className="w-full sm:w-auto">
                  <Play className="size-4" />
                  Continuar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Looks recomendados */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">Looks para o seu perfil</h2>
          <Link
            href="/combinacoes"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            Ver todos
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {((styleLooks as Look[] | null) ?? []).map((look) => (
            <LookCard key={look.id} look={look} isFavorite={favoriteIds.has(look.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
