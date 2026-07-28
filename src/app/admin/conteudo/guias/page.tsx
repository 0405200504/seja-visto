import { requireAdmin } from "@/lib/auth";
import { getOverrides } from "@/lib/content-overrides";
import { GUIDES } from "@/lib/guides";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";

export const dynamic = "force-dynamic";

export default async function GuiasAdminPage() {
  await requireAdmin();
  const overrides = await getOverrides("guia");

  const items: OverrideItem[] = GUIDES.map((g) => {
    const ov = overrides.get(g.slug);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug: g.slug,
      hidden: ov?.hidden ?? false,
      overridden: !!ov && (Object.keys(ov.patch ?? {}).length > 0 || ov.hidden),
      values: {
        title: patch.title || g.title,
        short: patch.short || g.short,
        minutes: patch.minutes || String(g.minutes),
      },
      info: `${g.sections.length} seções${g.interactive ? " · interativo" : ""}`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Guias</h1>
        <p className="mt-0.5 text-xs text-muted">
          {GUIDES.length} guias do app. Edite título, resumo e tempo de leitura, oculte ou reordene — vale
          na hora para os alunos, sem deploy. O corpo completo dos guias vive no código do produto.
        </p>
      </div>
      <OverridesManager
        kind="guia"
        fields={[
          { name: "title", label: "Título" },
          { name: "short", label: "Resumo (aparece no card)", textarea: true },
          { name: "minutes", label: "Minutos de leitura" },
        ]}
        items={items}
      />
    </div>
  );
}
