import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Clock, Tag, Wand2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = { title: "Guias" };

export default async function GuiasPage() {
  await requireProfile();

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Manual completo"
        title="Guias de estilo"
        description="Doze guias práticos e diretos — de medidas a marcas, de cores a cuidados. Tudo o que separa quem se veste de quem se veste bem."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guias/${guide.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <guide.icon className="size-5" />
              </span>
              {guide.interactive && (
                <Badge variant="accent">
                  <Wand2 className="size-3" />
                  Interativo
                </Badge>
              )}
            </div>
            <h3 className="font-display text-base font-semibold leading-snug">
              {guide.title}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{guide.short}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-3.5" />
                {guide.minutes} min de leitura
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-80 transition-opacity group-hover:opacity-100">
                Abrir guia
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </Link>
        ))}

        {/* Glossário visual — aba já existente */}
        <Link
          href="/mais-procurados"
          className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Tag className="size-5" />
            </span>
            <Badge variant="accent">Com fotos</Badge>
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">
            Aprenda os nomes das peças que você mais deseja
          </h3>
          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
            Boxy tee, baggy, jorts, bomber… o glossário visual com foto de cada peça para você
            saber exatamente o que pedir e pesquisar.
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Clock className="size-3.5" />
              13 peças ilustradas
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-80 transition-opacity group-hover:opacity-100">
              Abrir glossário
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
