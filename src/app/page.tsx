import type { Metadata } from "next";
import { LandingHeader, StickyCta } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import {
  ProblemSection,
  SolutionSection,
  OnboardingSection,
  MetricsSection,
} from "@/components/landing/sections-core";
import {
  FeaturesSection,
  LookbookSection,
  FitCheckSection,
} from "@/components/landing/features";
import {
  StylesSection,
  GuidesSection,
  GlossarySection,
  WardrobeSection,
  PlanSection,
} from "@/components/landing/content-sections";
import {
  ComparisonSection,
  RaphaelSection,
  ForWhoSection,
  StackSection,
  PricingSection,
  FaqSection,
  FinalCtaSection,
  LandingFooter,
} from "@/components/landing/closing-sections";

export const metadata: Metadata = {
  title: "MPO — Descubra seu estilo e aprenda a se vestir melhor",
  description:
    "Lookbook, guias práticos, guarda-roupa inteligente, plano de ação e Fit Check com IA para você construir um estilo que realmente tenha a sua cara.",
  openGraph: {
    title: "MPO — Descubra seu estilo e aprenda a se vestir melhor",
    description:
      "Lookbook, guias práticos, guarda-roupa inteligente, plano de ação e Fit Check com IA para você construir um estilo que realmente tenha a sua cara.",
    type: "website",
    locale: "pt_BR",
    siteName: "MPO — Manual Prático do Outfit",
    images: [{ url: "/logo-mpo-original.png", width: 512, height: 512, alt: "MPO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MPO — Descubra seu estilo e aprenda a se vestir melhor",
    description:
      "Lookbook, guias práticos, guarda-roupa inteligente, plano de ação e Fit Check com IA.",
  },
};

export default function Home() {
  return (
    <div className="landing-page bg-[#050505] text-[#F5F7FA]">
      <LandingHeader />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <OnboardingSection />
        <MetricsSection />
        <FeaturesSection />
        <LookbookSection />
        <FitCheckSection />
        <StylesSection />
        <GuidesSection />
        <GlossarySection />
        <WardrobeSection />
        <PlanSection />
        <ComparisonSection />
        <RaphaelSection />
        <ForWhoSection />
        <StackSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
      <StickyCta />
    </div>
  );
}
