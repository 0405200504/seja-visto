import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPeriod } from "@/lib/admin/period";
import { brl, dateShort, num } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/admin/copy-button";
import { ProductMapForm, DeleteMappingButton } from "@/components/admin/revenue/product-map-form";
import { BONUSES } from "@/lib/bonuses";

export const dynamic = "force-dynamic";

const BONUS_TITLES = new Map(BONUSES.map((b) => [b.key, b.title]));

function entitlementLabel(key: string): string {
  if (key === "base") return "MPO — acesso principal";
  if (key === "economize-58") return "Pack completo";
  if (/^tokens/.test(key)) return `Tokens de IA (${key.replace(/\D/g, "")})`;
  return BONUS_TITLES.get(key) ?? key;
}

export default async function ProdutosPage() {
  await requireAdmin();
  const db = createAdminClient();
  const period = await getPeriod();

  const [mapRes, salesRes, entCountRes] = await Promise.all([
    db.from("cakto_product_map").select("*").order("created_at"),
    db.from("sales")
      .select("entitlement, offer_name, amount_cents, status, is_test, created_at")
      .eq("status", "approved")
      .eq("is_test", false)
      .limit(50000),
    db.from("user_entitlements").select("entitlement").limit(50000),
  ]);

  const mappings = mapRes.data ?? [];
  const sales = salesRes.data ?? [];

  // receita por entitlement (todo o histórico + período atual)
  const revenueByEnt = new Map<string, { total: number; period: number; count: number }>();
  for (const s of sales) {
    const key = s.entitlement ?? "(sem produto identificado)";
    const row = revenueByEnt.get(key) ?? { total: 0, period: 0, count: 0 };
    row.total += s.amount_cents;
    row.count += 1;
    if (new Date(s.created_at) >= period.from && new Date(s.created_at) < period.to) row.period += s.amount_cents;
    revenueByEnt.set(key, row);
  }

  const holdersByEnt = new Map<string, number>();
  for (const e of entCountRes.data ?? []) {
    holdersByEnt.set(e.entitlement, (holdersByEnt.get(e.entitlement) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Produtos & Ofertas</h1>
        <p className="mt-0.5 text-xs text-muted">
          Mapa produto da Cakto → acesso na plataforma, com receita por produto. O webhook usa este mapa
          para liberar o acesso certo em cada compra.
        </p>
      </div>

      <ProductMapForm />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                <th className="px-3 py-2">Produto na plataforma</th>
                <th className="px-3 py-2">ID Cakto</th>
                <th className="px-3 py-2">Apelido</th>
                <th className="px-3 py-2">Validade</th>
                <th className="px-3 py-2 text-right">Alunos com acesso</th>
                <th className="px-3 py-2 text-right">Receita ({period.label.toLowerCase()})</th>
                <th className="px-3 py-2 text-right">Receita total</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-muted-2">
                    Nenhum produto mapeado ainda — cadastre o primeiro acima.
                  </td>
                </tr>
              )}
              {mappings.map((m) => {
                const rev = revenueByEnt.get(m.entitlement);
                return (
                  <tr key={m.cakto_id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-foreground">{entitlementLabel(m.entitlement)}</span>
                      <span className="ml-2 text-[11px] text-muted-2">{m.entitlement}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                        {m.cakto_id}
                        <CopyButton text={m.cakto_id} label="" />
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{m.label ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {m.validity_days ? <Badge>{m.validity_days} dias</Badge> : <Badge variant="success">vitalício</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{num(holdersByEnt.get(m.entitlement) ?? 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted">{rev ? brl(rev.period) : "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {rev ? brl(rev.total) : "—"}
                      {rev && <span className="ml-1 text-[11px] font-normal text-muted-2">({num(rev.count)})</span>}
                    </td>
                    <td className="px-3 py-2.5"><DeleteMappingButton caktoId={m.cakto_id} label={m.label ?? m.entitlement} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-2">
          Receita atribuída pela chave de acesso registrada em cada venda desde {mappings[0] ? dateShort(mappings[0].created_at) : "—"}.
          Vendas antigas sem produto identificado aparecem nas transações.
        </p>
      </div>
    </div>
  );
}
