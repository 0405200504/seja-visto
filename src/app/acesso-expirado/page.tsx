import type { Metadata } from "next";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso expirado" };

/**
 * Fora do grupo (app) de propósito: quem cai aqui não tem acesso pago,
 * então não pode passar pelo layout protegido — daria laço de redirect.
 */
export default async function AcessoExpiradoPage({
  searchParams,
}: {
  searchParams: Promise<{ venceu?: string }>;
}) {
  const { profile } = await requireProfile();
  const { venceu } = await searchParams;

  const venceuEm = venceu
    ? new Date(venceu).toLocaleDateString("pt-BR")
    : null;

  const renewUrl =
    process.env.NEXT_PUBLIC_RENEW_URL ?? "https://manualpraticodooutfit.vercel.app";

  const primeiroNome = (profile.name || "Aluno").split(" ")[0];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-blue-500 to-indigo-600" />

        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning">
          <AlertCircle className="size-6" />
        </div>

        <h1 className="mt-4 text-base font-bold text-foreground">
          {venceuEm ? "Acesso expirado" : "Acesso não liberado"}
        </h1>

        <p className="mt-2.5 text-xs leading-relaxed text-muted">
          Olá, <strong className="text-foreground">{primeiroNome}</strong>.{" "}
          {venceuEm ? (
            <>
              Seu período de acesso ao{" "}
              <strong className="text-foreground">Manual Prático do Outfit</strong>{" "}
              expirou em {venceuEm}. Renove para liberar de novo toda a
              plataforma, as combinações e o consultor de IA.
            </>
          ) : (
            <>
              Ainda não encontramos uma compra ativa na sua conta. Se você
              acabou de comprar, aguarde alguns minutos e recarregue a página.
              Se o problema continuar, responda o e-mail da compra que a gente
              resolve.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a href={renewUrl} target="_blank" rel="noopener noreferrer">
            <Button className="h-11 w-full gap-1.5 text-xs font-semibold shadow-lg shadow-accent/20">
              <RefreshCw className="size-3.5" />
              {venceuEm ? "Renovar assinatura" : "Ver como comprar"}
            </Button>
          </a>

          <form action={signOut}>
            <Button
              variant="ghost"
              type="submit"
              className="h-10 w-full gap-1.5 text-xs font-medium text-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sair da conta
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
