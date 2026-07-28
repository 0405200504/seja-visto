"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ilikePattern } from "@/lib/admin/list";
import { brl, dateShort } from "@/lib/admin/format";

export type SearchGroup = {
  label: string;
  items: { title: string; sub?: string; href: string }[];
};

/** Busca global do Cmd+K: alunos, looks, peças, aulas e transações. */
export async function globalSearchAction(q: string): Promise<SearchGroup[]> {
  await requireAdmin();
  const term = q.trim();
  if (term.length < 2) return [];

  const db = createAdminClient();
  const like = ilikePattern(term);

  const [students, looks, pieces, lessons, sales] = await Promise.all([
    db
      .from("users_profile")
      .select("user_id, name, email")
      .or(`name.ilike.${like},email.ilike.${like}`)
      .limit(5),
    db
      .from("looks")
      .select("id, title, style")
      .is("deleted_at", null)
      .ilike("title", like)
      .limit(5),
    db
      .from("wardrobe_items")
      .select("id, name, category")
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(4),
    db
      .from("lessons")
      .select("id, title, module_id, modules(title)")
      .is("deleted_at", null)
      .ilike("title", like)
      .limit(4),
    db
      .from("sales")
      .select("id, email, name, amount_cents, created_at")
      .or(`email.ilike.${like},name.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const groups: SearchGroup[] = [];

  if (students.data?.length) {
    groups.push({
      label: "Alunos",
      items: students.data.map((s) => ({
        title: s.name ?? "Sem nome",
        sub: s.email ?? undefined,
        href: `/admin/alunos/${s.user_id}`,
      })),
    });
  }
  if (looks.data?.length) {
    groups.push({
      label: "Looks",
      items: looks.data.map((l) => ({
        title: l.title,
        sub: l.style,
        href: `/admin/conteudo/looks/${l.id}`,
      })),
    });
  }
  if (pieces.data?.length) {
    groups.push({
      label: "Peças",
      items: pieces.data.map((p) => ({
        title: p.name,
        sub: p.category,
        href: `/admin/conteudo/pecas?q=${encodeURIComponent(p.name)}`,
      })),
    });
  }
  if (lessons.data?.length) {
    groups.push({
      label: "Aulas",
      items: lessons.data.map((l) => ({
        title: l.title,
        sub: (l.modules as unknown as { title: string } | null)?.title,
        href: `/admin/conteudo/metodo/${l.module_id}?aula=${l.id}`,
      })),
    });
  }
  if (sales.data?.length) {
    groups.push({
      label: "Transações",
      items: sales.data.map((s) => ({
        title: `${s.name ?? s.email} — ${brl(s.amount_cents)}`,
        sub: dateShort(s.created_at),
        href: `/admin/receita/transacoes?q=${encodeURIComponent(s.email)}`,
      })),
    });
  }

  return groups;
}
