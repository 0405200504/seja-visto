import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, parseListParams, type SearchParams } from "@/lib/admin/list";
import { dateTime, num, relTime } from "@/lib/admin/format";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ENTITY_LABELS: Record<string, string> = {
  aluno: "Aluno",
  venda: "Venda",
  look: "Look",
  peca: "Peça",
  modulo: "Módulo",
  aula: "Aula",
  link: "Link",
  fit: "Fit",
  produto: "Produto",
  acesso: "Acesso",
  config: "Configuração",
  comentario: "Comentário",
};

export default async function AuditoriaPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  let query = db.from("audit_log").select("*", { count: "exact" });
  if (params.q) {
    const like = ilikePattern(params.q);
    query = query.or(`actor_email.ilike.${like},entity_label.ilike.${like},action.ilike.${like}`);
  }
  if (params.filters.tipo?.length) {
    const tipos = params.filters.tipo.flatMap((t) => (t === "conteudo" ? ["conteudo:guia", "conteudo:estilo", "conteudo:glossario", "conteudo:plano", "conteudo:bonus", "conteudo:quiz"] : [t]));
    query = query.in("entity_type", tipos);
  }
  query = query.order("created_at", { ascending: params.sortAsc && params.sortCol === "created_at" }).range(params.from, params.to);

  const { data, count } = await query;

  const tableRows: TableRow[] = (data ?? []).map((r) => ({
    id: r.id,
    title: r.action,
    subtitle: r.entity_label ?? r.entity_id ?? "",
    meta: `${r.actor_email ?? "sistema"} · ${relTime(r.created_at)}`,
    cells: {
      quando: <span className="whitespace-nowrap tabular-nums text-muted">{dateTime(r.created_at)}</span>,
      quem: <span className="text-muted">{r.actor_email ?? "sistema"}</span>,
      acao: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground">{r.action}</code>,
      tipo: <Badge>{ENTITY_LABELS[(r.entity_type ?? "").split(":")[0]] ?? r.entity_type}</Badge>,
      registro: <span className="max-w-[220px] truncate text-muted">{r.entity_label ?? r.entity_id ?? "—"}</span>,
      ip: <span className="font-mono text-[11px] text-muted-2">{r.ip ?? "—"}</span>,
    },
    drawerTitle: r.action,
    drawerSubtitle: `${r.actor_email ?? "sistema"} · ${dateTime(r.created_at)}`,
    drawer: (
      <div className="space-y-3 text-xs">
        <p className="text-muted">
          Registro: <strong className="text-foreground">{r.entity_label ?? r.entity_id ?? "—"}</strong>
          {r.ip && <span className="ml-2 font-mono text-muted-2">IP {r.ip}</span>}
        </p>
        {r.before != null && (
          <div>
            <p className="mb-1 font-semibold text-muted">Antes</p>
            <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted">
              {JSON.stringify(r.before, null, 2)}
            </pre>
          </div>
        )}
        {r.after != null && (
          <div>
            <p className="mb-1 font-semibold text-muted">Depois</p>
            <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted">
              {JSON.stringify(r.after, null, 2)}
            </pre>
          </div>
        )}
        {r.before == null && r.after == null && <p className="text-muted-2">Sem detalhes de antes/depois.</p>}
      </div>
    ),
  }));

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Log de auditoria</h1>
        <p className="mt-0.5 text-xs text-muted">
          {num(count ?? 0)} registros — quem fez o quê, quando, de onde, com antes/depois. Nada aqui pode ser editado ou apagado.
        </p>
      </div>

      <DataTable
        tableId="auditoria"
        basePath="/admin/sistema/auditoria"
        columns={[
          { id: "quando", label: "Quando", sortable: true },
          { id: "quem", label: "Quem" },
          { id: "acao", label: "Ação" },
          { id: "tipo", label: "Tipo" },
          { id: "registro", label: "Registro" },
          { id: "ip", label: "IP", defaultHidden: true },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`created_at.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por ação, registro ou admin…  ( / )"
        facets={[
          {
            id: "tipo",
            label: "Tipo",
            options: [
              { value: "aluno", label: "Alunos" },
              { value: "venda", label: "Vendas" },
              { value: "look", label: "Looks" },
              { value: "peca", label: "Peças" },
              { value: "modulo", label: "Módulos" },
              { value: "aula", label: "Aulas" },
              { value: "fit", label: "Comunidade" },
              { value: "link", label: "Links" },
              { value: "conteudo", label: "Conteúdo estático" },
              { value: "config", label: "Configurações" },
            ],
            selected: params.filters.tipo ?? [],
          },
        ]}
        emptyTitle="Nenhuma ação registrada ainda."
        emptyHint="Toda mutação feita neste admin passa a ser registrada aqui automaticamente."
      />
    </div>
  );
}
