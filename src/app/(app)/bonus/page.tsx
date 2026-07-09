import Link from "next/link";
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
            ? `Você desbloqueou ${unlockedCount} de ${BONUSES.length} bônus. Os demais são liberados na compra.`
            : "Bônus exclusivos liberados conforme a sua compra. Os itens com cadeado ainda não fazem parte do seu acesso."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BONUSES.map((bonus) => {
          const unlocked = owned.has(bonus.key);
          const isBadge = bonus.type === "badge";
          const href = unlocked && !isBadge ? `/bonus/${bonus.key}` : undefined;

          const card = (
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border p-5 shadow-card transition-all duration-300 sm:p-6",
                unlocked
                  ? "border-border bg-surface hover:border-border-strong hover:shadow-glow"
                  : "border-border bg-surface/50"
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    unlocked ? "bg-accent-soft text-accent" : "bg-surface-3 text-muted-2"
                  )}
                >
                  <bonus.icon className="size-5" />
                </span>
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
                ) : (
                  <span className="text-xs text-muted-2">
                    Liberado automaticamente na compra deste bônus
                  </span>
                )}
              </div>
            </div>
          );

          return href ? (
            <Link key={bonus.key} href={href} className="group">
              {card}
            </Link>
          ) : (
            <div key={bonus.key}>{card}</div>
          );
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
