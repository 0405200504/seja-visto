import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, parseListParams, type SearchParams } from "@/lib/admin/list";
import { dateTime, num, relTime } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { bulkFitsAction } from "@/app/actions/admin/community";
import { signFitImageUrls } from "@/lib/community";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "approved") return <Badge variant="success">aprovado</Badge>;
  if (status === "rejected") return <Badge className="border-danger/30 bg-danger/10 text-danger">recusado</Badge>;
  return <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">pendente</Badge>;
}

export default async function ComunidadePage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  let query = db.from("community_fits").select("*", { count: "exact" });
  if (params.q) query = query.or(`author_name.ilike.${ilikePattern(params.q)},caption.ilike.${ilikePattern(params.q)}`);
  if (params.filters.status?.length) query = query.in("status", params.filters.status);
  query = query.order("created_at", { ascending: params.sortAsc && params.sortCol === "created_at" ? true : false }).range(params.from, params.to);

  const { data, count } = await query;
  const fits = data ?? [];

  // Bucket privado: assina as fotos em lote (o client de admin ignora RLS).
  const imagens = await signFitImageUrls(db, fits.map((f) => f.image_path));

  const ids = fits.map((f) => f.id);
  const [reactionsRes, commentsRes, statusCounts] = await Promise.all([
    ids.length ? db.from("fit_reactions").select("fit_id, kind").in("fit_id", ids) : Promise.resolve({ data: [] as { fit_id: string | null; kind: string }[] }),
    ids.length ? db.from("fit_comments").select("fit_id").in("fit_id", ids) : Promise.resolve({ data: [] as { fit_id: string | null }[] }),
    Promise.all(
      (["pending", "approved", "rejected"] as const).map(async (s) => {
        const { count: c } = await db.from("community_fits").select("*", { count: "exact", head: true }).eq("status", s);
        return [s, c ?? 0] as const;
      })
    ),
  ]);

  const likes = new Map<string, number>();
  for (const r of reactionsRes.data ?? []) {
    if (r.kind === "like" && r.fit_id) likes.set(r.fit_id, (likes.get(r.fit_id) ?? 0) + 1);
  }
  const comments = new Map<string, number>();
  for (const c of commentsRes.data ?? []) {
    if (c.fit_id) comments.set(c.fit_id, (comments.get(c.fit_id) ?? 0) + 1);
  }
  const countByStatus = new Map(statusCounts);

  const tableRows: TableRow[] = fits.map((f) => ({
    id: f.id,
    title: f.author_name ?? "Aluno",
    subtitle: f.caption ?? "sem legenda",
    meta: (
      <span className="flex items-center gap-2">
        {statusBadge(f.status)}
        <span>{relTime(f.created_at)}</span>
      </span>
    ),
    cells: {
      fit: (
        <span className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagens.get(f.image_path) ?? ""} alt="" className="h-12 w-9 shrink-0 rounded-lg border border-border object-cover" loading="lazy" />
          <span className="min-w-0">
            <span className="block max-w-[180px] truncate font-medium text-foreground">{f.author_name ?? "Aluno"}</span>
            <span className="block max-w-[180px] truncate text-[11px] text-muted-2">{f.caption ?? "sem legenda"}</span>
          </span>
        </span>
      ),
      status: statusBadge(f.status),
      engajamento: (
        <span className="tabular-nums text-muted">
          {num(likes.get(f.id) ?? 0)} curtidas · {num(comments.get(f.id) ?? 0)} comentários
        </span>
      ),
      enviado: dateTime(f.created_at),
    },
    drawerTitle: f.author_name ?? "Aluno",
    drawerSubtitle: `Enviado ${relTime(f.created_at)}`,
    editHref: `/admin/alunos/${f.user_id}`,
    drawer: (
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagens.get(f.image_path) ?? ""} alt={f.caption ?? "Fit da comunidade"} className="max-h-[50vh] w-full rounded-xl border border-border object-contain" />
        {f.caption && <p className="text-sm text-muted">“{f.caption}”</p>}
        <p className="text-xs text-muted-2">
          {statusBadge(f.status)} · {num(likes.get(f.id) ?? 0)} curtidas · {num(comments.get(f.id) ?? 0)} comentários
        </p>
        <Link
          href={`/admin/alunos/${f.user_id}`}
          className="block rounded-lg border border-border bg-surface-2 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-border-strong"
        >
          Ver perfil do aluno →
        </Link>
        <p className="text-[11px] leading-relaxed text-muted-2">
          Use a seleção da lista (ou a tecla x) para aprovar/recusar. Aprovado aparece para todos os
          alunos na aba Comunidade.
        </p>
      </div>
    ),
  }));

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Comunidade (fits)</h1>
        <p className="mt-0.5 text-xs text-muted">
          {num(countByStatus.get("pending") ?? 0)} pendentes · {num(countByStatus.get("approved") ?? 0)} aprovados ·{" "}
          {num(countByStatus.get("rejected") ?? 0)} recusados. Selecione as linhas e aprove em massa.
        </p>
      </div>

      <DataTable
        tableId="comunidade"
        basePath="/admin/comunidade"
        columns={[
          { id: "fit", label: "Fit", width: 240 },
          { id: "status", label: "Status" },
          { id: "engajamento", label: "Engajamento" },
          { id: "enviado", label: "Enviado em", sortable: true },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`created_at.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por autor ou legenda…  ( / )"
        facets={[
          {
            id: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pendentes", count: countByStatus.get("pending") },
              { value: "approved", label: "Aprovados", count: countByStatus.get("approved") },
              { value: "rejected", label: "Recusados", count: countByStatus.get("rejected") },
            ],
            selected: params.filters.status ?? [],
          },
        ]}
        bulkActions={[
          { id: "aprovar", label: "Aprovar", undoActionId: "pendente" },
          { id: "recusar", label: "Recusar", undoActionId: "pendente" },
          {
            id: "excluir",
            label: "Excluir",
            danger: true,
            confirm: {
              title: "Excluir fits definitivamente?",
              message: "{n} fits e as fotos deles são apagados PARA SEMPRE (sem lixeira). Se quiser só tirar do ar, use Recusar.",
              confirmLabel: "Excluir para sempre",
            },
          },
        ]}
        onBulk={bulkFitsAction}
        emptyTitle="Nenhum fit com esses filtros."
        emptyHint="Quando um aluno enviar um look pela aba Comunidade, ele chega aqui para aprovação."
      />
    </div>
  );
}
