import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O bucket `fits` é PRIVADO: são fotos pessoais dos alunos, incluindo as
 * recusadas na moderação. A leitura passa por URL assinada com validade,
 * nunca por URL pública — link público é uma senha que nunca expira.
 */
const FIT_URL_TTL_SECONDS = 60 * 60; // 1 hora

/** Assina as fotos de vários fits de uma vez (uma chamada só, não N). */
export async function signFitImageUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn = FIT_URL_TTL_SECONDS
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unicos = [...new Set(paths.filter(Boolean))];
  if (unicos.length === 0) return map;

  const { data, error } = await supabase.storage
    .from("fits")
    .createSignedUrls(unicos, expiresIn);

  if (error || !data) return map;

  for (const item of data) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}

/** Assina a foto de um fit só. */
export async function signFitImageUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = FIT_URL_TTL_SECONDS
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from("fits")
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
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
