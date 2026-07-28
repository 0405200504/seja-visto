import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, parseListParams, type SearchParams } from "@/lib/admin/list";
import { dateShort, num } from "@/lib/admin/format";
import { WARDROBE_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { InlineText, InlineSelect } from "@/components/admin/ui/inline-edit";
import { bulkWardrobeAction, updateWardrobeFieldAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

function options(map: Record<string, string>) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export default async function PecasPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  let query = db
    .from("wardrobe_items")
    .select("*", { count: "exact" })
    .is("deleted_at", null);
  if (params.q) query = query.ilike("name", ilikePattern(params.q));
  if (params.filters.categoria?.length) query = query.in("category", params.filters.categoria);
  if (params.filters.prioridade?.length) query = query.in("priority", params.filters.prioridade);

  const sortCol = params.sortCol === "name" ? "name" : "created_at";
  const { data, count } = await query.order(sortCol, { ascending: params.sortAsc }).range(params.from, params.to);
  const rows = data ?? [];

  // quantos alunos têm/querem cada peça
  const ids = rows.map((r) => r.id);
  const { data: userWardrobe } = ids.length
    ? await db.from("user_wardrobe").select("wardrobe_item_id, status").in("wardrobe_item_id", ids)
    : { data: [] };
  const haveCount = new Map<string, number>();
  const wantCount = new Map<string, number>();
  for (const uw of userWardrobe ?? []) {
    const map = uw.status === "tenho" ? haveCount : wantCount;
    map.set(uw.wardrobe_item_id, (map.get(uw.wardrobe_item_id) ?? 0) + 1);
  }

  const tableRows: TableRow[] = rows.map((r) => ({
    id: r.id,
    editHref: `/admin/conteudo/pecas/${r.id}`,
    title: r.name,
    subtitle: `${WARDROBE_CATEGORIES[r.category] ?? r.category} · ${PRIORITIES[r.priority] ?? r.priority}`,
    cells: {
      peca: (
        <span className="flex items-center gap-2.5">
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image_url} alt="" className="size-9 shrink-0 rounded-lg border border-border object-cover" loading="lazy" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border-strong text-muted-2">
              <ImageOff className="size-4" />
            </span>
          )}
          <InlineText
            value={r.name}
            action={updateWardrobeFieldAction.bind(null, r.id, "name")}
            className="max-w-[220px] font-medium text-foreground"
          />
        </span>
      ),
      categoria: (
        <InlineSelect value={r.category} options={options(WARDROBE_CATEGORIES)} action={updateWardrobeFieldAction.bind(null, r.id, "category")} />
      ),
      prioridade: (
        <InlineSelect value={r.priority} options={options(PRIORITIES)} action={updateWardrobeFieldAction.bind(null, r.id, "priority")} />
      ),
      adocao: (
        <span className="tabular-nums text-muted">
          {num(haveCount.get(r.id) ?? 0)} têm · {num(wantCount.get(r.id) ?? 0)} querem
        </span>
      ),
      criado: dateShort(r.created_at),
    },
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Peças do guarda-roupa</h1>
          <p className="mt-0.5 text-xs text-muted">{num(count ?? 0)} peças recomendadas no app.</p>
        </div>
        <Link
          href="/admin/conteudo/pecas/novo"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-3.5" /> Nova peça
        </Link>
      </div>

      <DataTable
        tableId="pecas"
        basePath="/admin/conteudo/pecas"
        columns={[
          { id: "peca", label: "Peça", sortable: true, width: 260 },
          { id: "categoria", label: "Categoria" },
          { id: "prioridade", label: "Prioridade" },
          { id: "adocao", label: "Adoção pelos alunos" },
          { id: "criado", label: "Criada", sortable: true },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol === "peca" ? "name" : params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar peça…  ( / )"
        facets={[
          { id: "categoria", label: "Categoria", options: options(WARDROBE_CATEGORIES), selected: params.filters.categoria ?? [] },
          { id: "prioridade", label: "Prioridade", options: options(PRIORITIES), selected: params.filters.prioridade ?? [] },
        ]}
        bulkActions={[
          {
            id: "excluir",
            label: "Excluir",
            danger: true,
            undoActionId: "restaurar",
            confirm: {
              title: "Mover peças para a lixeira?",
              message: "{n} peças somem do guarda-roupa dos alunos na hora. Ficam 30 dias na lixeira.",
              confirmLabel: "Mover para a lixeira",
            },
          },
        ]}
        onBulk={bulkWardrobeAction}
        emptyTitle="Nenhuma peça com esses filtros."
        createHref="/admin/conteudo/pecas/novo"
        createLabel="Criar peça"
      />
    </div>
  );
}
