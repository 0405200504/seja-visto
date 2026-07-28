"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveViewAction(page: string, name: string, params: string) {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const clean = name.trim().slice(0, 60);
  if (!clean) return { ok: false as const, message: "Dê um nome para a visão." };

  const { error } = await db
    .from("admin_saved_views")
    .upsert(
      { user_id: profile.user_id, page, name: clean, params },
      { onConflict: "user_id,page,name" }
    );
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true as const, message: `Visão "${clean}" salva e fixada na sidebar.` };
}

export async function deleteViewAction(id: string) {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  await db.from("admin_saved_views").delete().eq("id", id).eq("user_id", profile.user_id);
  revalidatePath("/admin", "layout");
  return { ok: true as const, message: "Visão removida." };
}
