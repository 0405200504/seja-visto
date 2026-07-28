import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { fetchFitsSocial } from "@/lib/community";
import { PageHeader } from "@/components/app/page-header";
import { CombinacoesTabs } from "@/components/app/combinacoes-tabs";
import { FitCard } from "@/components/app/fit-card";
import { FitUpload } from "@/components/app/fit-upload";
import { EmptyState } from "@/components/ui/empty-state";
import type { CommunityFit } from "@/lib/types";

export const metadata: Metadata = { title: "Fits da comunidade" };

export default async function ComunidadePage() {
  const { supabase, user } = await requireProfile();

  // RLS já limita a fits aprovados + os do próprio usuário (qualquer status).
  const { data } = await supabase
    .from("community_fits")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<CommunityFit[]>();

  const fits = data ?? [];
  const social = await fetchFitsSocial(
    supabase,
    fits.map((f) => f.id),
    user.id
  );

  // Seus envios em análise aparecem primeiro, para você acompanhar o status.
  const ordered = [
    ...fits.filter((f) => f.user_id === user.id && f.status !== "approved"),
    ...fits.filter((f) => f.user_id !== user.id || f.status === "approved"),
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Lookbook"
        title="Refs"
        description="Fits reais enviados pelos alunos. Publique o seu, curta, salve e comente os looks da comunidade."
        action={<FitUpload />}
      />

      <CombinacoesTabs />

      {ordered.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-muted">
            {ordered.length} {ordered.length === 1 ? "fit publicado" : "fits publicados"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {ordered.map((fit) => (
              <FitCard key={fit.id} fit={fit} social={social.get(fit.id)!} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum fit por aqui ainda"
          description="Seja a primeira pessoa a publicar um look. Sua foto entra em análise e aparece aqui depois de aprovada."
          action={<FitUpload />}
        />
      )}
    </div>
  );
}
