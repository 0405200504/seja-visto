import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { num } from "@/lib/admin/format";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS } from "@/lib/constants";
import { AutosaveForm, AutosaveInput, AutosaveSelect, AutosaveTextarea } from "@/components/admin/ui/autosave";
import { ImageField, DeleteEntityButton } from "@/components/admin/content/content-helpers";
import { bulkLooksAction, updateLookFieldAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

function options(map: Record<string, string>) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export default async function LookEditPage(props: { params: Promise<{ lookId: string }> }) {
  await requireAdmin();
  const { lookId } = await props.params;
  const db = createAdminClient();

  const [{ data: look }, reactions] = await Promise.all([
    db.from("looks").select("*").eq("id", lookId).maybeSingle(),
    db.from("fit_reactions").select("kind").eq("look_id", lookId),
  ]);
  if (!look || look.deleted_at) notFound();

  const likes = (reactions.data ?? []).filter((r) => r.kind === "like").length;
  const updateField = updateLookFieldAction.bind(null, lookId);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/conteudo/looks" className="mb-1 flex items-center gap-1 text-xs text-muted hover:text-foreground">
            <ArrowLeft className="size-3" /> Todos os looks
          </Link>
          <h1 className="truncate font-display text-xl font-bold text-foreground">{look.title}</h1>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <Heart className="size-3.5 text-muted-2" /> {num(likes)} curtidas
        </span>
      </div>

      <AutosaveForm action={updateField} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <AutosaveInput name="title" label="Título" initial={look.title} validate={(v) => (v.trim() ? null : "O título é obrigatório.")} />
            <AutosaveTextarea name="description" label="Descrição" initial={look.description ?? ""} rows={2} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <AutosaveSelect name="occasion" label="Ocasião" initial={look.occasion} options={options(OCCASIONS)} />
              <AutosaveSelect name="style" label="Estilo" initial={look.style} options={options(STYLES)} />
              <AutosaveSelect name="climate" label="Clima" initial={look.climate} options={options(CLIMATES)} />
              <AutosaveSelect name="level" label="Nível" initial={look.level} options={options(LEVELS)} />
              <AutosaveSelect name="base_color" label="Cor base" initial={look.base_color} options={options(BASE_COLORS)} />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <AutosaveTextarea
              name="pieces"
              label="Peças (uma por linha)"
              initial={((look.pieces ?? []) as string[]).join("\n")}
              rows={6}
              placeholder={"Camiseta branca lisa\nJeans reto azul médio\nTênis branco"}
            />
            <AutosaveTextarea name="why_it_works" label="Por que funciona" initial={look.why_it_works ?? ""} rows={3} />
            <AutosaveTextarea
              name="adaptations"
              label="Adaptações (uma por linha)"
              initial={((look.adaptations ?? []) as string[]).join("\n")}
              rows={4}
              placeholder={"Frio: troque a camiseta por tricô fino\nNoite: base escura"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold text-muted">Imagem do look</p>
            <ImageField
              value={look.image_url}
              folder="looks"
              action={updateLookFieldAction.bind(null, lookId, "image_url")}
              aspectHint="ideal 4:5 (vertical)"
            />
          </div>

          <div className="rounded-xl border border-danger/25 bg-danger/[0.03] p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">Zona de risco</h2>
            <DeleteEntityButton
              label="Excluir look…"
              confirm={{
                title: "Mover este look para a lixeira?",
                message: `"${look.title}" some do app dos alunos na hora. Fica 30 dias na lixeira para restaurar.`,
                typeToConfirm: look.title,
                confirmLabel: "Excluir",
              }}
              action={bulkLooksAction.bind(null, "excluir", { ids: [lookId], allFiltered: false, queryString: "" })}
              undoAction={bulkLooksAction.bind(null, "restaurar", { ids: [lookId], allFiltered: false, queryString: "" })}
              redirectTo="/admin/conteudo/looks"
            />
          </div>
        </div>
      </AutosaveForm>
    </div>
  );
}
