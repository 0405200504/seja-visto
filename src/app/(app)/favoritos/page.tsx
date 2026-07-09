import Link from "next/link";
import type { Metadata } from "next";
import { Heart, ShoppingBag } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { LookCard } from "@/components/app/look-card";
import { WardrobeItemCard } from "@/components/app/wardrobe-item-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { Look, WardrobeItem } from "@/lib/types";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const { supabase, user } = await requireProfile();

  const [{ data: marks }, { data: wanted }] = await Promise.all([
    supabase
      .from("user_favorites")
      .select("kind, looks(*)")
      .eq("user_id", user.id),
    supabase
      .from("user_wardrobe")
      .select("wardrobe_items(*)")
      .eq("user_id", user.id)
      .eq("status", "quero_comprar"),
  ]);

  const favoriteLooks = (marks ?? [])
    .filter((m) => m.kind === "favorite" && m.looks)
    .map((m) => m.looks as unknown as Look);
  const planLooks = (marks ?? [])
    .filter((m) => m.kind === "plan" && m.looks)
    .map((m) => m.looks as unknown as Look);
  const wantedItems = (wanted ?? [])
    .map((w) => w.wardrobe_items as unknown as WardrobeItem)
    .filter(Boolean);

  const favoriteIds = new Set(favoriteLooks.map((l) => l.id));
  const isEmpty =
    favoriteLooks.length === 0 && planLooks.length === 0 && wantedItems.length === 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Sua curadoria"
        title="Favoritos"
        description="Looks salvos, combinações que você quer testar e peças que está de olho."
      />

      {isEmpty ? (
        <EmptyState
          icon={Heart}
          title="Nada salvo por aqui ainda"
          description="Explore as combinações e favorite os looks que mais combinam com você."
          action={
            <Link href="/combinacoes">
              <Button>Explorar combinações</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-12">
          {favoriteLooks.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold sm:text-xl">Looks favoritados</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteLooks.map((look) => (
                  <LookCard key={look.id} look={look} isFavorite />
                ))}
              </div>
            </section>
          )}

          {planLooks.length > 0 && (
            <section>
              <h2 className="mb-1 text-lg font-semibold sm:text-xl">
                Combinações que você quer testar
              </h2>
              <p className="mb-4 text-sm text-muted">
                Looks que você adicionou ao seu plano.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {planLooks.map((look) => (
                  <LookCard key={look.id} look={look} isFavorite={favoriteIds.has(look.id)} />
                ))}
              </div>
            </section>
          )}

          {wantedItems.length > 0 && (
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold sm:text-xl">
                <ShoppingBag className="size-5 text-accent" />
                Peças que você quer comprar
              </h2>
              <p className="mb-4 text-sm text-muted">
                Sua lista de compras inteligente, em ordem de prioridade.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {wantedItems.map((item) => (
                  <WardrobeItemCard key={item.id} item={item} status="quero_comprar" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
