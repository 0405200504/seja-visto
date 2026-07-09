import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/app/favorite-button";
import { LookImage } from "@/components/app/look-image";
import { OCCASIONS, LEVELS, STYLES } from "@/lib/constants";
import type { Look } from "@/lib/types";

export function LookCard({ look, isFavorite }: { look: Look; isFavorite: boolean }) {
  return (
    <Link
      href={`/combinacoes/${look.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <LookImage
          imageUrl={look.image_url}
          title={look.title}
          baseColor={look.base_color}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute right-3 top-3">
          <FavoriteButton lookId={look.id} isFavorite={isFavorite} />
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="accent">{OCCASIONS[look.occasion] ?? look.occasion}</Badge>
          <Badge>{LEVELS[look.level] ?? look.level}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-[15px] font-semibold leading-snug">
          {look.title}
        </h3>
        <p className="text-xs text-muted">{STYLES[look.style] ?? look.style}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-accent opacity-80 transition-opacity group-hover:opacity-100">
          Ver detalhes
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
