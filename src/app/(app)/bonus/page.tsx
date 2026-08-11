import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BadgeCheck, Gift, Lock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { BONUSES } from "@/lib/bonuses";
import { applyOverrides, getOverrides } from "@/lib/content-overrides";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bônus" };

export default async function BonusPage() {
  const { supabase, user } = await requireProfile();

  // Em paralelo: os overrides não dependem dos entitlements do aluno.
  const [{ data: rows }, overrides] = await Promise.all([
    supabase.from("user_entitlements").select("entitlement").eq("user_id", user.id),
    getOverrides("bonus"),
  ]);

  const owned = new Set((rows ?? []).map((r) => r.entitlement));
  const bonuses = applyOverrides(BONUSES, overrides, (b) => b.key);
  const unlockedCount = bonuses.filter((b) => owned.has(b.key)).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Conteúdo exclusivo"
        title="Seus bônus"
        description={
          unlockedCount > 0
            ? `Você desbloqueou ${unlockedCount} de ${bonuses.length} bônus. Clique nos itens bloqueados para desbloquear na hora.`
            : "Bônus exclusivos liberados conforme a sua compra. Clique em qualquer item com cadeado para desbloquear na hora."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bonuses.map((bonus) => {
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
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-3">
                  {unlocked ? (
                    <Badge variant="success">
                      <BadgeCheck className="size-3" />
                      Liberado
                    </Badge>
                  ) : (
                    <Badge>
                      <Lock className="size-3" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
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
