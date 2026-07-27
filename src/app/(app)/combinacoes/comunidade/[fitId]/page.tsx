import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { fetchFitsSocial, fitImageUrl } from "@/lib/community";
import { deleteFit } from "@/app/actions/community";
import { ReactionButtons } from "@/components/app/reaction-buttons";
import { CommentsSection } from "@/components/app/comments-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunityFit, FitComment } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function FitDetailPage({
  params,
}: {
  params: Promise<{ fitId: string }>;
}) {
  const { fitId } = await params;
  const { supabase, user, profile } = await requireProfile();

  const [{ data: fit }, { data: comments }] = await Promise.all([
    supabase
      .from("community_fits")
      .select("*")
      .eq("id", fitId)
      .maybeSingle<CommunityFit>(),
    supabase
      .from("fit_comments")
      .select("*")
      .eq("fit_id", fitId)
      .order("created_at")
      .returns<FitComment[]>(),
  ]);

  if (!fit) notFound();

  const social = (await fetchFitsSocial(supabase, [fit.id], user.id)).get(fit.id)!;
  const isOwn = fit.user_id === user.id;

  return (
    <div className="animate-fade-up">
      <Link
        href="/combinacoes/comunidade"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para a comunidade
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
        {/* Foto */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-card lg:sticky lg:top-10 lg:self-start">
          <div className="relative aspect-[4/5]">
            <Image
              src={fitImageUrl(fit.image_path)}
              alt={fit.caption ?? `Fit de ${fit.author_name ?? "aluno"}`}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6">
          <div>
            {fit.status !== "approved" && (
              <div className="mb-3">
                {fit.status === "pending" ? (
                  <Badge variant="accent">Em análise — visível só para você</Badge>
                ) : (
                  <Badge variant="outline">Não aprovado pela moderação</Badge>
                )}
              </div>
            )}
            <h1 className="text-2xl font-bold sm:text-3xl">
              {fit.author_name ?? "Aluno da comunidade"}
            </h1>
            <p className="mt-1 text-sm text-muted">Publicado em {formatDate(fit.created_at)}</p>
            {fit.caption && (
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {fit.caption}
              </p>
            )}
          </div>

          <ReactionButtons
            target={{ fitId: fit.id }}
            likes={social.likes}
            liked={social.liked}
            saves={social.saves}
            saved={social.saved}
            size="md"
          />

          <CommentsSection
            target={{ fitId: fit.id }}
            comments={comments ?? []}
            currentUserId={user.id}
            isAdmin={profile.is_admin}
          />

          {(isOwn || profile.is_admin) && (
            <form action={deleteFit}>
              <input type="hidden" name="id" value={fit.id} />
              <input type="hidden" name="redirect_to" value="/combinacoes/comunidade" />
              <Button variant="danger" size="sm" type="submit">
                <Trash2 className="size-3.5" />
                Excluir este fit
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
