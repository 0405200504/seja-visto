import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPeriod } from "@/lib/admin/period-server";
import { getSetting, FIT_CHECK_DEFAULTS, type FitCheckSettings } from "@/lib/admin/settings";
import { brl, num } from "@/lib/admin/format";
import { AutosaveForm, AutosaveInput, AutosaveTextarea } from "@/components/admin/ui/autosave";
import { saveSettingFieldAction } from "@/app/actions/admin/system";

export const dynamic = "force-dynamic";

export default async function FitCheckAdminPage() {
  await requireAdmin();
  const db = createAdminClient();
  const period = await getPeriod();

  const [settings, logsRes, creditsRes] = await Promise.all([
    getSetting<FitCheckSettings>("fit_check", FIT_CHECK_DEFAULTS),
    db.from("fit_check_logs")
      .select("total_tokens, kind, created_at")
      .gte("created_at", period.from.toISOString())
      .lt("created_at", period.to.toISOString())
      .limit(50000),
    db.from("fit_check_credits").select("balance").limit(20000),
  ]);

  const logs = logsRes.data ?? [];
  const tokens = logs.reduce((a, l) => a + (l.total_tokens ?? 0), 0);
  const custo = Math.round((tokens / 1000) * settings.token_price_per_1k_cents);
  const saldoTotal = (creditsRes.data ?? []).reduce((a, c) => a + c.balance, 0);
  const zerados = (creditsRes.data ?? []).filter((c) => c.balance === 0).length;

  const saveField = saveSettingFieldAction.bind(null, "fit_check");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Fit Check (IA)</h1>
        <p className="mt-0.5 text-xs text-muted">
          Modelo, limites, política de tokens e prompt — tudo editável aqui, sem deploy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: `Usos (${period.label.toLowerCase()})`, value: num(logs.length) },
          { label: "Tokens no período", value: num(tokens) },
          { label: "Custo estimado", value: brl(custo) },
          { label: "Alunos sem saldo", value: `${num(zerados)} (${num(saldoTotal)} tokens em circulação)` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">{kpi.label}</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <AutosaveForm action={saveField} className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Modelo e limites</h2>
          <div className="grid grid-cols-2 gap-3">
            <AutosaveInput name="model" label="Modelo (OpenAI)" initial={settings.model} hint="Ex: gpt-5.5, gpt-4o-mini" />
            <AutosaveInput
              name="max_output_tokens"
              label="Máx. tokens de resposta"
              initial={String(settings.max_output_tokens)}
              validate={(v) => (parseInt(v, 10) > 0 ? null : "Precisa ser um número maior que zero.")}
            />
            <AutosaveInput
              name="free_credits"
              label="Tokens grátis por conta nova"
              initial={String(settings.free_credits)}
              validate={(v) => (parseInt(v, 10) >= 0 ? null : "Número inválido.")}
            />
            <AutosaveInput
              name="daily_text_limit"
              label="Limite diário de mensagens de texto"
              initial={String(settings.daily_text_limit)}
              validate={(v) => (parseInt(v, 10) > 0 ? null : "Número inválido.")}
            />
            <AutosaveInput
              name="monthly_budget_reais"
              label="Teto de gasto do mês (R$)"
              initial={String(settings.monthly_budget_reais)}
              hint="Ao estourar, o Fit Check para de atender e você é avisado. 0 desliga a trava."
              validate={(v) => (Number.isFinite(parseFloat(v)) ? null : "Número inválido.")}
            />
            <AutosaveInput
              name="token_price_per_1k_cents"
              label="Custo por 1.000 tokens (centavos de R$)"
              initial={String(settings.token_price_per_1k_cents)}
              hint="Usado só para o KPI de custo de IA."
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">Prompt do consultor</h2>
          <AutosaveTextarea
            name="prompt_extra"
            label="Instruções extras (anexadas ao prompt padrão)"
            initial={settings.prompt_extra}
            rows={4}
            placeholder="Ex: Sempre sugira looks da plataforma antes de sugerir compras novas."
          />
          <AutosaveTextarea
            name="system_prompt_override"
            label="Substituir o prompt inteiro (avançado — deixe vazio para usar o padrão)"
            initial={settings.system_prompt_override}
            rows={6}
            placeholder="Se preencher, este texto SUBSTITUI todo o prompt do sistema, incluindo tom de voz e regras."
          />
          <p className="text-[11px] leading-relaxed text-muted-2">
            O prompt padrão já inclui o resumo dos looks, módulos e guias da plataforma, e o tom de voz do
            Fit Check. Prefira “instruções extras”; use a substituição total só se souber o que está fazendo.
          </p>
        </section>
      </AutosaveForm>
    </div>
  );
}
