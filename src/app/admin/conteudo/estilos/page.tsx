import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOverrides } from "@/lib/content-overrides";
import { STYLE_PROFILES } from "@/lib/constants";
import { num } from "@/lib/admin/format";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";

export const dynamic = "force-dynamic";

export default async function EstilosAdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [overrides, profilesRes, looksRes] = await Promise.all([
    getOverrides("estilo"),
    db.from("users_profile").select("preferred_style").eq("is_admin", false),
    db.from("looks").select("style").is("deleted_at", null),
  ]);

  const studentsByStyle = new Map<string, number>();
  for (const p of profilesRes.data ?? []) {
    if (p.preferred_style) studentsByStyle.set(p.preferred_style, (studentsByStyle.get(p.preferred_style) ?? 0) + 1);
  }
  const looksByStyle = new Map<string, number>();
  for (const l of looksRes.data ?? []) {
    looksByStyle.set(l.style, (looksByStyle.get(l.style) ?? 0) + 1);
  }

  const items: OverrideItem[] = Object.values(STYLE_PROFILES).map((s) => {
    const ov = overrides.get(s.slug);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug: s.slug,
      hidden: ov?.hidden ?? false,
      overridden: !!ov && (Object.keys(ov.patch ?? {}).length > 0 || ov.hidden),
      values: {
        label: patch.label || s.label,
        tagline: patch.tagline || s.tagline,
        description: patch.description || s.description,
      },
      info: `${s.imageCount} fotos · ${num(studentsByStyle.get(s.slug) ?? 0)} alunos · ${num(looksByStyle.get(s.slug) ?? 0)} looks`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Estilos</h1>
        <p className="mt-0.5 text-xs text-muted">
          Os 12 universos de estilo, com quantos alunos escolheram cada um e quantos looks existem por estilo.
          Edite nome, tagline e descrição. As fotos de referência ficam no repositório
          (pasta <code className="rounded bg-surface-2 px-1">public/estilos/</code>) — me peça quando quiser trocá-las.
        </p>
      </div>
      <OverridesManager
        kind="estilo"
        fields={[
          { name: "label", label: "Nome do estilo" },
          { name: "tagline", label: "Tagline" },
          { name: "description", label: "Descrição", textarea: true },
        ]}
        items={items}
      />
    </div>
  );
}
