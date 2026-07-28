import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseListParams, type SearchParams } from "@/lib/admin/list";
import { fetchSales } from "@/lib/admin/queries/sales";
import { brl, dateTime, num, pct } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { SaleActions } from "@/components/admin/revenue/sale-actions";
import { csvSalesAction } from "@/app/actions/admin/revenue";

export const dynamic = "force-dynamic";

const REFUND_STATUSES = ["refunded", "chargeback", "purchase_refunded"];

export default async function ReembolsosPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  const [{ rows, total }, allRes] = await Promise.all([
    fetchSales(params, { onlyStatuses: REFUND_STATUSES }),
    db.from("sales").select("status, amount_cents, is_test").limit(50000),
  ]);

  const real = (allRes.data ?? []).filter((s) => !s.is_test);
  const refunded = real.filter((s) => REFUND_STATUSES.includes(s.status));
  const totalCount = real.length;
  const refundRate = totalCount ? (refunded.length / totalCount) * 100 : 0;
  const refundValue = refunded.reduce((a, s) => a + s.amount_cents, 0);

  const tableRows: TableRow[] = rows.map((r) => ({
    id: r.id,
    editHref: r.user_id ? `/admin/alunos/${r.user_id}` : undefined,
    title: `${r.name ?? r.email} — ${brl(r.amount_cents)}`,
    subtitle: r.email,
    meta: dateTime(r.refunded_at ?? r.created_at),
    cells: {
      data: <span className="whitespace-nowrap tabular-nums text-muted">{dateTime(r.created_at)}</span>,
      aluno: (
        <span className="min-w-0">
          <span className="block max-w-[180px] truncate font-medium text-foreground">{r.name ?? "—"}</span>
          <span className="block max-w-[180px] truncate text-[11px] text-muted-2">{r.email}</span>
        </span>
      ),
      valor: <span className="font-semibold tabular-nums text-foreground">{brl(r.amount_cents)}</span>,
      tipo:
        r.status === "chargeback" ? (
          <Badge className="border-danger/30 bg-danger/10 text-danger">chargeback</Badge>
        ) : (
          <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">reembolso</Badge>
        ),
      quando: r.refunded_at ? dateTime(r.refunded_at) : "—",
      produto: r.offer_name ?? undefined,
    },
    drawerTitle: r.name ?? r.email,
    drawerSubtitle: `${brl(r.amount_cents)} · ${r.status}`,
    drawer: (
      <div className="space-y-4 text-sm text-muted">
        <p>
          Compra em {dateTime(r.created_at)}
          {r.refunded_at ? ` · revertida em ${dateTime(r.refunded_at)}` : ""}.
        </p>
        {r.entitlement && <p>Acesso da compra: {r.entitlement} — confira se precisa revogar no perfil do aluno.</p>}
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
  }));

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Reembolsos & Chargebacks</h1>
        <p className="mt-0.5 text-xs text-muted">
          Taxa histórica: <strong className="text-foreground">{pct(refundRate)}</strong> ({num(refunded.length)} de {num(totalCount)} vendas) ·{" "}
          <strong className="text-foreground">{brl(refundValue)}</strong> devolvidos.
        </p>
      </div>

      <DataTable
        tableId="reembolsos"
        basePath="/admin/receita/reembolsos"
        columns={[
          { id: "data", label: "Compra em", sortable: true },
          { id: "aluno", label: "Aluno", width: 200 },
          { id: "valor", label: "Valor", sortable: true, align: "right" },
          { id: "tipo", label: "Tipo" },
          { id: "quando", label: "Revertida em" },
          { id: "produto", label: "Produto" },
        ]}
        rows={tableRows}
        total={total}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por nome ou e-mail…  ( / )"
        csvAction={csvSalesAction}
        emptyTitle="Nenhum reembolso ou chargeback. 🎉"
        emptyHint="Quando a Cakto enviar um evento de reembolso, ele aparece aqui automaticamente."
      />
    </div>
  );
}
