"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Check, Lock, Zap } from "lucide-react";
import { FunnelAnswers } from "./types";
import { STYLE_NAMES_MAP } from "@/lib/funnel-data";

interface AnalyzingStepProps {
  answers: FunnelAnswers;
  onComplete: () => void;
}

const STEPS = [
  "Cruzando suas respostas com o banco de 228 combinações...",
  "Identificando falhas de proporção e caimento no seu perfil...",
  "Calibrando referências para a sua estética escolhida...",
  "Calculando seu Índice de Magnetismo e Presença...",
  "Conectando ao canal VIP direto com Raphael Pereira...",
];

export function AnalyzingStep({ answers, onComplete }: AnalyzingStepProps) {
  const [progress, setProgress] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const cleanName = answers.name?.trim() ? answers.name.trim() : "você";
  const styleLabel = STYLE_NAMES_MAP[answers.desiredStyle] || "Casual Sofisticado";

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 45); // ~4 segundos total

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 25) setCurrentStepIndex(0);
    else if (progress < 50) setCurrentStepIndex(1);
    else if (progress < 75) setCurrentStepIndex(2);
    else if (progress < 95) setCurrentStepIndex(3);
    else setCurrentStepIndex(4);
  }, [progress]);

  return (
    <div className="relative mx-auto flex min-h-[85dvh] w-full max-w-lg flex-col items-center justify-center px-5 py-10 text-center">
      {/* Glow de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(20,108,255,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Avatar do Raphael com Radar Scanner */}
      <div className="relative mb-8">
        <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-[#146CFF] bg-[#0A0A0A] p-1 shadow-[0_0_40px_-5px_rgb(20_108_255/0.8)] md:size-32">
          <div className="relative size-full overflow-hidden rounded-full">
            <Image
              src="/images/raphael/raphael.jpg"
              alt="Raphael Pereira"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          {/* Radar spinner animado */}
          <div className="absolute -inset-2.5 animate-spin rounded-full border-2 border-transparent border-t-[#78A9FF] border-r-[#146CFF]/40 duration-[2000ms]" />
        </div>

        {/* Badge VIP */}
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#146CFF]/50 bg-[#050505] px-3 py-0.5 text-[11px] font-bold text-[#78A9FF] shadow-md">
          <Zap className="size-3 text-[#146CFF]" />
          <span>Raphael Pereira · Stylist</span>
        </div>
      </div>

      {/* Título */}
      <h2 className="font-display text-2xl font-bold tracking-tight text-[#F5F7FA] md:text-3xl">
        Analisando o perfil de {cleanName}…
      </h2>
      <p className="mt-2 text-sm text-[#A4AAB5]">
        Gerando diagnóstico personalizado para estilo{" "}
        <span className="font-semibold text-[#78A9FF]">{styleLabel}</span>.
      </p>

      {/* Barra de Progresso com % */}
      <div className="mt-8 w-full max-w-sm">
        <div className="flex justify-between text-xs font-semibold text-[#78A9FF]">
          <span>Processando</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#1A1D24]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#146CFF] via-[#3B82F6] to-[#78A9FF] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist de Validação Dinâmica */}
      <div className="mt-8 w-full max-w-sm space-y-3 text-left">
        {STEPS.map((stepText, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;

          return (
            <div
              key={stepText}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-xs transition-all duration-300 ${
                isDone
                  ? "border-[#146CFF]/40 bg-[#146CFF]/[0.08] text-[#F5F7FA]"
                  : isCurrent
                  ? "border-[#20242C] bg-[#111318] text-[#78A9FF] shadow-[0_0_15px_-3px_rgb(20_108_255/0.2)]"
                  : "border-transparent text-[#A4AAB5]/40"
              }`}
            >
              {isDone ? (
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#146CFF] text-white">
                  <Check className="size-2.5 stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="size-4 shrink-0 animate-pulse rounded-full border-2 border-[#146CFF] bg-[#146CFF]/30" />
              ) : (
                <div className="size-4 shrink-0 rounded-full border border-white/10" />
              )}
              <span className="truncate font-medium">{stepText}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-xs text-[#A4AAB5]/60">
        <Lock className="size-3.5" />
        <span>Canal criptografado de alta precisão</span>
      </div>
    </div>
  );
}
