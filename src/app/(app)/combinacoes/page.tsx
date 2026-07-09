import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { LookFilters } from "@/components/app/look-filters";
import { LookCard } from "@/components/app/look-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Look } from "@/lib/types";

export const metadata: Metadata = { title: "Combinações" };

const PARAM_TO_COLUMN: Record<string, string> = {
  ocasiao: "occasion",
  estilo: "style",
  clima: "climate",
  nivel: "level",
  cor: "base_color",
};

export default async function CombinacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireProfile();

  let query = supabase.from("looks").select("*").order("created_at");
  for (const [param, column] of Object.entries(PARAM_TO_COLUMN)) {
    const value = params[param];
    if (typeof value === "string" && value) {
      query = query.eq(column, value);
    }
  }

  const [{ data: looks }, { data: favorites }] = await Promise.all([
    query.returns<Look[]>(),
    supabase
      .from("user_favorites")
      .select("look_id")
      .eq("user_id", user.id)
      .eq("kind", "favorite"),
  ]);

  const favoriteIds = new Set((favorites ?? []).map((f) => f.look_id));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Lookbook"
        title="Combinações"
        description="Looks prontos para copiar. Filtre por ocasião, estilo, clima, nível e cor base."
      />

      <div className="mb-8 rounded-2xl border border-border bg-surface/60 p-4 sm:p-5">
        <LookFilters />
      </div>

      {looks && looks.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-muted">
            {looks.length} {looks.length === 1 ? "combinação encontrada" : "combinações encontradas"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {looks.map((look) => (
              <LookCard key={look.id} look={look} isFavorite={favoriteIds.has(look.id)} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="Nenhuma combinação encontrada"
          description="Nenhum look corresponde a esses filtros. Tente remover algum filtro para ver mais opções."
        />
      )}
    </div>
  );
}
