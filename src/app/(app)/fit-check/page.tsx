import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { FitCheckChat } from "@/components/app/fit-check-chat";

export const metadata: Metadata = { title: "Fit Check" };

export default async function FitCheckPage() {
  await requireProfile();

  return (
    <div className="animate-fade-up">
      <FitCheckChat />
    </div>
  );
}
