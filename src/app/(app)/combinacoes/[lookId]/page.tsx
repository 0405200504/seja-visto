import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb, Repeat, Shirt } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { LookImage } from "@/components/app/look-image";
import { LookActions } from "@/components/app/look-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS, COLOR_SWATCHES } from "@/lib/constants";
import type { FavoriteKind } from "@/app/actions/user";
import type { Look } from "@/lib/types";

export default async function LookDetailPage({
  params,
}: {
  params: Promise<{ lookId: string }>;
}) {
  const { lookId } = await params;
  const { supabase, user } = await requireProfile();

  const [{ data: look }, { data: marks }] = await Promise.all([
    supabase.from("looks").select("*").eq("id", lookId).single<Look>(),
    supabase
      .from("user_favorites")
      .select("kind")
      .eq("user_id", user.id)
      .eq("look_id", lookId),
  ]);

  if (!look) notFound();

  const kinds = new Set((marks ?? []).map((m) => m.kind));
  const states: Record<FavoriteKind, boolean> = {
    favorite: kinds.has("favorite"),
    have_pieces: kinds.has("have_pieces"),
    plan: kinds.has("plan"),
  };

  return (
    <div className="animate-fade-up">
      <Link
        href="/combinacoes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para combinações
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
        {/* Imagem */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-card lg:sticky lg:top-10 lg:self-start">
          <div className="relative aspect-[4/5]">
            <LookImage
              imageUrl={look.image_url}
              title={look.title}
              baseColor={look.base_color}
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="accent">{OCCASIONS[look.occasion] ?? look.occasion}</Badge>
              <Badge>{STYLES[look.style] ?? look.style}</Badge>
              <Badge>{CLIMATES[look.climate] ?? look.climate}</Badge>
              <Badge variant="outline">Nível: {LEVELS[look.level] ?? look.level}</Badge>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{look.title}</h1>
            {look.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {look.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <span>Cor principal:</span>
              <span
                className="size-3.5 rounded-full ring-1 ring-white/20"
                style={{ background: COLOR_SWATCHES[look.base_color] }}
              />
              <span className="text-foreground">{BASE_COLORS[look.base_color] ?? look.base_color}</span>
            </div>
          </div>

          <LookActions lookId={look.id} states={states} />

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Shirt className="size-4" />
                </span>
                Peças usadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5 text-sm text-muted sm:text-[15px]">
                {look.pieces.map((piece, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                    {piece}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {look.why_it_works && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Lightbulb className="size-4" />
                  </span>
                  Por que funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
                  {look.why_it_works}
                </p>
              </CardContent>
            </Card>
          )}

          {look.adaptations.length > 0 && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Repeat className="size-4" />
                  </span>
                  Como adaptar · trocas possíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2.5 text-sm text-muted sm:text-[15px]">
                  {look.adaptations.map((swap, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                      {swap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
