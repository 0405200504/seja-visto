/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { STYLE_PROFILES } from "@/lib/constants";

export const metadata: Metadata = { title: "Estilos" };

export default async function EstilosPage() {
  const { profile } = await requireProfile();
  const userStyle = profile.preferred_style;

  const ordered = Object.values(STYLE_PROFILES).sort((a, b) =>
    a.slug === userStyle ? -1 : b.slug === userStyle ? 1 : 0
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Referências"
        title="Os 9 estilos"
        description="Explore cada universo de estilo com referências visuais. O seu resultado do quiz é só o ponto de partida — todos estão liberados."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((style) => {
          const isYours = style.slug === userStyle;
          return (
            <Link
              key={style.slug}
              href={`/estilos/${style.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={`/estilos/${style.slug}/01.jpg`}
                  alt={style.label}
                  loading="lazy"
                  className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {isYours && (
                  <Badge variant="accent" className="absolute left-3 top-3 backdrop-blur-md">
                    <Sparkles className="size-3" />
                    Seu estilo
                  </Badge>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-display text-xl font-bold text-white">{style.label}</h3>
                  <p className="text-xs text-white/70">{style.tagline}</p>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 p-4">
                <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                  {style.description}
                </p>
                <ArrowUpRight className="size-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
