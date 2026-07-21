import { requireProfile } from "@/lib/auth";
import { Sidebar, MobileHeader } from "@/components/app/app-nav";
import { signOut } from "@/app/actions/auth";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionSimulator } from "@/components/app/subscription-simulator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile } = await requireProfile();

  // Verifica se a assinatura está expirada (base entitlement)
  let isExpired = false;
  let expiresAtStr = "";

  if (!profile.is_admin) {
    const { data: baseEntit } = await supabase
      .from("user_entitlements")
      .select("expires_at")
      .eq("user_id", profile.user_id)
      .eq("entitlement", "base")
      .maybeSingle();

    if (!baseEntit) {
      isExpired = true;
    } else if (baseEntit.expires_at) {
      const expiry = new Date(baseEntit.expires_at);
      if (expiry < new Date()) {
        isExpired = true;
        expiresAtStr = expiry.toLocaleDateString("pt-BR");
      }
    }
  }

  // O link de renovação prioritário é a variável de ambiente, senão a página principal
  const renewUrl = process.env.NEXT_PUBLIC_RENEW_URL ?? "https://manualpraticodooutfit.vercel.app";

  return (
    <div className="relative min-h-dvh">
      {/* Container principal da plataforma - Embaçado se expirado */}
      <div id="app-layout-container" className={isExpired ? "filter blur-md select-none pointer-events-none" : ""}>
        <Sidebar isAdmin={profile.is_admin} name={profile.name} />
        <MobileHeader isAdmin={profile.is_admin} name={profile.name} />
        <main className="pb-10 pt-14 lg:pl-64 lg:pt-0">
          <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10">
            {children}
          </div>
        </main>
      </div>

      {/* Pop-up de Assinatura Expirada */}
      {isExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center shadow-2xl animate-zoom-in">
            {/* Brilho superior de gradiente */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-blue-500 to-indigo-600" />
            
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertCircle className="size-6 animate-pulse" />
            </div>

            <h2 className="mt-4 text-base font-bold text-foreground">
              Acesso Expirado
            </h2>
            
            <p className="mt-2.5 text-xs leading-relaxed text-muted">
              Olá, <strong className="text-foreground">{(profile.name || "Aluno").split(" ")[0]}</strong>. 
              Seu período de acesso ao <strong className="text-foreground">Manual Prático do Outfit (MPO)</strong> expirou{expiresAtStr ? ` em ${expiresAtStr}` : ""}. 
              Renove sua assinatura para liberar imediatamente toda a plataforma, looks e o consultor de IA.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <a href={renewUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-11 text-xs font-semibold gap-1.5 shadow-lg shadow-accent/20">
                  <RefreshCw className="size-3.5" />
                  Renovar Assinatura
                </Button>
              </a>

              <form action={signOut}>
                <Button variant="ghost" type="submit" className="w-full h-10 text-xs font-medium text-muted hover:text-foreground gap-1.5">
                  <LogOut className="size-3.5" />
                  Sair da Conta
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simulador de testes visuais via query parameters no navegador */}
      <SubscriptionSimulator name={profile.name || "Aluno"} />
    </div>
  );
}
