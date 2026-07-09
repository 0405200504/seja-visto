import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STYLE_PROFILES, styleImages } from "@/lib/constants";

export function generateStaticParams() {
  return Object.keys(STYLE_PROFILES).map((styleSlug) => ({ styleSlug }));
}

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={src}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border"
          >
            <Image
              src={src}
              alt={`${style.label} — referência ${i + 1}`}
              fill
              priority={i < 4}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
