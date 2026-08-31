"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { QuizStep } from "./quiz-step";
import { AnalyzingStep } from "./analyzing-step";
import { ChatStep } from "./chat-step";
import { SalesStep } from "./sales-step";
import { FunnelAnswers, FunnelStep } from "./types";

const STORAGE_KEY = "mpo_funnel_state_v1";

const DEFAULT_ANSWERS: FunnelAnswers = {
  name: "",
  mainGoal: "attraction",
  painPoint: "full_closet_nothing_to_wear",
  desiredStyle: "casual",
  bodyType: "proportions",
};

export function FunnelOrchestrator() {
  const [step, setStep] = useState<FunnelStep>("quiz");
  const [answers, setAnswers] = useState<FunnelAnswers>(DEFAULT_ANSWERS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega estado prévio salvo se houver
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.step) setStep(parsed.step);
      }
    } catch (e) {
      // Ignore storage errors
    }
    setIsLoaded(true);
  }, []);

  // Salva alterações
  const saveState = (newStep: FunnelStep, newAnswers: FunnelAnswers) => {
    setStep(newStep);
    setAnswers(newAnswers);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step: newStep, answers: newAnswers })
      );
    } catch (e) {
      // Ignore storage errors
    }
  };

  const handleQuizComplete = (finalAnswers: FunnelAnswers) => {
    saveState("analyzing", finalAnswers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyzingComplete = () => {
    saveState("chat", answers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChatComplete = () => {
    saveState("sales", answers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#F5F7FA]">
        <div className="size-8 animate-spin rounded-full border-2 border-[#146CFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F7FA] selection:bg-[#146CFF] selection:text-white">
      {/* Top Navbar Minimalista */}
      <header className="sticky top-0 z-50 border-b border-[#20242C]/80 bg-[#050505]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-24">
              <Image
                src="/logo-mpo.png"
                alt="MPO"
                fill
                sizes="96px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-[#A4AAB5]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="hidden sm:inline">Raphael Pereira Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Renderização condicional das etapas */}
      <main className="relative flex min-h-[calc(100vh-61px)] flex-col justify-center">
        {step === "quiz" && (
          <QuizStep
            initialAnswers={answers}
            onComplete={handleQuizComplete}
          />
        )}

        {step === "analyzing" && (
          <AnalyzingStep
            answers={answers}
            onComplete={handleAnalyzingComplete}
          />
        )}

        {step === "chat" && (
          <div className="py-4 md:py-8">
            <ChatStep answers={answers} onComplete={handleChatComplete} />
          </div>
        )}

        {step === "sales" && <SalesStep answers={answers} />}
      </main>
    </div>
  );
}
