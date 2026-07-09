"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { saveOnboarding } from "@/app/actions/onboarding";
import { STYLE_QUIZ, STYLE_PROFILES, QUIZ_TIEBREAK } from "@/lib/constants";
import { cn } from "@/lib/utils";

function computeStyle(answers: Record<string, string>): string {
  const scores: Record<string, number> = {};
  for (const question of STYLE_QUIZ) {
    const option = question.options.find((o) => o.value === answers[question.field]);
    if (!option) continue;
    for (const [style, pts] of Object.entries(option.points)) {
      scores[style] = (scores[style] ?? 0) + pts;
    }
  }
  let winner = QUIZ_TIEBREAK[0];
  let best = -1;
  for (const style of QUIZ_TIEBREAK) {
    const score = scores[style] ?? 0;
    if (score > best) {
      best = score;
      winner = style;
    }
  }
  return winner;
}

export function OnboardingFlow({ name }: { name: string | null }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [pending, startTransition] = useTransition();

  const firstName = name?.split(" ")[0];
  const result = useMemo(
    () => (showResult ? computeStyle(answers) : null),
    [showResult, answers]
  );

  function finish() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("style_goal", answers.style_goal);
      formData.set("main_difficulty", answers.main_difficulty);
      formData.set("preferred_style", computeStyle(answers));
      await saveOnboarding(formData);
    });
  }

  /* ---------- Tela de resultado ---------- */
  if (showResult && result) {
    const profile = STYLE_PROFILES[result];
    return (
      <div className="w-full max-w-lg animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center shadow-card sm:p-10">
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full bg-accent/15 blur-[90px]" />

          <div className="relative">
            <Badge variant="accent" className="mb-6">
              <Sparkles className="size-3" />
              Seu resultado
            </Badge>

            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">
              {firstName ? `${firstName}, o` : "O"} estilo que mais combina com você é
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
              {profile.label}
            </h1>
            <p className="mt-2 text-sm font-medium text-accent">{profile.tagline}</p>

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
              {profile.description}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {profile.keyPieces.map((piece) => (
                <Badge key={piece}>{piece}</Badge>
              ))}
            </div>

            <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3 text-left">
              <Unlock className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-foreground/90">
                Isso é um ponto de partida, não uma limitação: você tem acesso a{" "}
                <span className="font-semibold">todos os 9 estilos</span> da plataforma e pode
                explorar qualquer um deles quando quiser.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-2.5">
              <Button size="lg" onClick={finish} disabled={pending} className="w-full">
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Concluir e entrar"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowResult(false)}
                disabled={pending}
                className="w-full"
              >
                <ArrowLeft className="size-4" />
                Rever respostas
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Perguntas ---------- */
  const current = STYLE_QUIZ[step];
  const selected = answers[current.field];
  const isLast = step === STYLE_QUIZ.length - 1;

  return (
    <div className="w-full max-w-lg animate-fade-up">
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
          Passo {step + 1} de {STYLE_QUIZ.length}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {step === 0 && firstName ? `${firstName}, ` : ""}
          {current.title}
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">{current.subtitle}</p>
        <Progress value={((step + 1) / STYLE_QUIZ.length) * 100} className="mt-6" />
      </div>

      <div className="space-y-3" key={current.field}>
        {current.options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setAnswers((a) => ({ ...a, [current.field]: option.value }))
              }
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all duration-200 sm:text-base",
                active
                  ? "border-accent bg-accent-soft text-foreground shadow-glow"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-2 hover:text-foreground"
              )}
            >
              {option.label}
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                  active ? "border-accent bg-accent" : "border-border-strong"
                )}
              >
                {active && <Check className="size-3 text-white" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button
          onClick={() => (isLast ? setShowResult(true) : setStep((s) => s + 1))}
          disabled={!selected}
          size="lg"
        >
          {isLast ? (
            <>
              Ver meu estilo
              <Sparkles className="size-4" />
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
