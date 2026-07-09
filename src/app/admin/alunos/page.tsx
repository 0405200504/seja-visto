import { BadgeCheck, Gift, ShieldCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { BONUSES, BASE_ENTITLEMENT } from "@/lib/bonuses";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "há 1 mês" : `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "há 1 ano" : `há ${years} anos`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function bonusTitle(key: string): string {
  return BONUSES.find((b) => b.key === key)?.title ?? key;
}

export default async function AdminAlunosPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles }, { data: entitlements }] = await Promise.all([
    supabase
      .from("users_profile")
      .select("user_id, name, email, is_admin, onboarding_completed, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_entitlements").select("user_id, entitlement"),
  ]);

  // Último acesso vem da API administrativa (opcional — sem a service key, só omite)
  const lastSignIn = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.last_sign_in_at) lastSignIn.set(u.id, u.last_sign_in_at);
    }
  } catch {
    // segue sem a coluna de último acesso
  }

  const byUser = new Map<string, string[]>();
  for (const e of entitlements ?? []) {
    byUser.set(e.user_id, [...(byUser.get(e.user_id) ?? []), e.entitlement]);
  }

  const students = profiles ?? [];
  const withBonus = students.filter(
    (p) => (byUser.get(p.user_id) ?? []).some((e) => e !== BASE_ENTITLEMENT)
  ).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Alunos"
        description="Todas as contas da plataforma, com tempo de casa e acessos liberados."
      />

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

      <div className="space-y-2.5">
        {students.map((p) => {
          const keys = byUser.get(p.user_id) ?? [];
          const bonuses = keys.filter((k) => k !== BASE_ENTITLEMENT);
          const hasBase = keys.includes(BASE_ENTITLEMENT);
          const seen = lastSignIn.get(p.user_id);

          return (
            <div
              key={p.user_id}
              className="rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {p.name || "Sem nome"}
                    {p.is_admin && (
                      <Badge variant="accent">
                        <ShieldCheck className="size-3" />
                        Admin
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{p.email ?? "—"}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted">
                  <p>
                    Conta criada {timeAgo(p.created_at)}{" "}
                    <span className="text-muted-2">({formatDate(p.created_at)})</span>
                  </p>
                  <p className="mt-0.5 text-muted-2">
                    {seen ? `Último acesso ${timeAgo(seen)}` : "Nunca entrou"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {hasBase ? (
                  <Badge variant="success">
                    <BadgeCheck className="size-3" />
                    Acesso à plataforma
                  </Badge>
                ) : (
                  <Badge variant="outline">Sem acesso base</Badge>
                )}
                {bonuses.map((k) => (
                  <Badge key={k}>{bonusTitle(k)}</Badge>
                ))}
                {bonuses.length === 0 && (
                  <span className="self-center text-xs text-muted-2">Nenhum bônus</span>
                )}
              </div>
            </div>
          );
        })}

        {students.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
            Nenhum aluno ainda — a primeira venda cria a primeira conta automaticamente.
          </p>
        )}
      </div>
    </div>
  );
}
