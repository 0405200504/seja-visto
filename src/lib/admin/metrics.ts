import { createAdminClient } from "@/lib/supabase/admin";
import { dayKey, eachDay, type Period } from "@/lib/admin/period";
import { getSetting, FIT_CHECK_DEFAULTS, type FitCheckSettings } from "@/lib/admin/settings";

/**
 * Camada de métricas do dashboard. Todas as consultas excluem vendas de
 * teste (is_test) e admins, e comparam o período atual com o anterior.
 */

type SaleRow = {
  id: string;
  amount_cents: number;
  gateway_fee_cents: number;
  status: string;
  created_at: string;
  is_test: boolean;
};

type ProfileRow = {
  user_id: string;
  created_at: string;
  onboarding_completed: boolean;
  is_admin: boolean;
  last_seen_at: string | null;
  name: string | null;
};

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

export type Kpi = {
  id: string;
  label: string;
  value: number;      // valor bruto (centavos ou contagem/percentual)
  prev: number;
  format: "brl" | "int" | "pct";
  goodWhenUp: boolean;
  spark?: number[];
  href: string;
  hint?: string;
};

export type TimelineEvent = {
  kind: "venda" | "cadastro" | "aula" | "fit" | "token" | "acesso";
  at: string;
  title: string;
  href: string;
};

export async function getDashboardData(period: Period) {
  const db = createAdminClient();
  const sinceAll = period.prevFrom.toISOString();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const in7days = new Date(now.getTime() + 7 * 86_400_000).toISOString();
  const fitCheck = await getSetting<FitCheckSettings>("fit_check", FIT_CHECK_DEFAULTS);

  const [
    salesRes,
    profilesRes,
    aiLogsRes,
    progressRes,
    lessonsRes,
    favoritesRes,
    reactionsRes,
    fitsPendingRes,
    looksSemImagemRes,
    semTokensRes,
    acessosVencendoRes,
    clicksRes,
    linksRes,
    recentSales,
    recentProfiles,
    recentFits,
    recentEntitlements,
    recentProgress,
  ] = await Promise.all([
    db.from("sales")
      .select("id, user_id, amount_cents, gateway_fee_cents, status, created_at, is_test")
      .gte("created_at", sinceAll)
      .limit(20000)
      .returns<(SaleRow & { user_id: string | null })[]>(),
    db.from("users_profile")
      .select("user_id, created_at, onboarding_completed, is_admin, last_seen_at, name")
      .limit(20000)
      .returns<ProfileRow[]>(),
    db.from("fit_check_logs")
      .select("user_id, total_tokens, created_at")
      .gte("created_at", sinceAll)
      .limit(50000),
    db.from("user_progress")
      .select("user_id, lesson_id, created_at")
      .eq("completed", true)
      .limit(50000),
    db.from("lessons").select("id, title, module_id").is("deleted_at", null),
    db.from("user_favorites").select("look_id").eq("kind", "favorite").limit(50000),
    db.from("fit_reactions").select("look_id, kind").not("look_id", "is", null).limit(50000),
    db.from("community_fits").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("looks").select("*", { count: "exact", head: true }).is("deleted_at", null).is("image_url", null),
    db.from("fit_check_credits").select("*", { count: "exact", head: true }).eq("balance", 0),
    db.from("user_entitlements")
      .select("*", { count: "exact", head: true })
      .eq("entitlement", "base")
      .not("expires_at", "is", null)
      .gt("expires_at", now.toISOString())
      .lt("expires_at", in7days),
    db.from("tracking_link_clicks").select("link_id, created_at").gte("created_at", sinceAll).limit(50000),
    db.from("tracking_links").select("id, slug, clicks_count").is("deleted_at", null),
    db.from("sales").select("id, name, email, amount_cents, status, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("users_profile").select("user_id, name, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("community_fits").select("id, author_name, created_at, status").order("created_at", { ascending: false }).limit(5),
    db.from("user_entitlements").select("user_id, entitlement, source, created_at").order("created_at", { ascending: false }).limit(6),
    db.from("user_progress").select("user_id, lesson_id, created_at").eq("completed", true).order("created_at", { ascending: false }).limit(6),
  ]);

  const sales = (salesRes.data ?? []).filter((s) => !s.is_test);
  const profiles = (profilesRes.data ?? []).filter((p) => !p.is_admin);
  const aiLogs = aiLogsRes.data ?? [];
  const progress = progressRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const clicks = clicksRes.data ?? [];

  const cur = { from: period.from, to: period.to };
  const prev = { from: period.prevFrom, to: period.prevTo };

  const pick = <T extends { created_at: string }>(rows: T[], r: { from: Date; to: Date }) =>
    rows.filter((row) => inRange(row.created_at, r.from, r.to));

  /* ---------- vendas ---------- */
  const approvedCur = pick(sales, cur).filter((s) => s.status === "approved");
  const approvedPrev = pick(sales, prev).filter((s) => s.status === "approved");
  const refundedCur = pick(sales, cur).filter((s) => s.status !== "approved");
  const refundedPrev = pick(sales, prev).filter((s) => s.status !== "approved");

  const sum = (rows: SaleRow[]) => rows.reduce((a, s) => a + s.amount_cents, 0);
  const fees = (rows: SaleRow[]) => rows.reduce((a, s) => a + (s.gateway_fee_cents || 0), 0);

  const brutaCur = sum(approvedCur);
  const brutaPrev = sum(approvedPrev);
  const reembolsadoCur = sum(refundedCur);
  const reembolsadoPrev = sum(refundedPrev);
  const liquidaCur = brutaCur - fees(approvedCur) - reembolsadoCur;
  const liquidaPrev = brutaPrev - fees(approvedPrev) - reembolsadoPrev;

  /* ---------- alunos ---------- */
  const novosCur = profiles.filter((p) => inRange(p.created_at, cur.from, cur.to));
  const novosPrev = profiles.filter((p) => inRange(p.created_at, prev.from, prev.to));
  const ativos7d = profiles.filter((p) => p.last_seen_at && p.last_seen_at >= sevenDaysAgo).length;
  const onboardingPct = (rows: ProfileRow[]) =>
    rows.length === 0 ? 0 : (rows.filter((p) => p.onboarding_completed).length / rows.length) * 100;
  const onboardingAllPct = onboardingPct(profiles);

  /* ---------- IA ---------- */
  const tokens = (rows: { total_tokens: number | null; created_at: string }[], r: { from: Date; to: Date }) =>
    pick(rows as { created_at: string; total_tokens: number | null }[], r).reduce(
      (a, l) => a + (l.total_tokens ?? 0), 0);
  const tokensCur = tokens(aiLogs as never, cur);
  const tokensPrev = tokens(aiLogs as never, prev);
  const custoIaCur = Math.round((tokensCur / 1000) * fitCheck.token_price_per_1k_cents);
  const custoIaPrev = Math.round((tokensPrev / 1000) * fitCheck.token_price_per_1k_cents);

  /* ---------- séries diárias (sparklines + gráfico) ---------- */
  const daysKeys = eachDay(period);
  const emptySeries = () => Object.fromEntries(daysKeys.map((d) => [d, 0])) as Record<string, number>;

  const receitaDia = emptySeries();
  const vendasDia = emptySeries();
  for (const s of approvedCur) {
    const k = dayKey(s.created_at);
    if (k in receitaDia) {
      receitaDia[k] += s.amount_cents;
      vendasDia[k] += 1;
    }
  }
  const novosDia = emptySeries();
  for (const p of novosCur) {
    const k = dayKey(p.created_at);
    if (k in novosDia) novosDia[k] += 1;
  }
  const custoDia = emptySeries();
  for (const l of pick(aiLogs as { created_at: string; total_tokens: number | null }[], cur)) {
    const k = dayKey(l.created_at);
    if (k in custoDia) custoDia[k] += Math.round(((l.total_tokens ?? 0) / 1000) * fitCheck.token_price_per_1k_cents);
  }

  const chartDays = daysKeys.map((k) => ({
    key: k,
    label: new Date(`${k}T12:00:00-03:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value: receitaDia[k],
  }));

  /* ---------- KPIs ---------- */
  const ticketCur = approvedCur.length ? Math.round(brutaCur / approvedCur.length) : 0;
  const ticketPrev = approvedPrev.length ? Math.round(brutaPrev / approvedPrev.length) : 0;
  const taxaReembolsoCur = approvedCur.length + refundedCur.length === 0 ? 0 : (refundedCur.length / (approvedCur.length + refundedCur.length)) * 100;
  const taxaReembolsoPrev = approvedPrev.length + refundedPrev.length === 0 ? 0 : (refundedPrev.length / (approvedPrev.length + refundedPrev.length)) * 100;

  const kpis: Kpi[] = [
    { id: "liquida", label: "Receita líquida", value: liquidaCur, prev: liquidaPrev, format: "brl", goodWhenUp: true, spark: daysKeys.map((k) => receitaDia[k]), href: "/admin/receita/transacoes?f_status=approved", hint: "Bruta − taxas de gateway − reembolsos" },
    { id: "bruta", label: "Receita bruta", value: brutaCur, prev: brutaPrev, format: "brl", goodWhenUp: true, spark: daysKeys.map((k) => receitaDia[k]), href: "/admin/receita/transacoes?f_status=approved" },
    { id: "vendas", label: "Vendas aprovadas", value: approvedCur.length, prev: approvedPrev.length, format: "int", goodWhenUp: true, spark: daysKeys.map((k) => vendasDia[k]), href: "/admin/receita/transacoes?f_status=approved" },
    { id: "ticket", label: "Ticket médio", value: ticketCur, prev: ticketPrev, format: "brl", goodWhenUp: true, href: "/admin/receita/transacoes?f_status=approved" },
    { id: "novos", label: "Novos alunos", value: novosCur.length, prev: novosPrev.length, format: "int", goodWhenUp: true, spark: daysKeys.map((k) => novosDia[k]), href: "/admin/alunos?sort=created_at.desc" },
    { id: "ativos", label: "Ativos (7 dias)", value: ativos7d, prev: ativos7d, format: "int", goodWhenUp: true, href: "/admin/alunos?f_atividade=ativo7", hint: "Alunos com acesso nos últimos 7 dias (independe do período)" },
    { id: "onboarding", label: "Onboarding completo", value: onboardingAllPct, prev: onboardingPct(profiles.filter((p) => p.created_at < period.from.toISOString())), format: "pct", goodWhenUp: true, href: "/admin/alunos?f_onboarding=incompleto" },
    { id: "reembolso", label: "Taxa de reembolso", value: taxaReembolsoCur, prev: taxaReembolsoPrev, format: "pct", goodWhenUp: false, href: "/admin/receita/reembolsos" },
    { id: "custo_ia", label: "Custo de IA", value: custoIaCur, prev: custoIaPrev, format: "brl", goodWhenUp: false, spark: daysKeys.map((k) => custoDia[k]), href: "/admin/conversas", hint: `${tokensCur.toLocaleString("pt-BR")} tokens no período` },
    { id: "margem", label: "Margem", value: liquidaCur - custoIaCur, prev: liquidaPrev - custoIaPrev, format: "brl", goodWhenUp: true, href: "/admin/receita/transacoes", hint: "Receita líquida − custo de IA" },
  ];

  /* ---------- funil do período ---------- */
  const clicksCur = clicks.filter((c) => inRange(c.created_at, cur.from, cur.to)).length;
  const progressCur = progress.filter((p) => inRange(p.created_at, cur.from, cur.to));
  const lessonsByUser = new Map<string, number>();
  for (const p of progressCur) lessonsByUser.set(p.user_id, (lessonsByUser.get(p.user_id) ?? 0) + 1);
  const fitUsersCur = new Set(pick(aiLogs as { created_at: string; user_id: string }[], cur).map((l) => l.user_id));
  const onboardCur = novosCur.filter((p) => p.onboarding_completed).length;

  const funnel = [
    { label: "Cliques nos links", value: clicksCur, href: "/admin/crescimento/links", hint: "Cliques registrados nos links de rastreamento no período" },
    { label: "Vendas pagas", value: approvedCur.length, href: "/admin/receita/transacoes?f_status=approved" },
    { label: "Contas criadas", value: novosCur.length, href: "/admin/alunos?sort=created_at.desc" },
    { label: "Onboarding completo", value: onboardCur, href: "/admin/alunos?f_onboarding=completo" },
    { label: "Iniciaram aulas (1+)", value: [...lessonsByUser.values()].filter((n) => n >= 1).length, href: "/admin/conteudo/metodo" },
    { label: "Engajados (5+ aulas)", value: [...lessonsByUser.values()].filter((n) => n >= 5).length, href: "/admin/conteudo/metodo" },
    { label: "1º Fit Check", value: fitUsersCur.size, href: "/admin/conversas" },
  ];

  /* ---------- precisa da sua atenção ---------- */
  const buyerUserIds = new Set(
    (salesRes.data ?? [])
      .filter((s) => s.status === "approved" && !s.is_test && s.user_id)
      .map((s) => s.user_id as string)
  );
  const pagaramSemEntrar = profiles.filter(
    (p) => buyerUserIds.has(p.user_id) && !p.last_seen_at && !p.onboarding_completed
  ).length;

  const travadosOnboarding = profiles.filter(
    (p) => !p.onboarding_completed && new Date(p.created_at).getTime() < now.getTime() - 3 * 86_400_000
  ).length;

  const attention = [
    { label: "Fits aguardando aprovação", count: fitsPendingRes.count ?? 0, href: "/admin/comunidade?f_status=pending", action: "Revisar" },
    { label: "Pagaram e nunca acessaram", count: pagaramSemEntrar, href: "/admin/alunos?f_onboarding=incompleto", action: "Ver alunos" },
    { label: "Travados no onboarding (3+ dias)", count: travadosOnboarding, href: "/admin/alunos?f_onboarding=incompleto", action: "Ver alunos" },
    { label: "Alunos sem tokens de IA", count: semTokensRes.count ?? 0, href: "/admin/alunos?f_tokens=zerado", action: "Ver alunos" },
    { label: "Acessos vencendo em 7 dias", count: acessosVencendoRes.count ?? 0, href: "/admin/receita/acessos?f_vencimento=7d", action: "Ver acessos" },
    { label: "Transações com falha/reembolso no período", count: refundedCur.length, href: "/admin/receita/reembolsos", action: "Ver" },
    { label: "Looks sem imagem", count: looksSemImagemRes.count ?? 0, href: "/admin/conteudo/looks?f_imagem=sem", action: "Completar" },
  ].filter((a) => a.count > 0);

  /* ---------- top listas ---------- */
  const favCount = new Map<string, number>();
  for (const f of favoritesRes.data ?? []) favCount.set(f.look_id, (favCount.get(f.look_id) ?? 0) + 1);
  for (const r of reactionsRes.data ?? []) {
    if (r.kind === "like" && r.look_id) favCount.set(r.look_id, (favCount.get(r.look_id) ?? 0) + 1);
  }
  const topLookIds = [...favCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const { data: topLooksData } = topLookIds.length
    ? await db.from("looks").select("id, title").in("id", topLookIds.map(([id]) => id))
    : { data: [] as { id: string; title: string }[] };
  const lookTitle = new Map((topLooksData ?? []).map((l) => [l.id, l.title]));
  const topLooks = topLookIds.map(([id, count]) => ({
    label: lookTitle.get(id) ?? "Look removido",
    count,
    href: `/admin/conteudo/looks/${id}`,
  }));

  const lessonCount = new Map<string, number>();
  for (const p of progress) lessonCount.set(p.lesson_id, (lessonCount.get(p.lesson_id) ?? 0) + 1);
  const lessonsRanked = lessons
    .map((l) => ({ label: l.title, count: lessonCount.get(l.id) ?? 0, href: `/admin/conteudo/metodo/${l.module_id}?aula=${l.id}` }))
    .sort((a, b) => b.count - a.count);
  const topAulas = lessonsRanked.slice(0, 5);
  const bottomAulas = [...lessonsRanked].reverse().slice(0, 5);

  const clickByLink = new Map<string, number>();
  for (const c of clicks.filter((c) => inRange(c.created_at, cur.from, cur.to))) {
    clickByLink.set(c.link_id, (clickByLink.get(c.link_id) ?? 0) + 1);
  }
  const linkSlug = new Map((linksRes.data ?? []).map((l) => [l.id, l.slug]));
  const topLinks = [...clickByLink.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ label: `/l/${linkSlug.get(id) ?? "?"}`, count, href: "/admin/crescimento/links" }));

  /* ---------- timeline ---------- */
  const profileName = new Map(profiles.map((p) => [p.user_id, p.name ?? "Aluno"]));
  const timeline: TimelineEvent[] = [
    ...(recentSales.data ?? []).filter((s) => s.status === "approved").map((s) => ({
      kind: "venda" as const,
      at: s.created_at,
      title: `Venda de ${((s.amount_cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${s.name ?? s.email}`,
      href: `/admin/receita/transacoes?q=${encodeURIComponent(s.email)}`,
    })),
    ...(recentProfiles.data ?? []).map((p) => ({
      kind: "cadastro" as const,
      at: p.created_at,
      title: `Novo cadastro: ${p.name ?? "Aluno"}`,
      href: `/admin/alunos/${p.user_id}`,
    })),
    ...(recentFits.data ?? []).map((f) => ({
      kind: "fit" as const,
      at: f.created_at,
      title: `Fit enviado por ${f.author_name ?? "aluno"} (${f.status === "pending" ? "pendente" : f.status === "approved" ? "aprovado" : "recusado"})`,
      href: "/admin/comunidade",
    })),
    ...(recentEntitlements.data ?? []).map((e) => ({
      kind: "acesso" as const,
      at: e.created_at,
      title: `Acesso "${e.entitlement}" liberado para ${profileName.get(e.user_id) ?? "aluno"}${e.source ? ` (${e.source})` : ""}`,
      href: `/admin/alunos/${e.user_id}`,
    })),
    ...(recentProgress.data ?? []).map((p) => ({
      kind: "aula" as const,
      at: p.created_at,
      title: `${profileName.get(p.user_id) ?? "Aluno"} concluiu "${lessons.find((l) => l.id === p.lesson_id)?.title ?? "aula"}"`,
      href: `/admin/alunos/${p.user_id}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 18);

  return { kpis, chartDays, funnel, attention, topLooks, topAulas, bottomAulas, topLinks, timeline };
}
