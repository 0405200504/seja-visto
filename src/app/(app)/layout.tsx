import { after } from "next/server";
import { requirePaidAccess } from "@/lib/auth";
import { Sidebar, MobileHeader } from "@/components/app/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bloqueia no servidor: quem não tem acesso pago é redirecionado para
  // /acesso-expirado e o conteúdo nunca chega a ser renderizado.
  // Esconder com CSS não servia — o HTML ia inteiro para o navegador.
  const { supabase, profile } = await requirePaidAccess();

  // Marca o último acesso (no máx. 1x a cada 30 min) — alimenta "Ativos" e a
  // coluna "Última atividade" do admin.
  // Vai em `after()`: é telemetria, ninguém precisa esperar esse write para ver
  // a tela. Antes ele segurava a renderização de TODA página do app.
  const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0;
  if (Date.now() - lastSeen > 30 * 60 * 1000) {
    after(async () => {
      await supabase
        .from("users_profile")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", profile.user_id);
    });
  }

  return (
    <div className="relative min-h-dvh">
      <Sidebar isAdmin={profile.is_admin} name={profile.name} />
      <MobileHeader isAdmin={profile.is_admin} name={profile.name} />
      <main className="pb-10 pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
