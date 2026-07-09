"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export type FavoriteKind = "favorite" | "plan" | "have_pieces";

export async function toggleFavorite(
  lookId: string,
  isActive: boolean,
  kind: FavoriteKind = "favorite"
) {
  const { supabase, user } = await requireUser();

  if (isActive) {
    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("look_id", lookId)
      .eq("kind", kind);
  } else {
    await supabase
      .from("user_favorites")
      .insert({ user_id: user.id, look_id: lookId, kind });
  }

  revalidatePath("/favoritos");
  revalidatePath("/combinacoes");
  revalidatePath("/dashboard");
}

export async function toggleLesson(moduleId: string, lessonId: string, completed: boolean) {
  const { supabase, user } = await requireUser();

  if (completed) {
    await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
  } else {
    await supabase
      .from("user_progress")
      .upsert(
        { user_id: user.id, module_id: moduleId, lesson_id: lessonId, completed: true },
        { onConflict: "user_id,lesson_id" }
      );
  }

  revalidatePath("/metodo");
  revalidatePath("/dashboard");
}

export async function completeModule(moduleId: string, lessonIds: string[]) {
  const { supabase, user } = await requireUser();

  await supabase.from("user_progress").upsert(
    lessonIds.map((lessonId) => ({
      user_id: user.id,
      module_id: moduleId,
      lesson_id: lessonId,
      completed: true,
    })),
    { onConflict: "user_id,lesson_id" }
  );

  revalidatePath("/metodo");
  revalidatePath("/dashboard");
}

export async function setWardrobeStatus(
  itemId: string,
  status: "tenho" | "quero_comprar" | null
) {
  const { supabase, user } = await requireUser();

  if (status === null) {
    await supabase
      .from("user_wardrobe")
      .delete()
      .eq("user_id", user.id)
      .eq("wardrobe_item_id", itemId);
  } else {
    await supabase
      .from("user_wardrobe")
      .upsert(
        { user_id: user.id, wardrobe_item_id: itemId, status },
        { onConflict: "user_id,wardrobe_item_id" }
      );
  }

  revalidatePath("/guarda-roupa");
  revalidatePath("/favoritos");
  revalidatePath("/dashboard");
}

export async function toggleActionDay(day: number, completed: boolean) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("action_plan_progress")
    .upsert(
      { user_id: user.id, day, completed: !completed },
      { onConflict: "user_id,day" }
    );

  revalidatePath("/plano-de-acao");
  revalidatePath("/dashboard");
}

export async function saveDayNotes(day: number, notes: string) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("action_plan_progress")
    .select("completed")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  await supabase.from("action_plan_progress").upsert(
    { user_id: user.id, day, notes, completed: existing?.completed ?? false },
    { onConflict: "user_id,day" }
  );

  revalidatePath("/plano-de-acao");
}

export async function updateProfileName(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  if (name) {
    await supabase.from("users_profile").update({ name }).eq("user_id", user.id);
  }

  revalidatePath("/", "layout");
}

export async function redoOnboarding() {
  const { supabase, user } = await requireUser();

  await supabase
    .from("users_profile")
    .update({ onboarding_completed: false })
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
