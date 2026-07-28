import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, parseListParams, type SearchParams } from "@/lib/admin/list";
import { getPeriod } from "@/lib/admin/period-server";
import { getSetting, FIT_CHECK_DEFAULTS, type FitCheckSettings } from "@/lib/admin/settings";
import { brl, dateTime, num, relTime } from "@/lib/admin/format";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";

export const dynamic = "force-dynamic";

export default async function ConversasPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "updated_at.desc" });
  const period = await getPeriod();
  const db = createAdminClient();

  // busca por aluno (nome/e-mail) → restringe user_ids
  let userFilter: string[] | null = null;
  if (params.q) {
    const { data: profs } = await db
      .from("users_profile")
      .select("user_id")
      .or(`name.ilike.${ilikePattern(params.q)},email.ilike.${ilikePattern(params.q)}`)
      .limit(500);
    userFilter = (profs ?? []).map((p) => p.user_id);
  }

  let query = db.from("fit_check_conversations").select("*", { count: "exact" });
  if (userFilter) {
    query = query.in("user_id", userFilter.length ? userFilter : ["00000000-0000-0000-0000-000000000000"]);
  }
  const sortCol = params.sortCol === "created_at" ? "created_at" : "updated_at";
  query = query.order(sortCol, { ascending: params.sortAsc }).range(params.from, params.to);

  const [{ data: convs, count }, logsRes, fitCheck] = await Promise.all([
    query,
    db.from("fit_check_logs")
      .select("user_id, total_tokens, kind, created_at")
      .gte("created_at", period.from.toISOString())
      .lt("created_at", period.to.toISOString())
      .limit(50000),
    getSetting<FitCheckSettings>("fit_check", FIT_CHECK_DEFAULTS),
  ]);

  const conversations = convs ?? [];
  const logs = logsRes.data ?? [];
  const tokensPeriod = logs.reduce((a, l) => a + (l.total_tokens ?? 0), 0);
  const custoPeriod = Math.round((tokensPeriod / 1000) * fitCheck.token_price_per_1k_cents);
  const fotos = logs.filter((l) => l.kind === "photo").length;

  const ids = conversations.map((c) => c.id);
  const userIds = [...new Set(conversations.map((c) => c.user_id))];
  const [msgsRes, profsRes, tokensByUserRes] = await Promise.all([
    ids.length ? db.from("fit_check_messages").select("conversation_id").in("conversation_id", ids) : Promise.resolve({ data: [] as { conversation_id: string }[] }),
    userIds.length ? db.from("users_profile").select("user_id, name, email").in("user_id", userIds) : Promise.resolve({ data: [] }),
    userIds.length ? db.from("fit_check_logs").select("user_id, total_tokens").in("user_id", userIds).limit(20000) : Promise.resolve({ data: [] as { user_id: string; total_tokens: number | null }[] }),
  ]);

  const msgCount = new Map<string, number>();
  for (const m of msgsRes.data ?? []) msgCount.set(m.conversation_id, (msgCount.get(m.conversation_id) ?? 0) + 1);
  const profMap = new Map((profsRes.data ?? []).map((p) => [p.user_id, p]));
  const tokensByUser = new Map<string, number>();
  for (const l of tokensByUserRes.data ?? []) {
    tokensByUser.set(l.user_id, (tokensByUser.get(l.user_id) ?? 0) + (l.total_tokens ?? 0));
  }

  const tableRows: TableRow[] = conversations.map((c) => {
    const p = profMap.get(c.user_id);
    return {
      id: c.id,
      editHref: `/admin/conversas/${c.id}`,
      title: c.title,
      subtitle: p?.name ?? p?.email ?? "Aluno",
      meta: `${num(msgCount.get(c.id) ?? 0)} mensagens · ${relTime(c.updated_at)}`,
      cells: {
        conversa: (
          <span className="min-w-0">
            <span className="block max-w-[240px] truncate font-medium text-foreground">{c.title}</span>
            <span className="block max-w-[240px] truncate text-[11px] text-muted-2">
              {p?.name ?? "—"} · {p?.email ?? ""}
            </span>
          </span>
        ),
        mensagens: <span className="tabular-nums text-muted">{num(msgCount.get(c.id) ?? 0)}</span>,
        tokens_aluno: <span className="tabular-nums text-muted">{num(tokensByUser.get(c.user_id) ?? 0)}</span>,
        atualizada: relTime(c.updated_at),
        criada: dateTime(c.created_at),
      },
    };
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Conversas de IA (Fit Check)</h1>
        <p className="mt-0.5 text-xs text-muted">
          {period.label}: {num(logs.length)} usos ({num(fotos)} com foto) · {num(tokensPeriod)} tokens ·
          custo estimado <strong className="text-foreground">{brl(custoPeriod)}</strong>
          {" "}· preço configurável em Sistema → Fit Check (IA).
        </p>
      </div>

      <DataTable
        tableId="conversas"
        basePath="/admin/conversas"
        columns={[
          { id: "conversa", label: "Conversa / aluno", width: 280 },
          { id: "mensagens", label: "Mensagens", align: "right" },
          { id: "tokens_aluno", label: "Tokens do aluno (total)", align: "right" },
          { id: "atualizada", label: "Última atividade", sortable: true },
          { id: "criada", label: "Criada em", sortable: true },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`${sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por nome ou e-mail do aluno…  ( / )"
        emptyTitle="Nenhuma conversa encontrada."
      />
    </div>
  );
}
