import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ReactionButtons } from "@/components/app/reaction-buttons";
import { fitImageUrl, type FitSocial } from "@/lib/community";
import type { CommunityFit } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; variant: "accent" | "outline" }> = {
  pending: { label: "Em análise", variant: "accent" },
  rejected: { label: "Não aprovado", variant: "outline" },
};

export function FitCard({ fit, social }: { fit: CommunityFit; social: FitSocial }) {
  const statusBadge = STATUS_BADGE[fit.status];

  return (
    <Link
      href={`/combinacoes/comunidade/${fit.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-glow"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={fitImageUrl(fit.image_path)}
          alt={fit.caption ?? `Fit de ${fit.author_name ?? "aluno"}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {statusBadge && (
          <div className="absolute left-3 top-3">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="truncate font-display text-[15px] font-semibold leading-snug">
          {fit.author_name ?? "Aluno da comunidade"}
        </h3>
        {fit.caption && <p className="line-clamp-2 text-xs text-muted">{fit.caption}</p>}
        <ReactionButtons
          target={{ fitId: fit.id }}
          likes={social.likes}
          liked={social.liked}
          saves={social.saves}
          saved={social.saved}
          comments={social.comments}
          className="mt-auto pt-2"
        />
      </div>
    </Link>
  );
}
