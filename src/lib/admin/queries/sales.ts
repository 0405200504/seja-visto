import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, type ListParams } from "@/lib/admin/list";

export type SaleListRow = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  amount_cents: number;
  gateway_fee_cents: number;
  status: string;
  payment_method: string | null;
  cakto_id: string | null;
  offer_name: string | null;
  entitlement: string | null;
  is_test: boolean;
  refunded_at: string | null;
  created_at: string;
};

const SORTABLE: Record<string, string> = {
  created_at: "created_at",
  amount_cents: "amount_cents",
  email: "email",
};

export async function fetchSales(
  params: ListParams,
  extra?: { onlyStatuses?: string[] }
): Promise<{ rows: SaleListRow[]; total: number }> {
  const db = createAdminClient();

  let query = db.from("sales").select("*", { count: "exact" });

  if (params.q) {
    const like = ilikePattern(params.q);
    query = query.or(`email.ilike.${like},name.ilike.${like},cakto_id.ilike.${like}`);
  }

  const f = params.filters;

  if (extra?.onlyStatuses?.length) {
    query = query.in("status", extra.onlyStatuses);
  } else if (f.status?.length) {
    query = query.in("status", f.status);
  }

  if (f.metodo?.length) query = query.in("payment_method", f.metodo);

  // vendas de teste ficam fora por padrão
  const teste = f.teste?.[0] ?? "excluir";
  if (teste === "excluir") query = query.eq("is_test", false);
  if (teste === "somente") query = query.eq("is_test", true);

  if (f.origem?.length === 1) {
    if (f.origem[0] === "cakto") query = query.not("cakto_id", "is", null);
    if (f.origem[0] === "manual") query = query.is("cakto_id", null);
  }

  if (f.data?.length === 1) {
    const days = parseInt(f.data[0], 10);
    if (Number.isFinite(days)) {
      query = query.gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
    }
  }

  const sortCol = SORTABLE[params.sortCol] ?? "created_at";
  query = query.order(sortCol, { ascending: params.sortAsc }).range(params.from, params.to);

  const { data, count, error } = await query;
  if (error) throw new Error(`Erro ao listar transações: ${error.message}`);
  return { rows: (data ?? []) as SaleListRow[], total: count ?? 0 };
}
