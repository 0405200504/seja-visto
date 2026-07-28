import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOverrides } from "@/lib/content-overrides";
import { ACTION_PLAN_DAYS } from "@/lib/constants";
import { num } from "@/lib/admin/format";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";

export const dynamic = "force-dynamic";

export default async function PlanoAdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [overrides, progressRes] = await Promise.all([
    getOverrides("plano"),
    db.from("action_plan_progress").select("day").eq("completed", true).limit(50000),
  ]);

  const doneByDay = new Map<number, number>();
  for (const p of progressRes.data ?? []) {
    doneByDay.set(p.day, (doneByDay.get(p.day) ?? 0) + 1);
  }

  const items: OverrideItem[] = ACTION_PLAN_DAYS.map((d) => {
    const slug = `dia-${d.day}`;
    const ov = overrides.get(slug);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug,
      hidden: false,
      overridden: !!ov && Object.keys(ov.patch ?? {}).length > 0,
      values: {
        title: patch.title || d.title,
        mission: patch.mission || d.mission,
        explanation: patch.explanation || d.explanation,
      },
      info: `${num(doneByDay.get(d.day) ?? 0)} alunos concluíram`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Plano de Ação (7 dias)</h1>
        <p className="mt-0.5 text-xs text-muted">
          Edite o título, a missão e a explicação de cada dia — a sequência de 7 dias é fixa, e o
          checklist detalhado vive no código do produto.
        </p>
      </div>
      <OverridesManager
        kind="plano"
        canReorder={false}
        canHide={false}
        fields={[
          { name: "title", label: "Título do dia" },
          { name: "mission", label: "Missão", textarea: true },
          { name: "explanation", label: "Explicação", textarea: true },
        ]}
        items={items}
      />
    </div>
  );
}
