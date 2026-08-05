import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { mensagemDoMotivo, verificarToken } from "@/lib/links-acesso";
import { REGRA_SENHA } from "@/lib/senha";
import { definirSenhaComToken } from "@/app/actions/definir-senha";
import { resetPassword } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Criar senha" };

/* Nunca cacheia: a validade do link é decidida no momento do clique. */
export const dynamic = "force-dynamic";

/**
 * Tela de criar/redefinir senha pelo link do e-mail.
 *
 * O token vem no CAMINHO da URL, de propósito. No fluxo antigo ele chegava
 * no fragmento (`#access_token=…`), que só o navegador enxerga: bastava o
 * link ser aberto em outro aparelho, ou o JavaScript falhar, para a pessoa
 * cair numa tela sem formulário nenhum. Aqui quem confere é o servidor, e a
 * página sempre mostra uma das duas coisas: o formulário ou o motivo pelo
 * qual o link não serve mais — com o caminho para pedir outro.
 */
export default async function DefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = createAdminClient();
  const conferencia = await verificarToken(db, decodeURIComponent(token));

  if (!conferencia.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Link fora de validade</CardTitle>
          <CardDescription>Pedir outro leva menos de um minuto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {mensagemDoMotivo(conferencia.motivo)}
          </div>

          {/* O formulário fica aqui mesmo: mandar a pessoa para outra
              página só para digitar o e-mail perde gente no caminho. */}
          <AuthForm action={resetPassword} submitLabel="Receber um link novo">
            <div className="space-y-2">
              <Label htmlFor="email">Seu e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@email.com"
                defaultValue={conferencia.email ?? ""}
                required
                autoComplete="email"
              />
            </div>
          </AuthForm>

          <p className="text-center text-sm text-muted">
            Já tem senha?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const primeiraSenha = conferencia.finalidade === "acesso";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {primeiraSenha ? "Criar sua senha" : "Definir nova senha"}
        </CardTitle>
        <CardDescription>
          {primeiraSenha
            ? "Escolha a senha que você vai usar para entrar no MPO."
            : "Escolha uma nova senha para a sua conta."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm
          action={definirSenhaComToken}
          submitLabel={primeiraSenha ? "Criar senha e entrar" : "Salvar nova senha"}
        >
          <input type="hidden" name="token" value={token} />

          <div className="space-y-2">
            <Label htmlFor="conta">Conta</Label>
            <Input id="conta" value={conferencia.email} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={REGRA_SENHA}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmacao">Repita a senha</Label>
            <Input
              id="confirmacao"
              name="confirmacao"
              type="password"
              placeholder="A mesma senha de novo"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </AuthForm>

        <p className="mt-6 text-center text-xs text-muted-2">{REGRA_SENHA}</p>
      </CardContent>
    </Card>
  );
}
