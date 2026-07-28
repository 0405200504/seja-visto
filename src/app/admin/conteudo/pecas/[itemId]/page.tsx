import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { WARDROBE_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { AutosaveForm, AutosaveInput, AutosaveSelect, AutosaveTextarea } from "@/components/admin/ui/autosave";
import { ImageField, DeleteEntityButton } from "@/components/admin/content/content-helpers";
import { bulkWardrobeAction, updateWardrobeFieldAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

function options(map: Record<string, string>) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export default async function PecaEditPage(props: { params: Promise<{ itemId: string }> }) {
  await requireAdmin();
  const { itemId } = await props.params;
  const db = createAdminClient();

  const { data: item } = await db.from("wardrobe_items").select("*").eq("id", itemId).maybeSingle();
  if (!item || item.deleted_at) notFound();

  const updateField = updateWardrobeFieldAction.bind(null, itemId);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/admin/conteudo/pecas" className="mb-1 flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="size-3" /> Todas as peças
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">{item.name}</h1>
      </div>

      <AutosaveForm action={updateField} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-3 sm:col-span-2">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <AutosaveInput name="name" label="Nome" initial={item.name} validate={(v) => (v.trim() ? null : "O nome é obrigatório.")} />
            <div className="grid grid-cols-2 gap-3">
              <AutosaveSelect name="category" label="Categoria" initial={item.category} options={options(WARDROBE_CATEGORIES)} />
              <AutosaveSelect name="priority" label="Prioridade" initial={item.priority} options={options(PRIORITIES)} />
            </div>
            <AutosaveTextarea name="description" label="Descrição" initial={item.description ?? ""} rows={3} />
            <AutosaveTextarea name="how_to_use" label="Como usar" initial={item.how_to_use ?? ""} rows={4} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold text-muted">Imagem</p>
            <ImageField
              value={item.image_url}
              folder="pecas"
              action={updateWardrobeFieldAction.bind(null, itemId, "image_url")}
              aspectHint="ideal 1:1"
            />
          </div>
          <div className="rounded-xl border border-danger/25 bg-danger/[0.03] p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">Zona de risco</h2>
            <DeleteEntityButton
              label="Excluir peça…"
              confirm={{
                title: "Mover esta peça para a lixeira?",
                message: `"${item.name}" some do guarda-roupa dos alunos na hora. Fica 30 dias na lixeira.`,
                confirmLabel: "Excluir",
              }}
              action={bulkWardrobeAction.bind(null, "excluir", { ids: [itemId], allFiltered: false, queryString: "" })}
              undoAction={bulkWardrobeAction.bind(null, "restaurar", { ids: [itemId], allFiltered: false, queryString: "" })}
              redirectTo="/admin/conteudo/pecas"
            />
          </div>
        </div>
      </AutosaveForm>
    </div>
  );
}
