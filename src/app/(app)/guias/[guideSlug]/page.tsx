import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { OutfitBuilder } from "@/components/app/outfit-builder";
import { ColorMixer } from "@/components/app/color-mixer";
import { MeasureForm } from "@/components/app/measure-form";
import { Section } from "@/components/app/guide-sections";
import { GUIDES, getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ guideSlug: g.slug }));
}

const INTERACTIVE = {
  outfits: OutfitBuilder,
  cores: ColorMixer,
  medidas: MeasureForm,
} as const;

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ guideSlug: string }>;
}) {
  const { guideSlug } = await params;
  const guide = getGuide(guideSlug);
  if (!guide) notFound();

  await requireProfile();

  const Interactive = guide.interactive ? INTERACTIVE[guide.interactive.kind] : null;

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <Link
        href="/guias"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os guias
      </Link>

      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <guide.icon className="size-6" />
          </span>
          <Badge>
            <Clock className="size-3" />
            {guide.minutes} min
          </Badge>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{guide.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{guide.short}</p>
      </div>

      <div className="space-y-10">
        {guide.sections.map((section, i) => (
          <div key={i} className="space-y-10">
            <Section section={section} />
            {Interactive && guide.interactive?.after === i && <Interactive />}
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">Coloque em prática:</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/combinacoes"
            className="rounded-xl border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Ver combinações
          </Link>
          <Link
            href="/guarda-roupa"
            className="rounded-xl border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Guarda-roupa essencial
          </Link>
          <Link
            href="/plano-de-acao"
            className="rounded-xl border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Plano de 7 dias
          </Link>
        </div>
      </div>
    </div>
  );
}
