import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { STYLE_GOALS, STYLES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { AiStatsCard } from "@/components/admin/ai-stats-card";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  // Executa todas as consultas agregadas e de amostragem em paralelo
  const [
    { count: users },
    { count: onboardingCompletedCount },
    { count: looks },
    { count: modules },
    { count: lessons },
    { count: items },
    { data: salesRows },
    { data: profiles },
    { data: progressRows },
    { count: totalLessons },
    { data: aiLogs },
    { data: aiMessages }
  ] = await Promise.all([
    supabase.from("users_profile").select("*", { count: "exact", head: true }),
    supabase.from("users_profile").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
    supabase.from("looks").select("*", { count: "exact", head: true }),
    supabase.from("modules").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("wardrobe_items").select("*", { count: "exact", head: true }),
    supabase.from("sales").select("amount_cents, status"),
    supabase
      .from("users_profile")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<Profile[]>(),
    supabase.from("user_progress").select("user_id").eq("completed", true),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("fit_check_logs").select("prompt_tokens, completion_tokens, total_tokens, kind"),
    supabase.from("fit_check_messages").select("role, content, thumb")
  ]);

  // Agrupa progresso
  const doneByUser = new Map<string, number>();
  for (const row of progressRows ?? []) {
    doneByUser.set(row.user_id, (doneByUser.get(row.user_id) ?? 0) + 1);
  }

  // Métricas financeiras e de conversão
  const approvedSales = salesRows?.filter((s) => s.status === "approved") ?? [];
  const refundedSales = salesRows?.filter((s) => s.status === "refunded") ?? [];
  const netRevenueCents = 
    approvedSales.reduce((acc, s) => acc + s.amount_cents, 0) - 
    refundedSales.reduce((acc, s) => acc + s.amount_cents, 0);
  const netRevenue = netRevenueCents / 100;

  const totalUsers = users ?? 0;
  const onboardingPct = totalUsers 
    ? Math.round(((onboardingCompletedCount ?? 0) / totalUsers) * 100) 
    : 0;

  const stats = [
    { label: "Receita Líquida", value: netRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    { label: "Alunos Totais", value: totalUsers },
    { label: "Conversão Onboarding", value: `${onboardingPct}%` },
    { label: "Aulas Concluídas", value: progressRows?.length ?? 0 },
    { label: "Looks Cadastrados", value: looks ?? 0 },
  ];

  // Agrega métricas globais de consumo de IA de forma combinada (dados reais da API + retroativo estimado)
  const logsHasTokens = (aiLogs ?? []).some((l) => (l.total_tokens ?? 0) > 0);

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalPhotos = 0;
  let totalTexts = 0;

  if (logsHasTokens) {
    const safeAiLogs = aiLogs ?? [];
    totalPromptTokens = safeAiLogs.reduce((acc, log) => {
      const val = log.prompt_tokens || (log.kind === "photo" ? 1200 : 600);
      return acc + val;
    }, 0);
    totalCompletionTokens = safeAiLogs.reduce((acc, log) => {
      const val = log.completion_tokens || 400;
      return acc + val;
    }, 0);
    totalTokens = safeAiLogs.reduce((acc, log) => {
      const promptEst = log.prompt_tokens || (log.kind === "photo" ? 1200 : 600);
      const compEst = log.completion_tokens || 400;
      return acc + (log.total_tokens || (promptEst + compEst));
    }, 0);
    totalPhotos = safeAiLogs.filter((log) => log.kind === "photo").length;
    totalTexts = safeAiLogs.filter((log) => log.kind === "text").length;
  } else {
    // Estimativa retroativa a partir de todas as mensagens de fit_check_messages (se logs estiverem vazios/nulos)
    const messages = aiMessages ?? [];
    totalPhotos = messages.filter((m) => m.role === "user" && m.thumb).length;
    totalTexts = messages.filter((m) => m.role === "user" && !m.thumb).length;

    for (const msg of messages) {
      const wordCount = (msg.content ?? "").split(/\s+/).filter(Boolean).length;
      const tokensEst = Math.round(wordCount * 1.35); // tokens por palavra aproximado

      if (msg.role === "user") {
        const photoBonus = msg.thumb ? 1500 : 0;
        totalPromptTokens += tokensEst + photoBonus + 800; // prompt de sistema
      } else {
        totalCompletionTokens += tokensEst;
      }
    }
    totalTokens = totalPromptTokens + totalCompletionTokens;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Visão geral"
        description="Conteúdo cadastrado, faturamento e engajamento dos alunos."
      />

      {/* Grid de KPIs no topo da visão geral */}
      <div className="mb-8 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="font-display text-lg sm:text-xl font-bold text-accent truncate">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Painel Consumido de IA & Controle de Tokens */}
      <div className="mb-10">
        <AiStatsCard
          totalPromptTokens={totalPromptTokens}
          totalCompletionTokens={totalCompletionTokens}
          totalTokens={totalTokens}
          totalPhotos={totalPhotos}
          totalTexts={totalTexts}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold">Alunos Recentes</h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted font-semibold">
              <th className="px-5 py-3.5 font-medium">Nome</th>
              <th className="px-5 py-3.5 font-medium">Objetivo</th>
              <th className="px-5 py-3.5 font-medium">Estilo</th>
              <th className="px-5 py-3.5 font-medium">Onboarding</th>
              <th className="px-5 py-3.5 font-medium">Progresso</th>
              <th className="px-5 py-3.5 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const done = doneByUser.get(p.user_id) ?? 0;
              const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {p.name ?? "—"}
                    {p.is_admin && (
                      <span className="ml-2 inline-flex items-center rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#7ea2ff]">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {STYLE_GOALS[p.style_goal ?? ""] ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {STYLES[p.preferred_style ?? ""] ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.onboarding_completed ? (
                      <span className="text-success font-medium">Completo</span>
                    ) : (
                      <span className="text-muted">Pendente</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {done} aulas · {pct}%
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
