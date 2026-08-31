"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Flame,
  Briefcase,
  Crown,
  Sparkles,
  Shirt,
  EyeOff,
  Coins,
  HeartCrack,
  Maximize2,
  Minimize2,
  MoveVertical,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FUNNEL_QUIZ_QUESTIONS } from "@/lib/funnel-data";
import { FunnelAnswers } from "./types";

interface QuizStepProps {
  onComplete: (answers: FunnelAnswers) => void;
  initialAnswers?: Partial<FunnelAnswers>;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Briefcase,
  Crown,
  Sparkles,
  Shirt,
  EyeOff,
  Coins,
  HeartCrack,
  Maximize2,
  Minimize2,
  MoveVertical,
  CheckCircle2,
};

export function QuizStep({ onComplete, initialAnswers }: QuizStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<FunnelAnswers>({
    name: initialAnswers?.name || "",
    mainGoal: initialAnswers?.mainGoal || "",
    painPoint: initialAnswers?.painPoint || "",
    desiredStyle: initialAnswers?.desiredStyle || "",
    bodyType: initialAnswers?.bodyType || "",
  });
  const [nameInput, setNameInput] = useState(answers.name);
  const [nameError, setNameError] = useState("");

  const currentQuestion = FUNNEL_QUIZ_QUESTIONS[currentQuestionIndex];
  const progressPercent = Math.round(
    ((currentQuestionIndex + 1) / FUNNEL_QUIZ_QUESTIONS.length) * 100
  );

  const handleNext = (field: keyof FunnelAnswers, value: string) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);

    if (currentQuestionIndex < FUNNEL_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete(updated);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setNameError("Por favor, digite seu nome para continuar");
      return;
    }
    setNameError("");
    handleNext("name", nameInput.trim());
  };

  return (
    <div className="relative mx-auto flex min-h-[90dvh] w-full max-w-2xl flex-col justify-between px-4 py-6 md:py-10">
      {/* Top Header & Barra de Progresso */}
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs font-medium text-[#A4AAB5] transition-colors hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#20242C] bg-[#0A0A0A] px-3 py-1 text-[11px] font-semibold text-[#78A9FF]">
            <Zap className="size-3 text-[#146CFF]" />
            <span>Etapa 1 de 3: Diagnóstico</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#1A1D24]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#146CFF] to-[#78A9FF] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-[#A4AAB5]">
          <span>Pergunta {currentQuestionIndex + 1} de {FUNNEL_QUIZ_QUESTIONS.length}</span>
          <span>{progressPercent}% concluído</span>
        </div>
      </div>

      {/* Card Principal da Pergunta */}
      <div className="my-auto py-6">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-[#146CFF]/10 px-3.5 py-1 text-xs font-semibold text-[#78A9FF]">
            Diagnóstico com Raphael Pereira
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#F5F7FA] md:text-3xl lg:text-4xl">
            {currentQuestion.title}
          </h1>
          <p className="mt-2 text-sm text-[#A4AAB5] md:text-base">
            {currentQuestion.subtitle}
          </p>
        </div>

        {/* 1. Pergunta de Texto: Nome */}
        {currentQuestion.type === "text" && (
          <form onSubmit={handleNameSubmit} className="mx-auto mt-6 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder={currentQuestion.placeholder}
                autoFocus
                className="w-full rounded-2xl border border-[#20242C] bg-[#0A0A0A] px-5 py-4 text-base font-medium text-[#F5F7FA] placeholder:text-[#A4AAB5]/50 focus:border-[#146CFF] focus:outline-none focus:ring-2 focus:ring-[#146CFF]/30"
              />
            </div>
            {nameError && (
              <p className="mt-2 text-xs font-medium text-red-400">{nameError}</p>
            )}

            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] to-[#0D57D6] py-4 text-sm font-bold tracking-wide text-white shadow-[0_0_30px_-5px_rgb(20_108_255/0.6)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              <span>INICIAR DIAGNÓSTICO GRATUITO</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}

        {/* 2. Pergunta de Múltipla Escolha Simples (Lista com Ícones) */}
        {currentQuestion.type === "single_choice" && currentQuestion.options && (
          <div className="grid gap-3 sm:grid-cols-1">
            {currentQuestion.options.map((option) => {
              const Icon = option.iconName ? ICON_MAP[option.iconName] || Sparkles : Sparkles;
              return (
                <button
                  key={option.id}
                  onClick={() => handleNext(currentQuestion.id as keyof FunnelAnswers, option.id)}
                  className="group relative flex items-start gap-4 rounded-2xl border border-[#20242C] bg-[#0A0A0A]/90 p-4 text-left transition-all duration-200 hover:border-[#146CFF]/80 hover:bg-[#146CFF]/[0.06] hover:shadow-[0_0_25px_-5px_rgb(20_108_255/0.25)] active:scale-[0.99] md:p-5"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#20242C] bg-[#111318] text-[#78A9FF] transition-colors group-hover:border-[#146CFF]/50 group-hover:bg-[#146CFF]/20 group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-semibold text-[#F5F7FA] transition-colors group-hover:text-white">
                      {option.label}
                    </h3>
                    {option.description && (
                      <p className="mt-1 text-xs leading-relaxed text-[#A4AAB5] group-hover:text-[#F5F7FA]/80">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#20242C] text-transparent transition-colors group-hover:border-[#146CFF] group-hover:text-[#146CFF]">
                    <ArrowRight className="size-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Pergunta de Escolha Visual (Cards com Fotos de Estilos) */}
        {currentQuestion.type === "visual_choice" && currentQuestion.options && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleNext(currentQuestion.id as keyof FunnelAnswers, option.id)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] text-left transition-all duration-300 hover:border-[#146CFF] hover:shadow-[0_0_30px_-5px_rgb(20_108_255/0.4)] active:scale-[0.98]"
              >
                {/* Imagem do Estilo */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#111318]">
                  {option.image && (
                    <Image
                      src={option.image}
                      alt={option.label}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
                  <div className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                    Toque para escolher
                  </div>
                </div>

                {/* Info do Estilo */}
                <div className="p-3">
                  <h3 className="font-display text-sm font-bold text-[#F5F7FA] group-hover:text-[#78A9FF]">
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-[#A4AAB5]">
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer de Prova e Segurança */}
      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-[#A4AAB5]/70">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-[#78A9FF]" />
          <span>Diagnóstico 100% gratuito e confidencial</span>
        </div>
        <p className="text-[11px]">
          Baseado no método de proporção aplicado em mais de 2.000 clientes e celebridades.
        </p>
      </div>
    </div>
  );
}
