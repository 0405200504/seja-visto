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
                "relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-card transition-all duration-300",
                unlocked
                  ? "border-border bg-surface hover:border-border-strong hover:shadow-glow"
                  : buyHref
                    ? "border-border bg-surface hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow"
                    : "border-dashed border-border bg-surface/40"
              )}
            >
              {/* Brilho decorativo no topo */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent to-transparent transition-opacity duration-300",
                  unlocked ? "via-success/40" : "via-accent/40",
                  buyHref ? "opacity-0 group-hover:opacity-100" : unlocked ? "opacity-100" : "opacity-0"
                )}
              />

              <div className="mb-5 flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl ring-1 transition-colors duration-300",
                    unlocked
                      ? "bg-accent-soft text-accent ring-accent/20"
                      : buyHref
                        ? "bg-surface-2 text-muted ring-border group-hover:bg-accent-soft group-hover:text-accent group-hover:ring-accent/30"
                        : "bg-surface-2 text-muted-2 ring-border"
                  )}
                >
                  <bonus.icon className="size-5.5" />
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
                  "font-display text-lg font-semibold leading-snug",
                  unlocked ? "text-foreground" : "text-foreground/90"
                )}
              >
                {bonus.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {bonus.short}
              </p>

              <div className="mt-6">
                {unlocked ? (
                  isBadge ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                      <BadgeCheck className="size-4" />
                      Ativo na sua conta — para sempre
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      Acessar bônus
                      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  )
                ) : buyHref ? (
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-[0_4px_20px_-6px_rgb(47_107_255/0.5)] transition-colors duration-200 group-hover:bg-accent-hover">
                    Desbloquear agora
                    <ArrowUpRight className="size-4" />
                  </span>
                ) : (
                  <span className="block rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-center text-xs font-medium text-muted-2">
                    Liberado automaticamente na compra
                  </span>
                )}
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
