import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight, BadgeCheck, Gift, Lock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { BONUSES } from "@/lib/bonuses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bônus" };

export default async function BonusPage() {
  const { supabase, user } = await requireProfile();

  const { data: rows } = await supabase
    .from("user_entitlements")
    .select("entitlement")
    .eq("user_id", user.id);

  const owned = new Set((rows ?? []).map((r) => r.entitlement));
  const unlockedCount = BONUSES.filter((b) => owned.has(b.key)).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Conteúdo exclusivo"
        title="Seus bônus"
        description={
          unlockedCount > 0
            ? `Você desbloqueou ${unlockedCount} de ${BONUSES.length} bônus. Clique nos itens bloqueados para desbloquear na hora.`
            : "Bônus exclusivos liberados conforme a sua compra. Clique em qualquer item com cadeado para desbloquear na hora."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BONUSES.map((bonus) => {
          const unlocked = owned.has(bonus.key);
          const isBadge = bonus.type === "badge";
          const internalHref = unlocked && !isBadge ? `/bonus/${bonus.key}` : undefined;
          const buyHref = !unlocked && bonus.checkoutUrl ? bonus.checkoutUrl : undefined;

          const card = (
            <div
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-2xl border shadow-card transition-all duration-300",
                unlocked
                  ? "border-border bg-surface hover:border-border-strong hover:shadow-glow"
                  : buyHref
                    ? "border-border bg-surface/50 hover:border-border-strong hover:bg-surface hover:shadow-glow"
                    : "border-border bg-surface/50"
              )}
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-surface-3">
                <Image
                  src={`/bonus/${bonus.key}.jpg`}
                  alt={bonus.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={cn(
                    "object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                    !unlocked && "opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                  )}
                />
                <div className="absolute right-3 top-3">
                  {unlocked ? (
                    <Badge variant="success" className="backdrop-blur-md">
                      <BadgeCheck className="size-3" />
                      Liberado
                    </Badge>
                  ) : (
                    <Badge className="backdrop-blur-md">
                      <Lock className="size-3" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3
                  className={cn(
                    "font-display text-base font-semibold leading-snug",
                    !unlocked && "text-muted"
                  )}
                >
                  {bonus.title}
                </h3>
                <p className={cn("mt-1.5 flex-1 text-sm leading-relaxed", unlocked ? "text-muted" : "text-muted-2")}>
                  {bonus.short}
                </p>
                <div className="mt-4 border-t border-border pt-3.5">
                {unlocked ? (
                  isBadge ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <BadgeCheck className="size-3.5" />
                      Ativo na sua conta — para sempre
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      Acessar bônus
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  )
                ) : buyHref ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    Desbloquear agora
                    <ArrowUpRight className="size-3.5" />
                  </span>
                ) : (
                  <span className="text-xs text-muted-2">
                    Liberado automaticamente na compra deste bônus
                  </span>
                )}
                </div>
              </div>
            </div>
          );

          if (internalHref) {
            return (
              <Link key={bonus.key} href={internalHref} className="group">
                {card}
              </Link>
            );
          }
          if (buyHref) {
            return (
              <a
                key={bonus.key}
                href={buyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {card}
              </a>
            );
          }
          return <div key={bonus.key}>{card}</div>;
        })}
      </div>

      {unlockedCount === 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
          <Gift className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            Comprou algum bônus e ele ainda aparece bloqueado? A liberação é automática em até
            alguns minutos após a confirmação do pagamento. Se demorar, fale com o suporte
            informando o e-mail da compra.
          </p>
        </div>
      )}
    </div>
  );
}
