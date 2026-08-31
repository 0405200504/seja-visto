import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import {
  ProblemSection,
  SolutionSection,
  ProofSection,
} from "@/components/landing/sections-core";
import {
  LookbookSection,
  FitCheckSection,
} from "@/components/landing/features";
import { MethodSection, StylesSection } from "@/components/landing/content-sections";
import {
  ComparisonSection,
  RaphaelSection,
  ForWhoSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
  LandingFooter,
} from "@/components/landing/closing-sections";
import { SectionCta } from "@/components/landing/cta";

export const metadata: Metadata = {
  title: "MPO — Um simples ajuste no visual muda como te tratam",
  description:
    "228 combinações prontas montadas por stylist: escolha a ocasião e o outfit vem peça por peça, com o porquê de funcionar.",
};

export default function ApresentacaoPage() {
  return (
    <div className="landing-page bg-[#050505] text-[#F5F7FA]">
      <LandingHeader />
      <main>
        <Hero />
        <ProofSection />
        <ProblemSection />
        <SolutionSection />
        <SectionCta
          label="QUERO AS 228 COMBINAÇÕES"
          nota="Acesso liberado na hora · 7 dias de garantia"
        />
        <LookbookSection />
        <SectionCta
          label="VER AS 228 COMBINAÇÕES"
          nota="Escolha a ocasião e o outfit vem montado"
        />
        <FitCheckSection />
        <SectionCta
          label="QUERO O FIT CHECK E AS 228 COMBINAÇÕES"
          nota="Tudo incluso, sem pagar nada a mais"
        />
        <StylesSection />
        <SectionCta
          label="QUERO AS 228 COMBINAÇÕES"
          nota="Menos de R$0,90 por dia"
        />
        <MethodSection />
        <SectionCta
          label="QUERO O MÉTODO COMPLETO"
          nota="8 módulos e 38 aulas inclusos no mesmo acesso"
        />
        <ComparisonSection />
        <RaphaelSection />
        <SectionCta
          label="QUERO COMEÇAR AGORA"
          nota="Teste 7 dias · não gostou, devolvemos 100%"
        />
        <ForWhoSection />
        <SectionCta
          label="QUERO AS 228 COMBINAÇÕES"
          nota="Acesso liberado na hora, direto no e-mail"
        />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
