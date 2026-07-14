"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    question: "Qual é o seu objetivo principal?",
    options: [
      "Me vestir melhor no dia a dia",
      "Parecer mais elegante",
      "Melhorar minha imagem para sair ou ir a um date",
      "Ter mais presença",
    ],
    selected: 0,
  },
  {
    question: "Qual é a sua maior dificuldade?",
    options: [
      "Combinar as peças que já tenho",
      "Saber o que comprar",
      "Encontrar o que valoriza meu corpo",
      "Sair do básico sem exagerar",
    ],
    selected: 0,
  },
  {
    question: "Como você quer ser percebido?",
    options: ["Estiloso", "Elegante", "Criativo", "Discreto e bem vestido"],
    selected: 3,
  },
  {
    question: "Qual look você usaria em um sábado à tarde?",
    options: [
      "Camiseta lisa, calça reta e tênis limpo",
      "Peças amplas e streetwear",
      "Camisa aberta sobre camiseta",
      "Polo e calça de alfaiataria leve",
    ],
    selected: 0,
  },
  {
    question: "Qual paleta de cores mais combina com você?",
    options: ["Neutros e terrosos", "Preto e branco", "Tons frios", "Cores vivas pontuais"],
    selected: 1,
  },
] as const;

const RESULT_STEP = STEPS.length;
const STEP_MS = 2600;
const RESULT_MS = 4600;

export function OnboardingDemo() {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduced) return;
    const ms = step === RESULT_STEP ? RESULT_MS : STEP_MS;
    const t = setTimeout(() => setStep((s) => (s + 1) % (RESULT_STEP + 1)), ms);
    return () => clearTimeout(t);
  }, [step, inView, reduced]);

  const showResult = reduced ? true : step === RESULT_STEP;
  const current = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-6 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] md:p-8"
    >
      <div
        aria-hidden
        className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-[#146CFF]/[0.1] blur-[80px]"
      />

      {/* Indicador de etapas */}
      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              showResult || i <= step ? "bg-[#146CFF]" : "bg-white/[0.08]"
            )}
          />
        ))}
      </div>

      {showResult ? (
        <div key="result" className="animate-fade-up">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#146CFF]/[0.12] px-3 py-1 text-[11px] font-semibold text-[#78A9FF]">
            <Sparkles className="size-3" aria-hidden />
            Resultado do seu diagnóstico
          </p>
          <p className="font-display text-2xl font-bold text-[#F5F7FA]">
            Seu perfil principal:{" "}
            <span className="text-[#78A9FF]">Minimalista</span>
          </p>
          <p className="mt-2 text-sm text-[#A4AAB5]">
            Estilos complementares:{" "}
            <span className="font-semibold text-[#F5F7FA]">Smart Casual</span> e{" "}
            <span className="font-semibold text-[#F5F7FA]">Quiet Luxury</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Minimalista", "Smart Casual", "Quiet Luxury"].map((tag, i) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium",
                  i === 0
                    ? "border-[#146CFF]/60 bg-[#146CFF]/[0.12] text-[#78A9FF]"
                    : "border-[#20242C] bg-white/[0.02] text-[#A4AAB5]"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div key={step} className="animate-fade-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A4AAB5]">
            Pergunta {step + 1} de {STEPS.length}
          </p>
          <p className="mt-2 font-display text-lg font-bold text-[#F5F7FA] md:text-xl">
            {current.question}
          </p>
          <ul className="mt-4 space-y-2">
            {current.options.map((option, i) => {
              const selected = i === current.selected;
              return (
                <li
                  key={option}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                    selected
                      ? "border-[#146CFF]/70 bg-[#146CFF]/[0.1] text-[#F5F7FA]"
                      : "border-[#20242C] bg-white/[0.02] text-[#A4AAB5]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[#146CFF] bg-[#146CFF]"
                        : "border-[#20242C]"
                    )}
                  >
                    {selected && <Check className="size-3 text-white" aria-hidden />}
                  </span>
                  {option}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
