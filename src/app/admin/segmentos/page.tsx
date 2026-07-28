import Link from "next/link";
import { ArrowRight, Pin, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting, type TagsSettings } from "@/lib/admin/settings";
import { num } from "@/lib/admin/format";
import { TagCatalogEditor } from "@/components/admin/students/tag-catalog-editor";

export const dynamic = "force-dynamic";

/** Segmentos prontos: filtros úteis da lista de alunos, um clique de distância. */
const PRESET_SEGMENTS = [
  { name: "Pagaram e nunca acessaram", params: "f_atividade=nunca&f_acesso=com" },
  { name: "Travados no onboarding", params: "f_onboarding=incompleto" },
  { name: "Sem tokens de IA", params: "f_tokens=zerado" },
  { name: "Acesso vencendo em 7 dias", params: "f_acesso=vencendo" },
  { name: "Inativos há 30+ dias", params: "f_atividade=inativo30" },
  { name: "Ativos na última semana", params: "f_atividade=ativo7" },
];

export default async function SegmentosPage() {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const [tagsSettings, profilesRes, viewsRes] = await Promise.all([
    getSetting<TagsSettings>("student_tags", { tags: [] }),
    db.from("users_profile").select("tags").eq("is_admin", false).limit(20000),
    db.from("admin_saved_views").select("id, name, params").eq("user_id", profile.user_id).eq("page", "/admin/alunos"),
  ]);

  const usage: Record<string, number> = {};
  for (const p of profilesRes.data ?? []) {
    for (const t of (p.tags ?? []) as string[]) usage[t] = (usage[t] ?? 0) + 1;
  }

  // tags usadas que não estão no catálogo entram na lista
  const catalog = [...tagsSettings.tags];
  for (const name of Object.keys(usage)) {
    if (!catalog.some((c) => c.name === name)) catalog.push({ name, color: "#8b96a8" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Segmentos & Tags</h1>
        <p className="mt-0.5 text-xs text-muted">
          Tags organizam os alunos (VIP, suporte, lote…); segmentos são filtros salvos da lista de alunos.
        </p>
      </div>

      <TagCatalogEditor tags={catalog} usage={usage} />

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Segmentos prontos</h2>
        <ul className="space-y-1">
          {PRESET_SEGMENTS.map((s) => (
            <li key={s.name}>
              <Link
                href={`/admin/alunos?${s.params}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Users className="size-3.5 text-muted-2" />
                <span className="flex-1">{s.name}</span>
                <ArrowRight className="size-3.5 text-muted-2" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Suas views salvas de alunos</h2>
        <p className="mb-3 text-[11px] text-muted-2">
          Monte qualquer filtro na lista de Alunos e salve pelo botão “Views” — aparece aqui e fixado na sidebar.
        </p>
        {(viewsRes.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-2">Nenhuma view salva ainda.</p>
        ) : (
          <ul className="space-y-1">
            {(viewsRes.data ?? []).map((v) => (
              <li key={v.id}>
                <Link
                  href={`/admin/alunos?${v.params}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <Pin className="size-3.5 text-muted-2" />
                  <span className="flex-1">{v.name}</span>
                  <ArrowRight className="size-3.5 text-muted-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-2">
          {num((profilesRes.data ?? []).length)} alunos no total.
        </p>
      </div>
    </div>
  );
}
