import { requireAdmin } from "@/lib/auth";
import { getOverrides } from "@/lib/content-overrides";
import { getSetting, GATEWAY_DEFAULTS, type GatewaySettings } from "@/lib/admin/settings";
import { STYLE_QUIZ } from "@/lib/constants";
import { AutosaveForm, AutosaveInput } from "@/components/admin/ui/autosave";
import { OverridesManager, type OverrideItem } from "@/components/admin/content/overrides-manager";
import { saveSettingFieldAction } from "@/app/actions/admin/system";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  await requireAdmin();
  const [gateway, quizOverrides] = await Promise.all([
    getSetting<GatewaySettings>("gateway", GATEWAY_DEFAULTS),
    getOverrides("quiz"),
  ]);

  const quizItems: OverrideItem[] = STYLE_QUIZ.map((q) => {
    const ov = quizOverrides.get(q.field);
    const patch = (ov?.patch ?? {}) as Record<string, string>;
    return {
      slug: q.field,
      hidden: false,
      overridden: !!ov && Object.keys(ov.patch ?? {}).length > 0,
      values: {
        title: patch.title || q.title,
        subtitle: patch.subtitle || q.subtitle,
      },
      info: `${q.options.length} opções`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Configurações</h1>
        <p className="mt-0.5 text-xs text-muted">Taxas do gateway e quiz de onboarding.</p>
      </div>

      <AutosaveForm action={saveSettingFieldAction.bind(null, "gateway")} className="space-y-3">
        <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Taxas do gateway (Cakto)</h2>
          <p className="text-[11px] leading-relaxed text-muted-2">
            Usadas para calcular a receita líquida quando a Cakto não informa a taxa exata da transação, e
            como sugestão nas vendas manuais.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <AutosaveInput
              name="fee_percent"
              label="Taxa percentual (%)"
              initial={String(gateway.fee_percent)}
              validate={(v) => (Number.isFinite(parseFloat(v.replace(",", "."))) ? null : "Número inválido.")}
            />
            <AutosaveInput
              name="fee_fixed_cents"
              label="Taxa fixa por venda (centavos)"
              initial={String(gateway.fee_fixed_cents)}
              validate={(v) => (Number.isFinite(parseFloat(v)) ? null : "Número inválido.")}
            />
          </div>
        </section>
      </AutosaveForm>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-foreground">Quiz de onboarding</h2>
        <p className="mb-3 text-xs text-muted">
          Edite o título e o subtítulo de cada pergunta — vale na hora para novos alunos. As opções de
          resposta e a pontuação de estilos ficam no código (mexer nelas muda o resultado do quiz).
        </p>
        <OverridesManager
          kind="quiz"
          canReorder={false}
          canHide={false}
          fields={[
            { name: "title", label: "Pergunta" },
            { name: "subtitle", label: "Subtítulo" },
          ]}
          items={quizItems}
        />
      </section>
    </div>
  );
}
