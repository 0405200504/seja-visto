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
