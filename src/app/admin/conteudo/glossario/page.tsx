import { requireAdmin } from "@/lib/auth";
import { getOverrides } from "@/lib/content-overrides";
import { MOST_WANTED } from "@/lib/constants";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";

export const dynamic = "force-dynamic";

export default async function GlossarioAdminPage() {
  await requireAdmin();
  const overrides = await getOverrides("glossario");

  const items: OverrideItem[] = MOST_WANTED.map((m) => {
    const ov = overrides.get(m.slug);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug: m.slug,
      hidden: ov?.hidden ?? false,
      overridden: !!ov && (Object.keys(ov.patch ?? {}).length > 0 || ov.hidden),
      values: {
        name: patch.name || m.name,
        knownAs: patch.knownAs || m.knownAs,
        description: patch.description || m.description,
      },
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Mais Procurados (glossário)</h1>
        <p className="mt-0.5 text-xs text-muted">
          {MOST_WANTED.length} peças do glossário visual. Edite nome, apelido e descrição, oculte ou
          reordene. A foto de cada peça fica em <code className="rounded bg-surface-2 px-1">public/mais-procurados/</code>.
        </p>
      </div>
      <OverridesManager
        kind="glossario"
        fields={[
          { name: "name", label: "Nome (em inglês)" },
          { name: "knownAs", label: "Conhecida como" },
          { name: "description", label: "Descrição", textarea: true },
        ]}
        items={items}
      />
    </div>
  );
}
