import { requireAdmin } from "@/lib/auth";
import { getOverrides } from "@/lib/content-overrides";
import {
  getSetting,
  GATEWAY_DEFAULTS,
  CAKTO_FEES,
  TAXA_3DS_PERCENT,
  type GatewaySettings,
} from "@/lib/admin/settings";
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
            Quando a Cakto informa a taxa exata da transação, é ela que vale. Sem essa informação, o
            sistema estima pela tabela do seu plano, abaixo.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-[10px] uppercase tracking-wider text-muted-2">
                  <th className="px-3 py-2 font-semibold">Método</th>
                  <th className="px-3 py-2 font-semibold">Taxa</th>
                  <th className="px-3 py-2 font-semibold">Numa venda de R$ 17</th>
                  <th className="px-3 py-2 font-semibold">Cai em</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CAKTO_FEES).map(([chave, t]) => {
                  const taxa17 = Math.round((1700 * t.percent) / 100) + t.fixed_cents;
                  return (
                    <tr key={chave} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-foreground">{t.label}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">
                        {t.percent.toFixed(2).replace(".", ",")}% + R$ {(t.fixed_cents / 100).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted">
                        fica R$ {((1700 - taxa17) / 100).toFixed(2).replace(".", ",")}{" "}
                        <span className="text-muted-2">({((taxa17 / 1700) * 100).toFixed(0)}% de taxa)</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-2">{t.days}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-2">
            A autenticação 3DS, quando ativa, soma {TAXA_3DS_PERCENT.toFixed(2).replace(".", ",")}% em cima
            do cartão. A tabela vive no código — se você mudar de plano na Cakto, me avise para atualizar.
          </p>

          <h3 className="pt-1 text-xs font-semibold text-foreground">
            Reserva para método desconhecido
          </h3>
          <p className="text-[11px] leading-relaxed text-muted-2">
            Só entra em ação se a Cakto mandar um método que não está na tabela acima.
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
