import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Camera,
  Heart,
  KeyRound,
  MessageSquare,
  Receipt,
  Sparkles,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSetting,
  FIT_CHECK_DEFAULTS,
  GATEWAY_DEFAULTS,
  type FitCheckSettings,
  type GatewaySettings,
  type TagsSettings,
} from "@/lib/admin/settings";
import { calcularEconomiaAluno } from "@/lib/admin/economia-aluno";
import { brl, dateShort, dateTime, initials, num, relTime } from "@/lib/admin/format";
import { STYLES, STYLE_GOALS, MAIN_DIFFICULTIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/admin/copy-button";
import { InlineText } from "@/components/admin/ui/inline-edit";
import { AutosaveForm, AutosaveSelect, AutosaveTextarea } from "@/components/admin/ui/autosave";
import { StudentQuickActions } from "@/components/admin/students/student-quick-actions";
import { StudentDangerZone } from "@/components/admin/students/student-danger-zone";
import { TagsEditor } from "@/components/admin/students/tags-editor";
import { RevokeEntitlementButton } from "@/components/admin/students/revoke-entitlement";
import { updateStudentFieldAction } from "@/app/actions/admin/students";
import { BONUSES } from "@/lib/bonuses";

export const dynamic = "force-dynamic";

const BONUS_TITLES = new Map(BONUSES.map((b) => [b.key, b.title]));

function entitlementLabel(key: string): string {
  if (key === "base") return "MPO — acesso principal";
  if (key === "economize-58") return "Pack completo (58% off)";
  return BONUS_TITLES.get(key) ?? key;
}

export default async function AlunoDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const db = createAdminClient();

  const { data: student } = await db.from("users_profile").select("*").eq("user_id", id).maybeSingle();
  if (!student) notFound();

  const [
    entRes, credRes, progressRes, lessonsRes, salesRes, convRes, logsRes,
    favRes, fitsRes, tagsSettings, reqsRes, fitCheckSettings, gatewaySettings,
  ] = await Promise.all([
    db.from("user_entitlements").select("entitlement, source, expires_at, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    db.from("fit_check_credits").select("balance, expires_at").eq("user_id", id).maybeSingle(),
    db.from("user_progress").select("lesson_id, created_at").eq("user_id", id).eq("completed", true).order("created_at", { ascending: false }),
    db.from("lessons").select("id, title, module_id").is("deleted_at", null),
    db.from("sales").select("id, amount_cents, status, payment_method, offer_name, created_at, is_test, gateway_fee_cents").or(`user_id.eq.${id}${student.email ? `,email.ilike.${student.email}` : ""}`).order("created_at", { ascending: false }),
    db.from("fit_check_conversations").select("id, title, created_at, updated_at").eq("user_id", id).order("updated_at", { ascending: false }).limit(10),
    db.from("fit_check_logs").select("kind, total_tokens, prompt_tokens, completion_tokens, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(500),
    db.from("user_favorites").select("look_id, created_at, looks(title)").eq("user_id", id).eq("kind", "favorite").order("created_at", { ascending: false }).limit(20),
    db.from("community_fits").select("id, caption, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    getSetting<TagsSettings>("student_tags", { tags: [] }),
    db.from("fit_check_requests").select("custo_cents, created_at").eq("user_id", id),
    getSetting<FitCheckSettings>("fit_check", FIT_CHECK_DEFAULTS),
    getSetting<GatewaySettings>("gateway", GATEWAY_DEFAULTS),
  ]);

  const entitlements = entRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const lessonTitle = new Map(lessons.map((l) => [l.id, l.title]));
  const progress = progressRes.data ?? [];
  const sales = (salesRes.data ?? []).filter((s) => !s.is_test);
  const conversations = convRes.data ?? [];
  const logs = logsRes.data ?? [];
  const totalTokens = logs.reduce((a, l) => a + (l.total_tokens ?? 0), 0);
  const totalSpent = sales.filter((s) => s.status === "approved").reduce((a, s) => a + s.amount_cents, 0);
  // Quanto este aluno rendeu, quanto custou de IA e o que sobrou.
  const economia = calcularEconomiaAluno({
    vendas: salesRes.data ?? [],
    requisicoes: reqsRes.data ?? [],
    logs,
    fitCheck: fitCheckSettings,
    gateway: gatewaySettings,
  });

  const base = entitlements.find((e) => e.entitlement === "base");
  const hasBase = !!base && (!base.expires_at || new Date(base.expires_at) > new Date());

  const catalog = tagsSettings.tags;
  for (const t of (student.tags ?? []) as string[]) {
    if (!catalog.some((c) => c.name === t)) catalog.push({ name: t, color: "#8b96a8" });
  }

  const updateField = updateStudentFieldAction.bind(null, id);

  /* timeline unificada */
  const timeline = [
    ...progress.map((p) => ({ at: p.created_at, icon: "aula", title: `Concluiu a aula "${lessonTitle.get(p.lesson_id) ?? "—"}"` })),
    ...sales.map((s) => ({ at: s.created_at, icon: "venda", title: `${s.status === "approved" ? "Compra" : "Reembolso/falha"} de ${brl(s.amount_cents)} (${s.payment_method ?? "—"})` })),
    ...entitlements.map((e) => ({ at: e.created_at, icon: "acesso", title: `Acesso liberado: ${entitlementLabel(e.entitlement)}${e.source ? ` · ${e.source}` : ""}` })),
    ...(favRes.data ?? []).map((f) => ({ at: f.created_at, icon: "fav", title: `Favoritou o look "${(f.looks as unknown as { title: string } | null)?.title ?? "—"}"` })),
    ...(fitsRes.data ?? []).map((f) => ({ at: f.created_at, icon: "fit", title: `Enviou um fit para a comunidade (${f.status})` })),
    ...logs.slice(0, 30).map((l) => ({ at: l.created_at, icon: "ia", title: `Fit Check ${l.kind === "photo" ? "com foto" : "por texto"} · ${num(l.total_tokens ?? 0)} tokens` })),
    { at: student.created_at, icon: "cadastro", title: "Conta criada" },
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 60);

  const TIMELINE_ICON: Record<string, React.ReactNode> = {
    aula: <BookOpen className="size-3.5" />,
    venda: <Receipt className="size-3.5" />,
    acesso: <KeyRound className="size-3.5" />,
    fav: <Heart className="size-3.5" />,
    fit: <Camera className="size-3.5" />,
    ia: <Sparkles className="size-3.5" />,
    cadastro: <MessageSquare className="size-3.5" />,
  };

  return (
    <div className="space-y-5">
      {/* cabeçalho de identidade */}
      <header className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-3 font-display text-lg font-bold text-foreground">
          {initials(student.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <InlineText
              value={student.name ?? ""}
              placeholder="Sem nome"
              action={async (v) => {
                "use server";
                return updateStudentFieldAction(id, "name", v);
              }}
              className="text-lg font-bold text-foreground"
              inputClassName="text-lg font-bold"
            />
            {student.is_admin && <Badge variant="accent">Admin</Badge>}
            {hasBase ? <Badge variant="success">Acesso ativo</Badge> : <Badge>Sem acesso</Badge>}
            {base?.expires_at && (
              <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">
                Acesso expira em {dateShort(base.expires_at)}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{student.email}</span>
            {student.email && <CopyButton text={student.email} label="" />}
            <span>· cadastro em {dateShort(student.created_at)}</span>
            <span>· último acesso {student.last_seen_at ? relTime(student.last_seen_at) : "nunca"}</span>
          </div>
          <div className="mt-2">
            <TagsEditor userId={id} current={(student.tags ?? []) as string[]} catalog={catalog} />
          </div>
        </div>
      </header>

      {/* KPIs do aluno */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total gasto", value: brl(totalSpent), href: "#compras" },
          { label: "Custo de IA", value: brl(economia.custoIaCents), href: "#economia", tom: economia.custoIaCents > 0 ? "custo" : undefined },
          {
            label: economia.lucroCents >= 0 ? "Lucro" : "Prejuízo",
            value: brl(economia.lucroCents),
            href: "#economia",
            tom: economia.lucroCents >= 0 ? "lucro" : "custo",
          },
          { label: "Aulas concluídas", value: `${progress.length}/${lessons.length}`, href: "#timeline" },
          { label: "Tokens (saldo)", value: credRes.data ? num(credRes.data.balance) : "—", href: "#tokens" },
          { label: "Conversas de IA", value: num(conversations.length), href: "#conversas" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">{kpi.label}</p>
            <p
              className={`mt-1 font-display text-lg font-bold tabular-nums ${
                kpi.tom === "lucro" ? "text-[#2fbf71]" : kpi.tom === "custo" ? "text-danger" : "text-foreground"
              }`}
            >
              {kpi.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* acessos */}
          <section id="acessos" className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Acessos & bônus</h2>
            {entitlements.length === 0 ? (
              <p className="mb-3 text-xs text-muted-2">Nenhum acesso liberado ainda.</p>
            ) : (
              <ul className="mb-4 divide-y divide-border/60 rounded-lg border border-border">
                {entitlements.map((e) => (
                  <li key={e.entitlement} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate text-foreground">{entitlementLabel(e.entitlement)}</span>
                    <span className="hidden shrink-0 text-[11px] text-muted-2 sm:inline">{e.source ?? "—"}</span>
                    <span className="shrink-0 text-[11px] text-muted-2">
                      {e.expires_at ? `expira ${dateShort(e.expires_at)}` : "vitalício"}
                    </span>
                    <RevokeEntitlementButton userId={id} entitlement={e.entitlement} label={entitlementLabel(e.entitlement)} />
                  </li>
                ))}
              </ul>
            )}
            <div id="tokens">
              <StudentQuickActions userId={id} hasBase={hasBase} />
            </div>
          </section>

          {/* quanto sobra deste aluno */}
          <section id="economia" className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Quanto sobra deste aluno</h2>
              {economia.margemPct !== null && (
                <Badge
                  variant={economia.lucroCents >= 0 ? "success" : undefined}
                  className={economia.lucroCents < 0 ? "border-danger/30 bg-danger/10 text-danger" : undefined}
                >
                  margem de {economia.margemPct}%
                </Badge>
              )}
            </div>

            {/* a conta, de cima para baixo */}
            <ul className="divide-y divide-border/60 rounded-lg border border-border text-[13px]">
              {[
                { label: "Vendas aprovadas", value: economia.receitaBrutaCents, hint: null },
                {
                  label: "Taxa da Cakto",
                  value: -economia.taxaGatewayCents,
                  hint: economia.taxaEstimadaCents > 0 ? `${brl(economia.taxaEstimadaCents)} estimados` : null,
                },
                {
                  label: "Custo de IA (Fit Check)",
                  value: -economia.custoIaCents,
                  hint:
                    economia.chamadasEstimadas > 0
                      ? `${economia.chamadasEstimadas} conversa(s) antiga(s) estimada(s)`
                      : null,
                },
              ].map((linha) => (
                <li key={linha.label} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-muted">{linha.label}</span>
                  {linha.hint && (
                    <span className="hidden shrink-0 text-[11px] text-muted-2 sm:inline">{linha.hint}</span>
                  )}
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      linha.value < 0 ? "text-danger" : "text-foreground"
                    }`}
                  >
                    {linha.value < 0 ? `− ${brl(Math.abs(linha.value))}` : brl(linha.value)}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-3 bg-surface-2 px-3 py-2.5">
                <span className="min-w-0 flex-1 font-semibold text-foreground">
                  {economia.lucroCents >= 0 ? "Lucro" : "Prejuízo"}
                </span>
                <span
                  className={`shrink-0 font-display text-base font-bold tabular-nums ${
                    economia.lucroCents >= 0 ? "text-[#2fbf71]" : "text-danger"
                  }`}
                >
                  {brl(economia.lucroCents)}
                </span>
              </li>
            </ul>

            {economia.reembolsadoCents > 0 && (
              <p className="mt-2 text-[11px] text-muted-2">
                Fora da conta: {brl(economia.reembolsadoCents)} reembolsados/estornados.
              </p>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-muted-2">
              O custo de IA é o que a OpenAI cobrou pelas {num(totalTokens)} tokens que este aluno
              consumiu no Fit Check.
              {economia.taxaEstimadaCents > 0 &&
                " Parte da taxa da Cakto é estimada pela tabela do seu plano, porque o webhook não informou o valor real dessas vendas."}
            </p>
          </section>

          {/* compras */}
          <section id="compras" className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Compras</h2>
            {sales.length === 0 ? (
              <p className="text-xs text-muted-2">Nenhuma transação encontrada para este aluno.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-lg border border-border">
                {sales.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{brl(s.amount_cents)}</span>
                    <Badge variant={s.status === "approved" ? "success" : undefined} className={s.status !== "approved" ? "border-danger/30 bg-danger/10 text-danger" : undefined}>
                      {s.status === "approved" ? "aprovada" : s.status}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-muted">{s.offer_name ?? s.payment_method ?? ""}</span>
                    <span className="shrink-0 text-[11px] text-muted-2">{dateTime(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* conversas de IA */}
          <section id="conversas" className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Conversas de IA (Fit Check)</h2>
              <Link href={`/admin/conversas?q=${encodeURIComponent(student.email ?? "")}`} className="text-[11px] font-semibold text-[#7ea2ff] hover:underline">
                Ver com mensagens →
              </Link>
            </div>
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-2">Nenhuma conversa ainda.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-lg border border-border">
                {conversations.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <MessageSquare className="size-3.5 shrink-0 text-muted-2" />
                    <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-2">{relTime(c.updated_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* timeline */}
          <section id="timeline" className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Timeline de eventos</h2>
            <ul className="max-h-96 space-y-0.5 overflow-y-auto pr-1">
              {timeline.map((e, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg px-1.5 py-1.5">
                  <span className="mt-0.5 text-muted-2">{TIMELINE_ICON[e.icon]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted">{e.title}</span>
                    <span className="block text-[10px] text-muted-2">{dateTime(e.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* coluna direita */}
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Perfil & notas internas</h2>
            <AutosaveForm action={updateField} className="space-y-3">
              <AutosaveSelect
                name="style_goal"
                label="Objetivo"
                initial={student.style_goal ?? ""}
                options={[{ value: "", label: "—" }, ...Object.entries(STYLE_GOALS).map(([value, label]) => ({ value, label }))]}
              />
              <AutosaveSelect
                name="preferred_style"
                label="Estilo preferido"
                initial={student.preferred_style ?? ""}
                options={[{ value: "", label: "—" }, ...Object.entries(STYLES).map(([value, label]) => ({ value, label }))]}
              />
              <AutosaveSelect
                name="main_difficulty"
                label="Maior dificuldade"
                initial={student.main_difficulty ?? ""}
                options={[{ value: "", label: "—" }, ...Object.entries(MAIN_DIFFICULTIES).map(([value, label]) => ({ value, label }))]}
              />
              <AutosaveTextarea
                name="admin_notes"
                label="Notas internas (só admins veem)"
                initial={student.admin_notes ?? ""}
                placeholder="Contexto, atendimento, promessas feitas…"
                rows={5}
              />
            </AutosaveForm>
          </section>

          <StudentDangerZone userId={id} name={student.name ?? student.email ?? "este aluno"} isAdmin={student.is_admin} />
        </div>
      </div>
    </div>
  );
}
