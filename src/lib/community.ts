import type { SupabaseClient } from "@supabase/supabase-js";

/** URL pública de uma foto enviada para o bucket `fits` do Supabase Storage. */
export function fitImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fits/${path}`;
}

export type FitSocial = {
  likes: number;
  saves: number;
  comments: number;
  liked: boolean;
  saved: boolean;
};

export type LookSocial = {
  likes: number;
  comments: number;
  liked: boolean;
};

/** Agrega curtidas, salvamentos e comentários dos fits da comunidade. */
export async function fetchFitsSocial(
  supabase: SupabaseClient,
  fitIds: string[],
  userId: string
): Promise<Map<string, FitSocial>> {
  const map = new Map<string, FitSocial>(
    fitIds.map((id) => [id, { likes: 0, saves: 0, comments: 0, liked: false, saved: false }])
  );
  if (fitIds.length === 0) return map;

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from("fit_reactions").select("fit_id, user_id, kind").in("fit_id", fitIds),
    supabase.from("fit_comments").select("fit_id").in("fit_id", fitIds),
  ]);

  for (const r of reactions ?? []) {
    const s = map.get(r.fit_id);
    if (!s) continue;
    if (r.kind === "like") {
      s.likes += 1;
      if (r.user_id === userId) s.liked = true;
    } else if (r.kind === "save") {
      s.saves += 1;
      if (r.user_id === userId) s.saved = true;
    }
  }
  for (const c of comments ?? []) {
    const s = map.get(c.fit_id);
    if (s) s.comments += 1;
  }
  return map;
}

/** Agrega curtidas e comentários dos looks oficiais da plataforma. */
export async function fetchLooksSocial(
  supabase: SupabaseClient,
  lookIds: string[],
  userId: string
): Promise<Map<string, LookSocial>> {
  const map = new Map<string, LookSocial>(
    lookIds.map((id) => [id, { likes: 0, comments: 0, liked: false }])
  );
  if (lookIds.length === 0) return map;

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase
      .from("fit_reactions")
      .select("look_id, user_id")
      .eq("kind", "like")
      .in("look_id", lookIds),
    supabase.from("fit_comments").select("look_id").in("look_id", lookIds),
  ]);

  for (const r of reactions ?? []) {
    const s = map.get(r.look_id);
    if (!s) continue;
    s.likes += 1;
    if (r.user_id === userId) s.liked = true;
  }
  for (const c of comments ?? []) {
    const s = map.get(c.look_id);
    if (s) s.comments += 1;
  }
  return map;
}
