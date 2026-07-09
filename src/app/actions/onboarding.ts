"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STYLE_GOALS, STYLES, MAIN_DIFFICULTIES } from "@/lib/constants";

export async function saveOnboarding(formData: FormData) {
  const { supabase, user } = await requireUser();

  const styleGoal = String(formData.get("style_goal") ?? "");
  const preferredStyle = String(formData.get("preferred_style") ?? "");
  const mainDifficulty = String(formData.get("main_difficulty") ?? "");

  if (
    !(styleGoal in STYLE_GOALS) ||
    !(preferredStyle in STYLES) ||
    !(mainDifficulty in MAIN_DIFFICULTIES)
  ) {
    throw new Error("Respostas de onboarding inválidas.");
  }

  const { error } = await supabase
    .from("users_profile")
    .update({
      style_goal: styleGoal,
      preferred_style: preferredStyle,
      main_difficulty: mainDifficulty,
      onboarding_completed: true,
    })
    .eq("user_id", user.id);

  if (error) throw new Error("Não foi possível salvar suas respostas.");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
