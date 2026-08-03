import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, parseListParams, type SearchParams } from "@/lib/admin/list";
import { dayKey, eachDay } from "@/lib/admin/period";
import { getPeriod } from "@/lib/admin/period-server";
import { dateShort, num } from "@/lib/admin/format";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { InlineText } from "@/components/admin/ui/inline-edit";
import { Sparkline } from "@/components/admin/ui/charts";
import { CopyButton } from "@/components/admin/copy-button";
import { NewLinkModal } from "@/components/admin/growth/new-link-form";
import { bulkLinksAction, updateLinkFieldAction } from "@/app/actions/admin/links";

export const dynamic = "force-dynamic";

export default async function LinksPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const period = await getPeriod();
  const db = createAdminClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.manualpraticodooutfit.com.br").replace(/\/$/, "");

  let query = db.from("tracking_links").select("*", { count: "exact" }).is("deleted_at", null);
  if (params.q) query = query.or(`slug.ilike.${ilikePattern(params.q)},description.ilike.${ilikePattern(params.q)}`);
  const sortCol = params.sortCol === "clicks_count" ? "clicks_count" : "created_at";
  query = query.order(sortCol, { ascending: params.sortAsc }).range(params.from, params.to);

  const { data: links, count } = await query;
  const rows = links ?? [];

  const ids = rows.map((r) => r.id);
  const { data: clicks } = ids.length
    ? await db
        .from("tracking_link_clicks")
        .select("link_id, created_at")
        .in("link_id", ids)
        .gte("created_at", period.from.toISOString())
        .limit(50000)
    : { data: [] };

  const days = eachDay(period);
  const seriesByLink = new Map<string, Record<string, number>>();
  const periodTotal = new Map<string, number>();
  for (const c of clicks ?? []) {
    const k = dayKey(c.created_at);
    const series = seriesByLink.get(c.link_id) ?? Object.fromEntries(days.map((d) => [d, 0]));
    if (k in series) series[k] += 1;
    seriesByLink.set(c.link_id, series);
    periodTotal.set(c.link_id, (periodTotal.get(c.link_id) ?? 0) + 1);
  }

  const tableRows: TableRow[] = rows.map((r) => {
    const url = `${siteUrl}/l/${r.slug}`;
    const series = seriesByLink.get(r.id);
    return {
      id: r.id,
      title: `/l/${r.slug}`,
      subtitle: r.description ?? r.destination_url,
      meta: `${num(r.clicks_count)} cliques no total`,
      cells: {
        link: (
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[12px] font-semibold text-foreground">/l/{r.slug}</span>
            <span onClick={(e) => e.stopPropagation()}><CopyButton text={url} label="" /></span>
          </span>
        ),
        destino: (
          <InlineText
            value={r.destination_url}
            action={updateLinkFieldAction.bind(null, r.id, "destination_url")}
            className="max-w-[240px] text-muted"
          />
        ),
        descricao: (
          <InlineText
            value={r.description ?? ""}
            placeholder="sem descrição"
            action={updateLinkFieldAction.bind(null, r.id, "description")}
            className="max-w-[180px]"
          />
        ),
        periodo: (
          <span className="flex items-center gap-2">
            <span className="w-8 text-right font-semibold tabular-nums text-foreground">{num(periodTotal.get(r.id) ?? 0)}</span>
            {series && <Sparkline points={days.map((d) => series[d])} width={72} height={20} />}
          </span>
        ),
        total: <span className="tabular-nums text-muted">{num(r.clicks_count)}</span>,
        criado: dateShort(r.created_at),
      },
      drawerTitle: `/l/${r.slug}`,
      drawerSubtitle: r.description ?? undefined,
      drawer: (
        <div className="space-y-3 text-sm text-muted">
          <p className="break-all rounded-lg border border-border bg-surface-2 p-2.5 font-mono text-[11px]">{url}</p>
          <p className="break-all text-xs">Destino: {r.destination_url}</p>
          <p className="text-xs">
            <strong className="text-foreground">{num(periodTotal.get(r.id) ?? 0)}</strong> cliques em {period.label.toLowerCase()} ·{" "}
            <strong className="text-foreground">{num(r.clicks_count)}</strong> no total
          </p>
          {series && <Sparkline points={days.map((d) => series[d])} width={320} height={48} />}
          <CopyButton text={url} label="Copiar link" />
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Links & UTMs</h1>
          <p className="mt-0.5 text-xs text-muted">
            {num(count ?? 0)} links ativos. Cada clique é registrado com data — a coluna “{period.label}” usa o período global.
          </p>
        </div>
        <NewLinkModal siteUrl={siteUrl} />
      </div>

      <DataTable
        tableId="links"
        basePath="/admin/crescimento/links"
        columns={[
          { id: "link", label: "Link", width: 180 },
          { id: "destino", label: "Destino" },
          { id: "descricao", label: "Descrição", defaultHidden: true },
          { id: "periodo", label: `Cliques (${period.label.toLowerCase()})` },
          { id: "total", label: "Total", sortable: true, align: "right" },
          { id: "criado", label: "Criado", sortable: true },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por slug ou descrição…  ( / )"
        bulkActions={[
          {
            id: "excluir",
            label: "Desativar",
            danger: true,
            undoActionId: "restaurar",
            confirm: {
              title: "Desativar links?",
              message: "{n} links param de redirecionar (quem clicar cai na home). O histórico de cliques fica guardado e dá para reativar na Lixeira.",
              confirmLabel: "Desativar",
            },
          },
        ]}
        onBulk={bulkLinksAction}
        emptyTitle="Nenhum link ainda."
        emptyHint="Crie links curtos /l/slug para bio, stories e anúncios — cada clique é contado por dia."
      />
    </div>
  );
}
