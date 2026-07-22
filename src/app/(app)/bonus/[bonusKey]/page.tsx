import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/app/guide-sections";
import { ColorWheel } from "@/components/app/color-wheel";
import { getBonus } from "@/lib/bonuses";

export default async function BonusDetailPage({
  params,
}: {
  params: Promise<{ bonusKey: string }>;
}) {
  const { bonusKey } = await params;
  const bonus = getBonus(bonusKey);
  if (!bonus || bonus.type === "badge") notFound();

  const { supabase, user } = await requireProfile();

  const { data: entitlement } = await supabase
    .from("user_entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("entitlement", bonus.key)
    .maybeSingle();

  /* ---------- Bloqueado ---------- */
  if (!entitlement) {
    return (
      <div className="animate-fade-up mx-auto max-w-xl">
        <Link
          href="/bonus"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Todos os bônus
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-surface-3 text-muted">
            <Lock className="size-6" />
          </div>
          <h1 className="text-xl font-bold sm:text-2xl">{bonus.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Este bônus ainda não faz parte do seu acesso. Ele é liberado automaticamente
            quando você adquire o bônus correspondente na compra.
          </p>
          <Link href="/bonus" className="mt-6 inline-block">
            <Button variant="secondary">Ver meus bônus</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Grupo WhatsApp ---------- */
  if (bonus.type === "link") {
    const whatsappUrl = process.env.WHATSAPP_GROUP_URL;
    return (
      <div className="animate-fade-up mx-auto max-w-xl">
        <Link
          href="/bonus"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Todos os bônus
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <MessageCircle className="size-6" />
          </div>
          <h1 className="text-xl font-bold sm:text-2xl">{bonus.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Entre na comunidade fechada: tire dúvidas, receba avaliações dos seus looks e
            conteúdos exclusivos direto no seu WhatsApp.
          </p>
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block">
              <Button size="lg" className="bg-[#25D366] hover:bg-[#1fb958]">
                <MessageCircle className="size-4" />
                Entrar no grupo
              </Button>
            </a>
          ) : (
            <p className="mt-6 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
              O link do grupo será disponibilizado aqui em breve.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---------- Conteúdo ---------- */
  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <Link
        href="/bonus"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os bônus
      </Link>

      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <bonus.icon className="size-6" />
          </span>
          <Badge variant="accent">Bônus exclusivo</Badge>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{bonus.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{bonus.short}</p>
      </div>

      <div className="space-y-10">
        {(bonus.sections ?? []).map((section, i) => (
          <div key={i} className="space-y-10">
            <Section section={section} />
            {bonus.interactive?.kind === "roda-cromatica" && bonus.interactive.after === i && (
              <ColorWheel />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
