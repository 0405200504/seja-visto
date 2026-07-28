import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern, type ListParams } from "@/lib/admin/list";

export type LookListRow = {
  id: string;
  title: string;
  description: string | null;
  occasion: string;
  style: string;
  climate: string;
  level: string;
  base_color: string;
  image_url: string | null;
  pieces: string[];
  created_at: string;
  likes: number;
  favorites: number;
};

const SORTABLE: Record<string, string> = {
  created_at: "created_at",
  title: "title",
};

export async function fetchLooks(params: ListParams): Promise<{ rows: LookListRow[]; total: number }> {
  const db = createAdminClient();

  let query = db
    .from("looks")
    .select("id, title, description, occasion, style, climate, level, base_color, image_url, pieces, created_at", { count: "exact" })
    .is("deleted_at", null);

  if (params.q) query = query.ilike("title", ilikePattern(params.q));

  const f = params.filters;
  for (const key of ["estilo", "ocasiao", "clima", "nivel", "cor"] as const) {
    const col = { estilo: "style", ocasiao: "occasion", clima: "climate", nivel: "level", cor: "base_color" }[key];
    if (f[key]?.length) query = query.in(col, f[key]);
  }
  if (f.imagem?.length === 1) {
    query = f.imagem[0] === "sem" ? query.is("image_url", null) : query.not("image_url", "is", null);
  }

  const sortCol = SORTABLE[params.sortCol] ?? "created_at";
  query = query.order(sortCol, { ascending: params.sortAsc }).range(params.from, params.to);

  const { data, count, error } = await query;
  if (error) throw new Error(`Erro ao listar looks: ${error.message}`);

  const ids = (data ?? []).map((l) => l.id);
  const [reactRes, favRes] = await Promise.all([
    ids.length
      ? db.from("fit_reactions").select("look_id, kind").in("look_id", ids)
      : Promise.resolve({ data: [] as { look_id: string; kind: string }[] }),
    ids.length
      ? db.from("user_favorites").select("look_id").eq("kind", "favorite").in("look_id", ids)
      : Promise.resolve({ data: [] as { look_id: string }[] }),
  ]);

  const likes = new Map<string, number>();
  for (const r of reactRes.data ?? []) if (r.kind === "like") likes.set(r.look_id, (likes.get(r.look_id) ?? 0) + 1);
  const favs = new Map<string, number>();
  for (const r of favRes.data ?? []) favs.set(r.look_id, (favs.get(r.look_id) ?? 0) + 1);

  const rows: LookListRow[] = (data ?? []).map((l) => ({
    ...l,
    pieces: (l.pieces ?? []) as string[],
    likes: likes.get(l.id) ?? 0,
    favorites: favs.get(l.id) ?? 0,
  }));

  return { rows, total: count ?? 0 };
}
