import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { WardrobeItemCard } from "@/components/app/wardrobe-item-card";
import { Progress } from "@/components/ui/progress";
import { WARDROBE_CATEGORIES } from "@/lib/constants";
import type { UserWardrobe, WardrobeItem } from "@/lib/types";

export const metadata: Metadata = { title: "Guarda-Roupa" };

export default async function GuardaRoupaPage() {
  const { supabase, user } = await requireProfile();

  const [{ data: items }, { data: userItems }] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select("*")
      .order("priority")
      .order("name")
      .returns<WardrobeItem[]>(),
    supabase
      .from("user_wardrobe")
      .select("wardrobe_item_id, status")
      .eq("user_id", user.id)
      .returns<Pick<UserWardrobe, "wardrobe_item_id" | "status">[]>(),
  ]);

  const statusByItem = new Map(
    (userItems ?? []).map((u) => [u.wardrobe_item_id, u.status])
  );

  const essentials = (items ?? []).filter((i) => i.priority === "essencial");
  const ownedEssentials = essentials.filter((i) => statusByItem.get(i.id) === "tenho");
  const essentialsPct = essentials.length
    ? Math.round((ownedEssentials.length / essentials.length) * 100)
    : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Base sólida"
        title="Guarda-roupa essencial"
        description="As peças que sustentam qualquer combinação. Marque o que você já tem e o que quer comprar."
      />

      <div className="mb-10 max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Peças essenciais no seu guarda-roupa</span>
          <span className="font-display font-semibold text-accent">{essentialsPct}%</span>
        </div>
        <Progress value={essentialsPct} />
        <p className="mt-2 text-xs text-muted-2">
          {ownedEssentials.length} de {essentials.length} peças essenciais marcadas como “já tenho”
        </p>
      </div>

      <div className="space-y-10">
        {Object.entries(WARDROBE_CATEGORIES).map(([key, label]) => {
          const categoryItems = (items ?? []).filter((i) => i.category === key);
          if (categoryItems.length === 0) return null;

          return (
            <section key={key}>
              <h2 className="mb-4 text-lg font-semibold sm:text-xl">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <WardrobeItemCard
                    key={item.id}
                    item={item}
                    status={statusByItem.get(item.id) ?? null}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
