import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOverrides } from "@/lib/content-overrides";
import { BONUSES } from "@/lib/bonuses";
import { num } from "@/lib/admin/format";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";

export const dynamic = "force-dynamic";

export default async function BonusAdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [overrides, entRes] = await Promise.all([
    getOverrides("bonus"),
    db.from("user_entitlements").select("entitlement").limit(50000),
  ]);

  const holders = new Map<string, number>();
  for (const e of entRes.data ?? []) {
    holders.set(e.entitlement, (holders.get(e.entitlement) ?? 0) + 1);
  }

  const items: OverrideItem[] = BONUSES.map((b) => {
    const ov = overrides.get(b.key);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug: b.key,
      hidden: ov?.hidden ?? false,
      overridden: !!ov && (Object.keys(ov.patch ?? {}).length > 0 || ov.hidden),
      values: {
        title: patch.title || b.title,
        short: patch.short || b.short,
      },
      info: `${num(holders.get(b.key) ?? 0)} alunos têm · ${b.type === "content" ? `${b.sections?.length ?? 0} seções` : b.type}`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Bônus</h1>
        <p className="mt-0.5 text-xs text-muted">
          Os {BONUSES.length} bônus do produto, com quantos alunos têm cada um. Edite título e resumo,
          oculte ou reordene os cards. Preço e checkout de cada bônus ficam na Cakto
          (veja Produtos & Ofertas); o conteúdo interno vive no código.
        </p>
      </div>
      <OverridesManager
        kind="bonus"
        fields={[
          { name: "title", label: "Título" },
          { name: "short", label: "Resumo (card)", textarea: true },
        ]}
        items={items}
      />
    </div>
  );
}
