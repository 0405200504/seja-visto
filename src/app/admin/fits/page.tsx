import Image from "next/image";
import { Check, Clock, Trash2, X } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { fitImageUrl } from "@/lib/community";
import { deleteFit, moderateFit } from "@/app/actions/community";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CommunityFit } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FitRow({ fit }: { fit: CommunityFit }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
      <a
        href={fitImageUrl(fit.image_path)}
        target="_blank"
        rel="noreferrer"
        className="relative block h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-border"
      >
        <Image
          src={fitImageUrl(fit.image_path)}
          alt={fit.caption ?? "Fit enviado"}
          fill
          sizes="80px"
          className="object-cover object-top"
        />
      </a>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{fit.author_name ?? "Aluno sem nome"}</p>
        {fit.caption && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{fit.caption}</p>}
        <p className="mt-1 text-xs text-muted">Enviado em {formatDate(fit.created_at)}</p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {fit.status !== "approved" && (
          <form action={moderateFit}>
            <input type="hidden" name="id" value={fit.id} />
            <input type="hidden" name="status" value="approved" />
            <Button size="sm" type="submit">
              <Check className="size-3.5" />
              Aprovar
            </Button>
          </form>
        )}
        {fit.status !== "rejected" && (
          <form action={moderateFit}>
            <input type="hidden" name="id" value={fit.id} />
            <input type="hidden" name="status" value="rejected" />
            <Button variant="secondary" size="sm" type="submit">
              <X className="size-3.5" />
              Recusar
            </Button>
          </form>
        )}
        <form action={deleteFit}>
          <input type="hidden" name="id" value={fit.id} />
          <Button variant="danger" size="sm" type="submit">
            <Trash2 className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminFitsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("community_fits")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<CommunityFit[]>();

  const fits = data ?? [];
  const pending = fits.filter((f) => f.status === "pending");
  const approved = fits.filter((f) => f.status === "approved");
  const rejected = fits.filter((f) => f.status === "rejected");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Fits da comunidade"
        description={`${pending.length} aguardando aprovação · ${approved.length} publicados · ${rejected.length} recusados.`}
      />

      <div className="space-y-10">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            Aguardando aprovação
            {pending.length > 0 && <Badge variant="accent">{pending.length}</Badge>}
          </h2>
          {pending.length > 0 ? (
            <div className="space-y-2.5">
              {pending.map((fit) => (
                <FitRow key={fit.id} fit={fit} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nenhum fit pendente"
              description="Quando um aluno enviar uma foto, ela aparece aqui para você aprovar ou recusar."
            />
          )}
        </section>

        {approved.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Publicados</h2>
            <div className="space-y-2.5">
              {approved.map((fit) => (
                <FitRow key={fit.id} fit={fit} />
              ))}
            </div>
          </section>
        )}

        {rejected.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Recusados</h2>
            <div className="space-y-2.5">
              {rejected.map((fit) => (
                <FitRow key={fit.id} fit={fit} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
