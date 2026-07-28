import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseListParams, type SearchParams } from "@/lib/admin/list";
import { fetchSales } from "@/lib/admin/queries/sales";
import { getPeriod } from "@/lib/admin/period-server";
import { getSetting, GATEWAY_DEFAULTS, type GatewaySettings } from "@/lib/admin/settings";
import { brl, dateTime, num } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { InlineText } from "@/components/admin/ui/inline-edit";
import { ManualSaleModal } from "@/components/admin/revenue/manual-sale-modal";
import { SaleActions } from "@/components/admin/revenue/sale-actions";
import { bulkSalesAction, csvSalesAction, updateSaleFieldAction } from "@/app/actions/admin/revenue";

export const dynamic = "force-dynamic";

function statusBadge(status: string, isTest?: boolean) {
  return (
    <span className="flex items-center gap-1.5">
      {status === "approved" ? (
        <Badge variant="success">aprovada</Badge>
      ) : status === "refunded" || status === "purchase_refunded" ? (
        <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">reembolsada</Badge>
      ) : status === "chargeback" ? (
        <Badge className="border-danger/30 bg-danger/10 text-danger">chargeback</Badge>
      ) : (
        <Badge>{status}</Badge>
      )}
      {isTest && <Badge className="border-[#9a6bff]/30 bg-[#9a6bff]/10 text-[#9a6bff]">teste</Badge>}
    </span>
  );
}

export default async function TransacoesPage(props: { searchParams: Promise<SearchParams> }) {
  const { profile } = await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const period = await getPeriod();
  const db = createAdminClient();

  const [{ rows, total }, gateway, viewsRes, periodSales] = await Promise.all([
    fetchSales(params),
    getSetting<GatewaySettings>("gateway", GATEWAY_DEFAULTS),
    db.from("admin_saved_views").select("id, name, params").eq("user_id", profile.user_id).eq("page", "/admin/receita/transacoes"),
    db.from("sales")
      .select("amount_cents, gateway_fee_cents, status, is_test")
      .gte("created_at", period.from.toISOString())
      .lt("created_at", period.to.toISOString())
      .limit(20000),
  ]);

  const real = (periodSales.data ?? []).filter((s) => !s.is_test);
  const approved = real.filter((s) => s.status === "approved");
  const bruta = approved.reduce((a, s) => a + s.amount_cents, 0);
  const taxas = approved.reduce((a, s) => a + (s.gateway_fee_cents || 0), 0);
  const reembolsos = real.filter((s) => s.status !== "approved").reduce((a, s) => a + s.amount_cents, 0);

  const tableRows: TableRow[] = rows.map((r) => {
    const liquido = r.amount_cents - (r.gateway_fee_cents || 0);
    return {
      id: r.id,
      title: `${r.name ?? r.email} — ${brl(r.amount_cents)}`,
      subtitle: r.email,
      meta: (
        <span className="flex items-center gap-2">
          {statusBadge(r.status, r.is_test)}
          <span>{dateTime(r.created_at)}</span>
        </span>
      ),
      cells: {
        data: <span className="whitespace-nowrap tabular-nums text-muted">{dateTime(r.created_at)}</span>,
        aluno: (
          <span className="min-w-0">
            <span className="block max-w-[180px] truncate font-medium text-foreground">{r.name ?? "—"}</span>
            <span className="block max-w-[180px] truncate text-[11px] text-muted-2">{r.email}</span>
          </span>
        ),
        valor: <span className="font-semibold tabular-nums text-foreground">{brl(r.amount_cents)}</span>,
        taxa: (
          <InlineText
            value={r.gateway_fee_cents ? (r.gateway_fee_cents / 100).toFixed(2).replace(".", ",") : ""}
            placeholder="0,00"
            action={updateSaleFieldAction.bind(null, r.id, "gateway_fee")}
            className="tabular-nums"
          />
        ),
        liquido: <span className="tabular-nums text-muted">{brl(liquido)}</span>,
        status: statusBadge(r.status, r.is_test),
        metodo: r.payment_method ?? undefined,
        produto: (
          <InlineText
            value={r.offer_name ?? ""}
            placeholder="—"
            action={updateSaleFieldAction.bind(null, r.id, "offer_name")}
          />
        ),
        origem: r.cakto_id ? (
          <span className="font-mono text-[11px] text-muted-2" title={r.cakto_id}>cakto</span>
        ) : (
          <span className="text-[11px] text-muted-2">manual</span>
        ),
      },
      drawerTitle: r.name ?? r.email,
      drawerSubtitle: `${brl(r.amount_cents)} · ${dateTime(r.created_at)}`,
      editHref: r.user_id ? `/admin/alunos/${r.user_id}` : undefined,
      drawer: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Valor bruto", value: brl(r.amount_cents) },
              { label: "Taxa de gateway", value: brl(r.gateway_fee_cents || 0) },
              { label: "Líquido", value: brl(liquido) },
              { label: "Método", value: r.payment_method ?? "—" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">{kpi.label}</p>
                <p className="mt-1 text-base font-bold tabular-nums text-foreground">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-muted">
            <p>Status: {statusBadge(r.status, r.is_test)}</p>
            {r.offer_name && <p>Oferta: {r.offer_name}</p>}
            {r.entitlement && <p>Acesso liberado: {r.entitlement}</p>}
            {r.cakto_id && <p className="font-mono text-[11px]">Cakto: {r.cakto_id}</p>}
            {r.refunded_at && <p>Reembolsada em {dateTime(r.refunded_at)}</p>}
          </div>
          <SaleActions saleId={r.id} status={r.status} isTest={r.is_test} />
          {r.user_id && (
            <Link
              href={`/admin/alunos/${r.user_id}`}
              className="block rounded-lg border border-border bg-surface-2 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-border-strong"
            >
              Ver perfil do aluno →
            </Link>
          )}
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Transações</h1>
          <p className="mt-0.5 text-xs text-muted">
            {period.label}: <strong className="text-foreground">{brl(bruta)}</strong> bruto · {brl(taxas)} em taxas ·{" "}
            {brl(reembolsos)} reembolsado · líquido <strong className="text-foreground">{brl(bruta - taxas - reembolsos)}</strong> · {num(approved.length)} vendas
          </p>
        </div>
        <ManualSaleModal defaultFeePercent={gateway.fee_percent} />
      </div>

      <DataTable
        tableId="transacoes"
        basePath="/admin/receita/transacoes"
        columns={[
          { id: "data", label: "Data", sortable: true },
          { id: "aluno", label: "Aluno", width: 200 },
          { id: "valor", label: "Valor", sortable: true, align: "right" },
          { id: "taxa", label: "Taxa", align: "right" },
          { id: "liquido", label: "Líquido", align: "right" },
          { id: "status", label: "Status" },
          { id: "metodo", label: "Método", defaultHidden: true },
          { id: "produto", label: "Produto/Oferta" },
          { id: "origem", label: "Origem", defaultHidden: true },
        ]}
        rows={tableRows}
        total={total}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol === "valor" ? "amount_cents" : params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por nome, e-mail ou ID Cakto…  ( / )"
        facets={[
          {
            id: "status",
            label: "Status",
            options: [
              { value: "approved", label: "Aprovada" },
              { value: "refunded", label: "Reembolsada" },
              { value: "chargeback", label: "Chargeback" },
            ],
            selected: params.filters.status ?? [],
          },
          {
            id: "metodo",
            label: "Método",
            options: [
              { value: "pix", label: "Pix" },
              { value: "credit_card", label: "Cartão" },
              { value: "boleto", label: "Boleto" },
              { value: "manual", label: "Manual" },
            ],
            selected: params.filters.metodo ?? [],
          },
          {
            id: "origem",
            label: "Origem",
            options: [
              { value: "cakto", label: "Cakto (webhook)" },
              { value: "manual", label: "Lançada manualmente" },
            ],
            selected: params.filters.origem ?? [],
          },
          {
            id: "data",
            label: "Data",
            options: [
              { value: "7", label: "Últimos 7 dias" },
              { value: "30", label: "Últimos 30 dias" },
              { value: "90", label: "Últimos 90 dias" },
            ],
            selected: params.filters.data ?? [],
          },
          {
            id: "teste",
            label: "Testes",
            options: [
              { value: "excluir", label: "Ocultar testes (padrão)" },
              { value: "incluir", label: "Incluir testes" },
              { value: "somente", label: "Somente testes" },
            ],
            selected: params.filters.teste ?? [],
          },
        ]}
        bulkActions={[
          { id: "marcar_teste", label: "Marcar como teste", undoActionId: "desmarcar_teste" },
          { id: "desmarcar_teste", label: "Tirar do modo teste" },
        ]}
        onBulk={bulkSalesAction}
        csvAction={csvSalesAction}
        savedViews={viewsRes.data ?? []}
        emptyTitle="Nenhuma transação encontrada."
        emptyHint="Vendas da Cakto entram sozinhas pelo webhook. Você também pode lançar uma venda manual."
      />
    </div>
  );
}
