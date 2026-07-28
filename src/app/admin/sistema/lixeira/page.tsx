import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateTime, relTime } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";
import { TrashRowActions } from "@/components/admin/system/trash-actions";

export const dynamic = "force-dynamic";

type TrashRow = { kind: string; kindLabel: string; id: string; label: string; deleted_at: string };

export default async function LixeiraPage() {
  await requireAdmin();
  const db = createAdminClient();

  const [looks, pecas, modulos, aulas, links] = await Promise.all([
    db.from("looks").select("id, title, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
    db.from("wardrobe_items").select("id, name, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
    db.from("modules").select("id, title, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
    db.from("lessons").select("id, title, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
    db.from("tracking_links").select("id, slug, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
  ]);

  const rows: TrashRow[] = [
    ...(looks.data ?? []).map((r) => ({ kind: "look", kindLabel: "Look", id: r.id, label: r.title, deleted_at: r.deleted_at })),
    ...(pecas.data ?? []).map((r) => ({ kind: "peca", kindLabel: "Peça", id: r.id, label: r.name, deleted_at: r.deleted_at })),
    ...(modulos.data ?? []).map((r) => ({ kind: "modulo", kindLabel: "Módulo", id: r.id, label: r.title, deleted_at: r.deleted_at })),
    ...(aulas.data ?? []).map((r) => ({ kind: "aula", kindLabel: "Aula", id: r.id, label: r.title, deleted_at: r.deleted_at })),
    ...(links.data ?? []).map((r) => ({ kind: "link", kindLabel: "Link", id: r.id, label: `/l/${r.slug}`, deleted_at: r.deleted_at })),
  ].sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Lixeira</h1>
        <p className="mt-0.5 text-xs text-muted">
          Tudo que foi excluído no admin fica aqui por 30 dias, invisível para os alunos. Restaure quando
          quiser — apagar de vez exige digitar o nome do registro.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-xs text-muted-2">
          A lixeira está vazia. 🧹
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <Badge>{r.kindLabel}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{r.label}</span>
              <span className="shrink-0 text-[11px] text-muted-2" title={dateTime(r.deleted_at)}>
                excluído {relTime(r.deleted_at)}
              </span>
              <TrashRowActions kind={r.kind} id={r.id} label={r.label} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
