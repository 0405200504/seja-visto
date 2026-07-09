import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { STYLE_GOALS, STYLES } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: users },
    { count: looks },
    { count: modules },
    { count: lessons },
    { count: items },
    { data: profiles },
    { data: progressRows },
    { count: totalLessons },
  ] = await Promise.all([
    supabase.from("users_profile").select("*", { count: "exact", head: true }),
    supabase.from("looks").select("*", { count: "exact", head: true }),
    supabase.from("modules").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("wardrobe_items").select("*", { count: "exact", head: true }),
    supabase
      .from("users_profile")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<Profile[]>(),
    supabase.from("user_progress").select("user_id").eq("completed", true),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
  ]);

  const doneByUser = new Map<string, number>();
  for (const row of progressRows ?? []) {
    doneByUser.set(row.user_id, (doneByUser.get(row.user_id) ?? 0) + 1);
  }

  const stats = [
    { label: "Usuários", value: users ?? 0 },
    { label: "Looks", value: looks ?? 0 },
    { label: "Módulos", value: modules ?? 0 },
    { label: "Aulas", value: lessons ?? 0 },
    { label: "Peças", value: items ?? 0 },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Visão geral"
        description="Conteúdo cadastrado e usuários da plataforma."
      />

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="font-display text-2xl font-bold text-accent">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Usuários cadastrados</h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3.5 font-medium">Nome</th>
              <th className="px-5 py-3.5 font-medium">Objetivo</th>
              <th className="px-5 py-3.5 font-medium">Estilo</th>
              <th className="px-5 py-3.5 font-medium">Onboarding</th>
              <th className="px-5 py-3.5 font-medium">Progresso</th>
              <th className="px-5 py-3.5 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const done = doneByUser.get(p.user_id) ?? 0;
              const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="px-5 py-3.5 font-medium">
                    {p.name ?? "—"}
                    {p.is_admin && (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-accent">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {STYLE_GOALS[p.style_goal ?? ""] ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {STYLES[p.preferred_style ?? ""] ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.onboarding_completed ? (
                      <span className="text-success">Completo</span>
                    ) : (
                      <span className="text-muted">Pendente</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {done} aulas · {pct}%
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
