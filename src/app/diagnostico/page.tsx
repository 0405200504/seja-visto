import type { Metadata } from "next";
import { FunnelOrchestrator } from "@/components/funnel/funnel-orchestrator";

export const metadata: Metadata = {
  title: "Diagnóstico de Estilo & Presença — Raphael Pereira",
  description:
    "Descubra sua estética ideal, corrija seus 3 erros de proporção e veja como mudar a temperatura do ambiente nos primeiros 7 segundos.",
  openGraph: {
    title: "Diagnóstico de Estilo & Presença — Raphael Pereira",
    description:
      "Faça o teste de estilo gratuito de 60 segundos com o stylist dos artistas.",
    images: [{ url: "/images/raphael/raphael.jpg", width: 800, height: 1000, alt: "Raphael Pereira" }],
  },
};

export default function DiagnosticoPage() {
  return <FunnelOrchestrator />;
}
