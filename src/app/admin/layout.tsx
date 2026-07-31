import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/app/actions/auth";
import { getPeriod } from "@/lib/admin/period-server";
import { contarAlertasCriticos } from "@/lib/admin/alertas";
import { AdminSidebar, AdminContent, type SavedViewLink } from "@/components/admin/shell/admin-sidebar";
import { AdminTopbar } from "@/components/admin/shell/admin-topbar";
import { AdminShortcuts } from "@/components/admin/shell/admin-shortcuts";
import { CommandPalette } from "@/components/admin/shell/command-palette";
import { ToastProvider } from "@/components/admin/ui/toast";
import { ConfirmProvider } from "@/components/admin/ui/confirm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const period = await getPeriod();

  const in7days = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const now = new Date().toISOString();

  // Badges de pendências da sidebar + views salvas fixadas
  const [fitsPendentes, acessosVencendo, looksSemImagem, viewsRes, alertasCriticos] = await Promise.all([
    db.from("community_fits").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db
      .from("user_entitlements")
      .select("*", { count: "exact", head: true })
      .eq("entitlement", "base")
      .not("expires_at", "is", null)
      .gt("expires_at", now)
      .lt("expires_at", in7days),
    db
      .from("looks")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("image_url", null),
    db
      .from("admin_saved_views")
      .select("id, page, name, params")
      .eq("user_id", profile.user_id)
      .order("created_at"),
    contarAlertasCriticos(),
  ]);

  const badges: Record<string, number> = {
    fits_pendentes: fitsPendentes.count ?? 0,
    acessos_vencendo: acessosVencendo.count ?? 0,
    looks_sem_imagem: looksSemImagem.count ?? 0,
    alertas_criticos: alertasCriticos,
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-dvh bg-background">
          <AdminSidebar badges={badges} views={(viewsRes.data ?? []) as SavedViewLink[]} />
          <AdminContent>
            <AdminTopbar
              periodKey={period.key}
              periodLabel={period.label}
              name={profile.name}
              signOutAction={signOut}
            />
            <main className="flex-1 px-4 py-6 sm:px-6">
              <div className="mx-auto w-full max-w-[1400px]">{children}</div>
            </main>
          </AdminContent>
          <AdminShortcuts />
          <CommandPalette />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
