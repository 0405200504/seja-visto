import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Garante usuário autenticado em Server Components / Actions. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

/** Garante usuário autenticado com onboarding completo, retornando o perfil. */
export async function requireProfile() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("users_profile")
    .select("*")
    .eq("user_id", user.id)
    .single<Profile>();

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

  const { data: entitlement } = await supabase
    .from("user_entitlements")
    .select("expires_at")
    .eq("user_id", user.id)
    .eq("entitlement", "base")
    .maybeSingle<{ expires_at: string | null }>();

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
