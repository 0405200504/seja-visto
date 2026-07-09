/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STYLE_PROFILES, styleImages } from "@/lib/constants";

export default async function EstiloDetailPage({
  params,
}: {
  params: Promise<{ styleSlug: string }>;
}) {
  const { styleSlug } = await params;
  const style = STYLE_PROFILES[styleSlug];
  if (!style) notFound();

  const { profile } = await requireProfile();
  const isYours = profile.preferred_style === style.slug;
  const images = styleImages(style.slug);

  return (
    <div className="animate-fade-up">
      <Link
        href="/estilos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os estilos
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {isYours && (
            <Badge variant="accent" className="mb-3">
              <Sparkles className="size-3" />
              O estilo que mais combina com você
            </Badge>
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">{style.label}</h1>
          <p className="mt-1 text-sm font-medium text-accent">{style.tagline}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {style.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {style.keyPieces.map((piece) => (
              <Badge key={piece}>{piece}</Badge>
            ))}
          </div>
        </div>
        <Link href={`/combinacoes?estilo=${style.slug}`}>
          <Button variant="secondary">
            <Layers className="size-4" />
            Ver looks deste estilo
          </Button>
        </Link>
      </div>

      {/* Galeria estilo lookbook */}
      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 [&>img]:mb-3 sm:[&>img]:mb-4">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${style.label} — referência ${i + 1}`}
            loading={i < 4 ? "eager" : "lazy"}
            className="w-full break-inside-avoid rounded-2xl border border-border object-cover transition-transform duration-300 hover:scale-[1.01]"
          />
        ))}
      </div>
    </div>
  );
}
