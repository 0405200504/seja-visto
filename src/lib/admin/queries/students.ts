import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, type ListParams } from "@/lib/admin/list";

/**
 * Consulta paginada de alunos com filtros combináveis — usada pela lista
 * e pelo export CSV (mesmos filtros, mesmo resultado).
 */

export type StudentListRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
  tags: string[];
  style_goal: string | null;
  preferred_style: string | null;
  created_at: string;
  last_seen_at: string | null;
  // enriquecimento
  hasBase: boolean;
  baseExpiresAt: string | null;
  bonusCount: number;
  tokenBalance: number | null;
  lessonsDone: number;
  totalSpentCents: number;
};

const SORTABLE: Record<string, string> = {
  created_at: "created_at",
  name: "name",
  last_seen_at: "last_seen_at",
};

export async function fetchStudents(params: ListParams): Promise<{
  rows: StudentListRow[];
  total: number;
  totalLessons: number;
}> {
  const db = createAdminClient();

  let query = db
    .from("users_profile")
    .select(
      "user_id, name, email, is_admin, onboarding_completed, tags, style_goal, preferred_style, created_at, last_seen_at",
      { count: "exact" }
    );

  if (params.q) {
    const like = ilikePattern(params.q);
    query = query.or(`name.ilike.${like},email.ilike.${like}`);
  }

  const f = params.filters;

  if (f.onboarding?.length === 1) {
    query = query.eq("onboarding_completed", f.onboarding[0] === "completo");
  }
  if (f.admin?.length === 1) {
    query = query.eq("is_admin", f.admin[0] === "sim");
  }
  if (f.atividade?.length === 1) {
    const sevenDays = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const thirtyDays = new Date(Date.now() - 30 * 86_400_000).toISOString();
    if (f.atividade[0] === "ativo7") query = query.gte("last_seen_at", sevenDays);
    if (f.atividade[0] === "inativo30") query = query.or(`last_seen_at.lt.${thirtyDays},last_seen_at.is.null`);
    if (f.atividade[0] === "nunca") query = query.is("last_seen_at", null);
  }
  if (f.tag?.length) {
    query = query.overlaps("tags", f.tag);
  }
  if (f.estilo?.length) {
    query = query.in("preferred_style", f.estilo);
  }

  // filtros que dependem de outras tabelas → pré-consulta de user_ids
  if (f.acesso?.length === 1 || f.tokens?.length === 1) {
    if (f.acesso?.length === 1) {
      const { data: baseRows } = await db
        .from("user_entitlements")
        .select("user_id, expires_at")
        .eq("entitlement", "base")
        .limit(10000);
      const now = Date.now();
      const valid = (baseRows ?? []).filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now);
      const validIds = valid.map((r) => r.user_id);
      if (f.acesso[0] === "com") {
        query = query.in("user_id", validIds.length ? validIds : ["00000000-0000-0000-0000-000000000000"]);
      } else if (f.acesso[0] === "sem") {
        const all = (baseRows ?? []).map((r) => r.user_id);
        if (all.length) query = query.not("user_id", "in", `(${all.join(",")})`);
      } else if (f.acesso[0] === "vencendo") {
        const soon = valid
          .filter((r) => r.expires_at && new Date(r.expires_at).getTime() < now + 7 * 86_400_000)
          .map((r) => r.user_id);
        query = query.in("user_id", soon.length ? soon : ["00000000-0000-0000-0000-000000000000"]);
      }
    }
    if (f.tokens?.length === 1) {
      const { data: creditRows } = await db
        .from("fit_check_credits")
        .select("user_id")
        .eq("balance", 0)
        .limit(10000);
      const zeroIds = (creditRows ?? []).map((r) => r.user_id);
      if (f.tokens[0] === "zerado") {
        query = query.in("user_id", zeroIds.length ? zeroIds : ["00000000-0000-0000-0000-000000000000"]);
      } else if (zeroIds.length) {
        query = query.not("user_id", "in", `(${zeroIds.join(",")})`);
      }
    }
  }

  const sortCol = SORTABLE[params.sortCol] ?? "created_at";
  query = query
    .order(sortCol, { ascending: params.sortAsc, nullsFirst: false })
    .range(params.from, params.to);

  const { data: profiles, count, error } = await query;
  if (error) throw new Error(`Erro ao listar alunos: ${error.message}`);

  const ids = (profiles ?? []).map((p) => p.user_id);
  const emails = (profiles ?? []).map((p) => p.email).filter(Boolean) as string[];

  const [entRes, credRes, progRes, salesRes, lessonsRes] = await Promise.all([
    ids.length
      ? db.from("user_entitlements").select("user_id, entitlement, expires_at").in("user_id", ids)
      : Promise.resolve({ data: [] as { user_id: string; entitlement: string; expires_at: string | null }[] }),
    ids.length
      ? db.from("fit_check_credits").select("user_id, balance").in("user_id", ids)
      : Promise.resolve({ data: [] as { user_id: string; balance: number }[] }),
    ids.length
      ? db.from("user_progress").select("user_id").eq("completed", true).in("user_id", ids)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    emails.length
      ? db.from("sales").select("user_id, email, amount_cents, status, is_test").or(`user_id.in.(${ids.join(",")}),email.in.(${emails.map((e) => `"${e}"`).join(",")})`)
      : Promise.resolve({ data: [] as { user_id: string | null; email: string; amount_cents: number; status: string; is_test: boolean }[] }),
    db.from("lessons").select("*", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const entByUser = new Map<string, { entitlement: string; expires_at: string | null }[]>();
  for (const e of entRes.data ?? []) {
    entByUser.set(e.user_id, [...(entByUser.get(e.user_id) ?? []), e]);
  }
  const credByUser = new Map((credRes.data ?? []).map((c) => [c.user_id, c.balance]));
  const progByUser = new Map<string, number>();
  for (const p of progRes.data ?? []) progByUser.set(p.user_id, (progByUser.get(p.user_id) ?? 0) + 1);

  const spentByKey = new Map<string, number>();
  for (const s of salesRes.data ?? []) {
    if (s.status !== "approved" || s.is_test) continue;
    const key = s.user_id ?? s.email.toLowerCase();
    spentByKey.set(key, (spentByKey.get(key) ?? 0) + s.amount_cents);
  }

  const rows: StudentListRow[] = (profiles ?? []).map((p) => {
    const ents = entByUser.get(p.user_id) ?? [];
    const base = ents.find((e) => e.entitlement === "base");
    return {
      ...p,
      tags: p.tags ?? [],
      hasBase: !!base && (!base.expires_at || new Date(base.expires_at) > new Date()),
      baseExpiresAt: base?.expires_at ?? null,
      bonusCount: ents.filter((e) => e.entitlement !== "base").length,
      tokenBalance: credByUser.get(p.user_id) ?? null,
      lessonsDone: progByUser.get(p.user_id) ?? 0,
      totalSpentCents:
        (spentByKey.get(p.user_id) ?? 0) +
        (p.email ? (spentByKey.get(p.email.toLowerCase()) ?? 0) : 0),
    };
  });

  return { rows, total: count ?? 0, totalLessons: lessonsRes.count ?? 0 };
}
