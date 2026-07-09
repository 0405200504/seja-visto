import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, Lightbulb } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { OutfitBuilder } from "@/components/app/outfit-builder";
import { ColorMixer } from "@/components/app/color-mixer";
import { MeasureForm } from "@/components/app/measure-form";
import { GUIDES, getGuide, type GuideSection } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ guideSlug: g.slug }));
}

function Section({ section }: { section: GuideSection }) {
  switch (section.kind) {
    case "text":
      return (
        <section>
          {section.title && (
            <h2 className="mb-3 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="space-y-4">
            {section.body.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted sm:text-[15px]">
                {p}
              </p>
            ))}
          </div>
        </section>
      );

    case "steps":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <h3 className="font-display text-[15px] font-semibold">{item.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "table":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  {section.head.map((h) => (
                    <th key={h} className="px-4 py-3.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border bg-surface last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={
                          j === 0
                            ? "px-4 py-3.5 font-medium text-foreground"
                            : "px-4 py-3.5 leading-relaxed text-muted"
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.note && <p className="mt-2 text-xs text-muted-2">{section.note}</p>}
        </section>
      );

    case "tips":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <ul className="space-y-2.5">
            {section.items.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <Check className="size-3 text-accent" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      );

    case "callout":
      return (
        <section className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent-soft/60 p-5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
            {section.body}
          </p>
        </section>
      );
  }
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
