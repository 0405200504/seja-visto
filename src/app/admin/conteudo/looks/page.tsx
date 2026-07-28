import Link from "next/link";
import { Heart, ImageOff, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseListParams, type SearchParams } from "@/lib/admin/list";
import { fetchLooks } from "@/lib/admin/queries/looks";
import { dateShort, num } from "@/lib/admin/format";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS, COLOR_SWATCHES } from "@/lib/constants";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { InlineText, InlineSelect } from "@/components/admin/ui/inline-edit";
import { bulkLooksAction, csvLooksAction, updateLookFieldAction } from "@/app/actions/admin/content";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function options(map: Record<string, string>) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export default async function LooksPage(props: { searchParams: Promise<SearchParams> }) {
  const { profile } = await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  const [{ rows, total }, viewsRes] = await Promise.all([
    fetchLooks(params),
    db.from("admin_saved_views").select("id, name, params").eq("user_id", profile.user_id).eq("page", "/admin/conteudo/looks"),
  ]);

  const tableRows: TableRow[] = rows.map((r) => ({
    id: r.id,
    editHref: `/admin/conteudo/looks/${r.id}`,
    title: r.title,
    subtitle: `${STYLES[r.style] ?? r.style} · ${OCCASIONS[r.occasion] ?? r.occasion}`,
    meta: (
      <span className="flex items-center gap-2">
        {!r.image_url && <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">sem imagem</Badge>}
        <span>{num(r.likes)} curtidas</span>
      </span>
    ),
    cells: {
      look: (
        <span className="flex items-center gap-2.5">
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image_url} alt="" className="size-9 shrink-0 rounded-lg border border-border object-cover" loading="lazy" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border-strong text-muted-2">
              <ImageOff className="size-4" />
            </span>
          )}
          <span className="min-w-0">
            <InlineText
              value={r.title}
              action={updateLookFieldAction.bind(null, r.id, "title")}
              className="max-w-[230px] font-medium text-foreground"
            />
            <span className="block pl-1 text-[11px] text-muted-2">{(r.pieces ?? []).length} peças</span>
          </span>
        </span>
      ),
      estilo: <InlineSelect value={r.style} options={options(STYLES)} action={updateLookFieldAction.bind(null, r.id, "style")} />,
      ocasiao: <InlineSelect value={r.occasion} options={options(OCCASIONS)} action={updateLookFieldAction.bind(null, r.id, "occasion")} />,
      clima: <InlineSelect value={r.climate} options={options(CLIMATES)} action={updateLookFieldAction.bind(null, r.id, "climate")} />,
      nivel: <InlineSelect value={r.level} options={options(LEVELS)} action={updateLookFieldAction.bind(null, r.id, "level")} />,
      cor: (
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-border" style={{ backgroundColor: COLOR_SWATCHES[r.base_color] }} />
          <InlineSelect value={r.base_color} options={options(BASE_COLORS)} action={updateLookFieldAction.bind(null, r.id, "base_color")} />
        </span>
      ),
      engajamento: (
        <span className="flex items-center gap-1 tabular-nums text-muted">
          <Heart className="size-3 text-muted-2" /> {num(r.likes)}
          <span className="ml-1 text-[11px] text-muted-2">({num(r.favorites)} favs)</span>
        </span>
      ),
      criado: dateShort(r.created_at),
    },
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Looks</h1>
          <p className="mt-0.5 text-xs text-muted">
            {num(total)} looks — edite título, estilo e filtros direto na linha, sem sair da lista.
          </p>
        </div>
        <Link
          href="/admin/conteudo/looks/novo"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-3.5" /> Novo look
        </Link>
      </div>

      <DataTable
        tableId="looks"
        basePath="/admin/conteudo/looks"
        columns={[
          { id: "look", label: "Look", sortable: true, width: 280 },
          { id: "estilo", label: "Estilo" },
          { id: "ocasiao", label: "Ocasião" },
          { id: "clima", label: "Clima", defaultHidden: true },
          { id: "nivel", label: "Nível" },
          { id: "cor", label: "Cor base", defaultHidden: true },
          { id: "engajamento", label: "Engajamento" },
          { id: "criado", label: "Criado", sortable: true },
        ]}
        rows={tableRows}
        total={total}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol === "look" ? "title" : params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar look por título…  ( / )"
        facets={[
          { id: "estilo", label: "Estilo", options: options(STYLES), selected: params.filters.estilo ?? [] },
          { id: "ocasiao", label: "Ocasião", options: options(OCCASIONS), selected: params.filters.ocasiao ?? [] },
          { id: "clima", label: "Clima", options: options(CLIMATES), selected: params.filters.clima ?? [] },
          { id: "nivel", label: "Nível", options: options(LEVELS), selected: params.filters.nivel ?? [] },
          { id: "cor", label: "Cor base", options: options(BASE_COLORS), selected: params.filters.cor ?? [] },
          {
            id: "imagem",
            label: "Imagem",
            options: [
              { value: "sem", label: "Sem imagem" },
              { value: "com", label: "Com imagem" },
            ],
            selected: params.filters.imagem ?? [],
          },
        ]}
        bulkActions={[
          { id: "duplicar", label: "Duplicar" },
          {
            id: "excluir",
            label: "Excluir",
            danger: true,
            undoActionId: "restaurar",
            confirm: {
              title: "Mover looks para a lixeira?",
              message: "{n} looks somem do app dos alunos na hora. Ficam 30 dias na lixeira para restaurar.",
              confirmLabel: "Mover para a lixeira",
            },
          },
        ]}
        onBulk={bulkLooksAction}
        csvAction={csvLooksAction}
        savedViews={viewsRes.data ?? []}
        emptyTitle="Nenhum look com esses filtros."
        createHref="/admin/conteudo/looks/novo"
        createLabel="Criar look"
      />
    </div>
  );
}
