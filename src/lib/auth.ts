import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Por que tudo aqui passa pelo `cache()`:
 *
 * Numa navegação do app o layout chama `requirePaidAccess()` e a página chama
 * `requireProfile()`. Sem dedupe isso virava, por página, 2 chamadas ao Auth do
 * Supabase (`getUser` é uma requisição HTTP, não uma leitura local do cookie) e
 * 2 leituras de `users_profile` — em série, somando latência de rede antes de
 * qualquer HTML sair. O `cache()` do React vale por requisição: a segunda
 * chamada reaproveita a promise da primeira.
 */

/** Usuário autenticado — uma única chamada ao Auth por requisição. */
const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/** Perfil — uma única leitura de `users_profile` por requisição. */
const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users_profile")
    .select("*")
    .eq("user_id", userId)
    .single<Profile>();
  return data;
});

/** Entitlement do produto base — uma única leitura por requisição. */
const getBaseEntitlement = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_entitlements")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("entitlement", "base")
    .maybeSingle<{ expires_at: string | null }>();
  return data;
});

/** Garante usuário autenticado em Server Components / Actions. */
export async function requireUser() {
  const { supabase, user } = await getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

/** Garante usuário autenticado com onboarding completo, retornando o perfil. */
export async function requireProfile() {
  const { supabase, user } = await requireUser();

  const profile = await getProfile(user.id);

  if (!profile?.onboarding_completed) redirect("/onboarding");
  return { supabase, user, profile };
}

/** Garante que o usuário é admin. */
export async function requireAdmin() {
  const { supabase, user, profile } = await requireProfile();
  if (!profile.is_admin) redirect("/dashboard");
  return { supabase, user, profile };
}

/**
 * Garante que o aluno tem acesso pago ativo ao produto base.
 *
 * É a porta do conteúdo pago. Precisa rodar ANTES de renderizar
 * qualquer página do grupo (app) — esconder com CSS não basta,
 * porque o HTML continua sendo enviado ao navegador.
 */
export async function requirePaidAccess() {
  const { supabase, user, profile } = await requireProfile();
  if (profile.is_admin) return { supabase, user, profile };

  const entitlement = await getBaseEntitlement(user.id);

  const ativo =
    entitlement &&
    (!entitlement.expires_at || new Date(entitlement.expires_at) > new Date());

  if (!ativo) {
    const venceuEm = entitlement?.expires_at
      ? `?venceu=${encodeURIComponent(entitlement.expires_at)}`
      : "";
    redirect(`/acesso-expirado${venceuEm}`);
  }

  return { supabase, user, profile };
}
