import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseListParams, type SearchParams } from "@/lib/admin/list";
import { fetchStudents } from "@/lib/admin/queries/students";
import { getSetting, type TagsSettings } from "@/lib/admin/settings";
import { brl, dateShort, initials, num, relTime } from "@/lib/admin/format";
import { STYLES, STYLE_GOALS } from "@/lib/constants";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { StudentQuickActions } from "@/components/admin/students/student-quick-actions";
import { TagsEditor } from "@/components/admin/students/tags-editor";
import { bulkStudentsAction, csvStudentsAction } from "@/app/actions/admin/students";
import { Badge } from "@/components/ui/badge";
import { CreateMemberModal } from "@/components/admin/students/create-member-modal";

export const dynamic = "force-dynamic";

export default async function AlunosPage(props: { searchParams: Promise<SearchParams> }) {
  const { profile } = await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });

  const db = createAdminClient();
  const [{ rows, total, totalLessons }, tagsSettings, viewsRes] = await Promise.all([
    fetchStudents(params),
    getSetting<TagsSettings>("student_tags", { tags: [] }),
    db.from("admin_saved_views").select("id, name, params").eq("user_id", profile.user_id).eq("page", "/admin/alunos"),
  ]);

  const catalog = tagsSettings.tags;
  const usedTagNames = new Set(catalog.map((t) => t.name));
  for (const r of rows) for (const t of r.tags) {
    if (!usedTagNames.has(t)) {
      catalog.push({ name: t, color: "#8b96a8" });
      usedTagNames.add(t);
    }
  }

  const statusBadge = (r: (typeof rows)[number]) => {
    if (r.is_admin) return <Badge variant="accent">Admin</Badge>;
    if (!r.hasBase) return <Badge>Sem acesso</Badge>;
    if (r.baseExpiresAt && new Date(r.baseExpiresAt).getTime() < Date.now() + 7 * 86_400_000)
      return <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">Vence {dateShort(r.baseExpiresAt)}</Badge>;
    return <Badge variant="success">Ativo</Badge>;
  };

  const tableRows: TableRow[] = rows.map((r) => {
    const progressPct = totalLessons > 0 ? Math.round((r.lessonsDone / totalLessons) * 100) : 0;
    return {
      id: r.user_id,
      editHref: `/admin/alunos/${r.user_id}`,
      title: r.name ?? "Sem nome",
      subtitle: r.email,
      meta: (
        <span className="flex items-center gap-2">
          {statusBadge(r)}
          <span>{r.lessonsDone}/{totalLessons} aulas</span>
          {r.totalSpentCents > 0 && <span>{brl(r.totalSpentCents)}</span>}
        </span>
      ),
      cells: {
        aluno: (
          <span className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-bold text-foreground">
              {initials(r.name)}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[180px] truncate font-medium text-foreground">{r.name ?? "Sem nome"}</span>
              <span className="block max-w-[180px] truncate text-[11px] text-muted-2">{r.email}</span>
            </span>
          </span>
        ),
        status: statusBadge(r),
        tags: <TagsEditor userId={r.user_id} current={r.tags} catalog={catalog} />,
        objetivo: r.style_goal ? (STYLE_GOALS[r.style_goal] ?? r.style_goal) : undefined,
        estilo: r.preferred_style ? (STYLES[r.preferred_style] ?? r.preferred_style) : undefined,
        progresso: (
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${progressPct}%` }} />
            </span>
            <span className="tabular-nums text-muted">{r.lessonsDone}/{totalLessons}</span>
          </span>
        ),
        tokens:
          r.tokenBalance === null ? undefined : (
            <span className={r.tokenBalance === 0 ? "font-semibold text-[#e5a83b]" : "tabular-nums"}>
              {num(r.tokenBalance)}
            </span>
          ),
        gasto: r.totalSpentCents > 0 ? <span className="tabular-nums">{brl(r.totalSpentCents)}</span> : undefined,
        atividade: r.last_seen_at ? relTime(r.last_seen_at) : <span className="text-muted-2">nunca</span>,
        cadastro: dateShort(r.created_at),
      },
      drawerTitle: r.name ?? r.email ?? "Aluno",
      drawerSubtitle: r.email,
      drawer: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total gasto", value: brl(r.totalSpentCents) },
              { label: "Aulas concluídas", value: `${r.lessonsDone}/${totalLessons}` },
              { label: "Tokens de IA", value: r.tokenBalance === null ? "—" : num(r.tokenBalance) },
              { label: "Último acesso", value: r.last_seen_at ? relTime(r.last_seen_at) : "nunca" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">{kpi.label}</p>
                <p className="mt-1 text-base font-bold tabular-nums text-foreground">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            {statusBadge(r)}
            <span>· cadastro em {dateShort(r.created_at)}</span>
            <span>· {r.bonusCount} bônus</span>
          </div>
          <StudentQuickActions userId={r.user_id} hasBase={r.hasBase} compact />
          <Link
            href={`/admin/alunos/${r.user_id}`}
            className="block rounded-lg border border-border bg-surface-2 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-border-strong"
          >
            Abrir perfil completo →
          </Link>
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Alunos</h1>
          <p className="mt-0.5 text-xs text-muted">{num(total)} alunos no total — clique na linha para o painel rápido, Enter abre, e edita.</p>
        </div>
        <CreateMemberModal />
      </div>

      <DataTable
        tableId="alunos"
        basePath="/admin/alunos"
        columns={[
          { id: "aluno", label: "Aluno", sortable: true, width: 220 },
          { id: "status", label: "Status" },
          { id: "tags", label: "Tags" },
          { id: "objetivo", label: "Objetivo", defaultHidden: true },
          { id: "estilo", label: "Estilo" },
          { id: "progresso", label: "Progresso" },
          { id: "tokens", label: "Tokens", align: "right" },
          { id: "gasto", label: "Total gasto", align: "right" },
          { id: "atividade", label: "Última atividade", sortable: true },
          { id: "cadastro", label: "Cadastro", sortable: true },
        ]}
        rows={tableRows}
        total={total}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol === "aluno" ? "name" : params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por nome ou e-mail…  ( / )"
        facets={[
          {
            id: "acesso",
            label: "Acesso",
            options: [
              { value: "com", label: "Com acesso ativo" },
              { value: "sem", label: "Sem acesso" },
              { value: "vencendo", label: "Vencendo em 7 dias" },
            ],
            selected: params.filters.acesso ?? [],
          },
          {
            id: "onboarding",
            label: "Onboarding",
            options: [
              { value: "completo", label: "Completo" },
              { value: "incompleto", label: "Incompleto" },
            ],
            selected: params.filters.onboarding ?? [],
          },
          {
            id: "atividade",
            label: "Atividade",
            options: [
              { value: "ativo7", label: "Ativos (7 dias)" },
              { value: "inativo30", label: "Inativos (30+ dias)" },
              { value: "nunca", label: "Nunca acessaram" },
            ],
            selected: params.filters.atividade ?? [],
          },
          {
            id: "tokens",
            label: "Tokens",
            options: [
              { value: "zerado", label: "Saldo zerado" },
              { value: "com", label: "Com saldo" },
            ],
            selected: params.filters.tokens ?? [],
          },
          {
            id: "tag",
            label: "Tag",
            options: catalog.map((t) => ({ value: t.name, label: t.name })),
            selected: params.filters.tag ?? [],
          },
          {
            id: "estilo",
            label: "Estilo",
            options: Object.entries(STYLES).map(([value, label]) => ({ value, label })),
            selected: params.filters.estilo ?? [],
          },
          {
            id: "admin",
            label: "Admin",
            options: [
              { value: "sim", label: "Somente admins" },
              { value: "nao", label: "Somente alunos" },
            ],
            selected: params.filters.admin ?? [],
          },
        ]}
        bulkActions={[
          { id: "liberar_base", label: "Liberar acesso base" },
          { id: "tokens_10", label: "+10 tokens" },
        ]}
        onBulk={bulkStudentsAction}
        csvAction={csvStudentsAction}
        savedViews={viewsRes.data ?? []}
        emptyTitle="Nenhum aluno encontrado."
      />
    </div>
  );
}
