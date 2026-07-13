import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { FitCheckChat } from "@/components/app/fit-check-chat";

export const metadata: Metadata = { title: "Fit Check" };

export default async function FitCheckPage() {
  await requireProfile();

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="IA"
        title="Fit Check"
        description="Manda a foto do seu fit e recebe o feedback na hora: o que tá funcionando, o que melhorar e a nota."
      />
      <FitCheckChat />
    </div>
  );
}
