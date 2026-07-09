import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { OnboardingFlow } from "@/components/app/onboarding-flow";
import { Logo } from "@/components/app/logo";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("users_profile")
    .select("*")
    .eq("user_id", user.id)
    .single<Profile>();

  // Refazer onboarding é permitido via /perfil, que reseta a flag.
  if (profile?.onboarding_completed) redirect("/dashboard");

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]" />
      <div className="relative z-10 mb-12">
        <Logo />
      </div>
      <div className="relative z-10 flex w-full flex-1 items-center justify-center">
        <OnboardingFlow name={profile?.name ?? null} />
      </div>
    </div>
  );
}
