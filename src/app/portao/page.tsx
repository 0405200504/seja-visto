import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { abrirPortao } from "@/app/actions/portao";
import { VENDAS_ABREM_EM, vendasAbertas } from "@/lib/lancamento";

export const metadata: Metadata = {
  title: "Acesso antecipado",
  // Cinto e suspensório: além do robots.txt, esta página se declara
  // não-indexável para nunca aparecer numa busca.
  robots: { index: false, follow: false },
};

// A tela depende da hora atual (abre sozinha na data marcada), então não
// pode ser congelada no build.
export const dynamic = "force-dynamic";

const formatador = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default function PortaoPage() {
  // Passou da data? Não existe mais portão — segue direto para as vendas.
  if (vendasAbertas()) redirect("/");

  const abertura = new Date(VENDAS_ABREM_EM);
  const quando = Number.isNaN(abertura.getTime()) ? null : formatador.format(abertura);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-accent/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_transparent_40%,_rgb(6_8_12)_100%)]" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Lock className="size-4 text-accent" />
            </div>
            <CardTitle className="text-xl">Ainda não abrimos</CardTitle>
            <CardDescription>
              {quando
                ? `O Manual Prático do Outfit abre dia ${quando}. Até lá, só entra quem recebeu a senha de acesso antecipado.`
                : "O Manual Prático do Outfit ainda não abriu. Até lá, só entra quem recebeu a senha de acesso antecipado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm action={abrirPortao} submitLabel="Entrar">
              <div className="space-y-2">
                <Label htmlFor="senha">Senha de acesso</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </AuthForm>

            <p className="mt-6 text-center text-sm text-muted">
              Já é aluno?{" "}
              <a href="/login" className="font-medium text-accent hover:underline">
                Entrar na plataforma
              </a>
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-2">
          Manual Prático do Outfit · por Raphael Pereira
        </p>
      </div>
    </div>
  );
}
