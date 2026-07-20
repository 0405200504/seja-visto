import { BadgeCheck, Gift, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/app/page-header";
import { BONUSES, BASE_ENTITLEMENT } from "@/lib/bonuses";
import { StudentCard } from "@/components/admin/student-card";

export default async function AdminAlunosPage() {
  const { supabase } = await requireAdmin();

  // Executa todas as consultas ao banco em paralelo para melhor performance
  const [
    { data: profiles }, 
    { data: entitlements },
    { data: progressRows },
    { count: totalLessons }
  ] = await Promise.all([
    supabase
      .from("users_profile")
      .select("user_id, name, email, is_admin, onboarding_completed, created_at, style_goal, preferred_style, main_difficulty")
      .order("created_at", { ascending: false }),
    supabase.from("user_entitlements").select("user_id, entitlement"),
    supabase.from("user_progress").select("user_id").eq("completed", true),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
  ]);

  // Busca o último acesso na API de Admin (opcional - sem service key falha silenciosamente)
  const lastSignIn = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.last_sign_in_at) lastSignIn.set(u.id, u.last_sign_in_at);
    }
  } catch {
    // Segue sem a coluna de último acesso
  }

  // Agrupa entitlements por usuário
  const entitlementsByUser = new Map<string, string[]>();
  for (const e of entitlements ?? []) {
    entitlementsByUser.set(e.user_id, [...(entitlementsByUser.get(e.user_id) ?? []), e.entitlement]);
  }

  // Agrupa progresso de aulas concluídas por usuário
  const progressByUser = new Map<string, number>();
  for (const row of progressRows ?? []) {
    progressByUser.set(row.user_id, (progressByUser.get(row.user_id) ?? 0) + 1);
  }

  const students = profiles ?? [];
  const withBonus = students.filter(
    (p) => (entitlementsByUser.get(p.user_id) ?? []).some((e) => e !== BASE_ENTITLEMENT)
  ).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Alunos"
        description="Todas as contas da plataforma, com tempo de casa e acessos liberados."
      />

      {/* Cards de Métricas Rápidas */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Users className="size-3.5" /> Alunos
          </div>
          <p className="mt-1 text-2xl font-bold">{students.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Gift className="size-3.5" /> Com pelo menos 1 bônus
          </div>
          <p className="mt-1 text-2xl font-bold">{withBonus}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <BadgeCheck className="size-3.5" /> Onboarding completo
          </div>
          <p className="mt-1 text-2xl font-bold">
            {students.filter((p) => p.onboarding_completed).length}
          </p>
        </div>
      </div>

      {/* Lista de Alunos Interativos */}
      <div className="space-y-3.5">
        {students.map((p) => {
          const keys = entitlementsByUser.get(p.user_id) ?? [];
          const seen = lastSignIn.get(p.user_id);

          return (
            <StudentCard
              key={p.user_id}
              student={p}
              entitlements={keys}
              lastSeen={seen}
              completedLessonsCount={progressByUser.get(p.user_id) ?? 0}
              totalLessonsCount={totalLessons ?? 0}
            />
          );
        })}

        {students.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
            Nenhum aluno cadastrado no sistema ainda.
          </p>
        )}
      </div>
    </div>
  );
}

