import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseListParams, type SearchParams } from "@/lib/admin/list";
import { dateShort, dateTime, num } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableRow } from "@/components/admin/ui/data-table";
import { ExtendEntitlementButton } from "@/components/admin/revenue/entitlement-row-actions";
import { RevokeEntitlementButton } from "@/components/admin/students/revoke-entitlement";
import { BONUSES } from "@/lib/bonuses";

export const dynamic = "force-dynamic";

const BONUS_TITLES = new Map(BONUSES.map((b) => [b.key, b.title]));

function entitlementLabel(key: string): string {
  if (key === "base") return "MPO — acesso principal";
  if (key === "economize-58") return "Pack completo";
  return BONUS_TITLES.get(key) ?? key;
}

export default async function AcessosPage(props: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await props.searchParams;
  const params = parseListParams(sp, { sort: "created_at.desc" });
  const db = createAdminClient();

  let query = db.from("user_entitlements").select("*", { count: "exact" });

  const f = params.filters;
  if (f.produto?.length) {
    if (f.produto.includes("bonus")) {
      const extras = f.produto.filter((p) => p !== "bonus");
      query = extras.length
        ? query.or(`entitlement.in.(${extras.join(",")}),entitlement.not.in.(base,economize-58)`)
        : query.not("entitlement", "in", "(base,economize-58)");
    } else {
      query = query.in("entitlement", f.produto);
    }
  }
  const now = new Date();
  if (f.vencimento?.length === 1) {
    const v = f.vencimento[0];
    if (v === "vitalicio") query = query.is("expires_at", null);
    if (v === "7d") query = query.not("expires_at", "is", null).gt("expires_at", now.toISOString()).lt("expires_at", new Date(now.getTime() + 7 * 86_400_000).toISOString());
    if (v === "30d") query = query.not("expires_at", "is", null).gt("expires_at", now.toISOString()).lt("expires_at", new Date(now.getTime() + 30 * 86_400_000).toISOString());
    if (v === "vencido") query = query.not("expires_at", "is", null).lt("expires_at", now.toISOString());
  }

  const sortCol = params.sortCol === "expires_at" ? "expires_at" : "created_at";
  query = query.order(sortCol, { ascending: params.sortAsc, nullsFirst: false }).range(params.from, params.to);

  const { data: ents, count } = await query;
  const rows = ents ?? [];

  // dados dos alunos (nome/e-mail) + busca por texto aplicada em memória sobre a página
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = ids.length
    ? await db.from("users_profile").select("user_id, name, email").in("user_id", ids)
    : { data: [] };
  const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));

  let visible = rows;
  if (params.q) {
    const q = params.q.toLowerCase();
    visible = rows.filter((r) => {
      const p = profMap.get(r.user_id);
      return (
        r.entitlement.toLowerCase().includes(q) ||
        p?.name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q)
      );
    });
  }

  const tableRows: TableRow[] = visible.map((r) => {
    const p = profMap.get(r.user_id);
    const expired = r.expires_at && new Date(r.expires_at) < now;
    const expiring = r.expires_at && !expired && new Date(r.expires_at).getTime() < now.getTime() + 7 * 86_400_000;
    return {
      id: r.id,
      editHref: `/admin/alunos/${r.user_id}`,
      title: p?.name ?? p?.email ?? "Aluno",
      subtitle: entitlementLabel(r.entitlement),
      meta: r.expires_at ? `expira ${dateShort(r.expires_at)}` : "vitalício",
      cells: {
        aluno: (
          <Link href={`/admin/alunos/${r.user_id}`} className="min-w-0 hover:underline" onClick={(e) => e.stopPropagation()}>
            <span className="block max-w-[180px] truncate font-medium text-foreground">{p?.name ?? "—"}</span>
            <span className="block max-w-[180px] truncate text-[11px] text-muted-2">{p?.email}</span>
          </Link>
        ),
        produto: <span className="text-foreground">{entitlementLabel(r.entitlement)}</span>,
        origem: <span className="text-[11px] text-muted-2">{r.source ?? "—"}</span>,
        liberado: dateShort(r.created_at),
        validade: r.expires_at ? (
          expired ? (
            <Badge className="border-danger/30 bg-danger/10 text-danger">venceu {dateShort(r.expires_at)}</Badge>
          ) : expiring ? (
            <Badge className="border-[#e5a83b]/30 bg-[#e5a83b]/10 text-[#e5a83b]">vence {dateShort(r.expires_at)}</Badge>
          ) : (
            <span className="text-muted">{dateShort(r.expires_at)}</span>
          )
        ) : (
          <Badge variant="success">vitalício</Badge>
        ),
        acoes: (
          <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {r.expires_at && <ExtendEntitlementButton entId={r.id} days={30} />}
            <RevokeEntitlementButton userId={r.user_id} entitlement={r.entitlement} label={entitlementLabel(r.entitlement)} />
          </span>
        ),
      },
      drawerTitle: p?.name ?? "Aluno",
      drawerSubtitle: entitlementLabel(r.entitlement),
      drawer: (
        <div className="space-y-3 text-sm text-muted">
          <p><strong className="text-foreground">{entitlementLabel(r.entitlement)}</strong></p>
          <p>Liberado em {dateTime(r.created_at)} · origem: {r.source ?? "—"}</p>
          <p>{r.expires_at ? `Validade: ${dateTime(r.expires_at)}` : "Acesso vitalício."}</p>
          <div className="flex gap-2">
            {r.expires_at && <ExtendEntitlementButton entId={r.id} days={30} />}
            {r.expires_at && <ExtendEntitlementButton entId={r.id} days={365} />}
          </div>
          <Link
            href={`/admin/alunos/${r.user_id}`}
            className="block rounded-lg border border-border bg-surface-2 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:border-border-strong"
          >
            Ver perfil do aluno →
          </Link>
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Acessos & Planos</h1>
        <p className="mt-0.5 text-xs text-muted">
          {num(count ?? 0)} acessos liberados — produto principal, bônus e validades. Estenda ou revogue sem sair da lista.
        </p>
      </div>

      <DataTable
        tableId="acessos"
        basePath="/admin/receita/acessos"
        columns={[
          { id: "aluno", label: "Aluno", width: 200 },
          { id: "produto", label: "Produto / bônus" },
          { id: "origem", label: "Origem", defaultHidden: true },
          { id: "liberado", label: "Liberado em", sortable: true },
          { id: "validade", label: "Validade", sortable: true },
          { id: "acoes", label: "Ações", align: "right" },
        ]}
        rows={tableRows}
        total={count ?? 0}
        page={params.page}
        per={params.per}
        sort={`${params.sortCol}.${params.sortAsc ? "asc" : "desc"}`}
        q={params.q}
        searchPlaceholder="Buscar por aluno ou produto…  ( / )"
        facets={[
          {
            id: "produto",
            label: "Produto",
            options: [
              { value: "base", label: "MPO (principal)" },
              { value: "bonus", label: "Qualquer bônus" },
            ],
            selected: params.filters.produto ?? [],
          },
          {
            id: "vencimento",
            label: "Validade",
            options: [
              { value: "7d", label: "Vence em 7 dias" },
              { value: "30d", label: "Vence em 30 dias" },
              { value: "vencido", label: "Já venceu" },
              { value: "vitalicio", label: "Vitalício" },
            ],
            selected: params.filters.vencimento ?? [],
          },
        ]}
        emptyTitle="Nenhum acesso com esses filtros."
      />
    </div>
  );
}
