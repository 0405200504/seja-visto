import Link from "next/link";
import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { resetPassword } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Recuperar senha" };

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quem chega com ?erro=link veio de um link que não pôde ser
            aproveitado (vencido, já usado, ou aberto em outro aparelho).
            Sem esta faixa, a pessoa não entendia por que voltou para cá. */}
        {erro === "link" && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            Não deu para usar aquele link. Peça um novo abaixo — ele chega no mesmo e-mail e vale
            por 7 dias.
          </div>
        )}

        <AuthForm action={resetPassword} submitLabel="Enviar link de recuperação">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoComplete="email" />
          </div>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-muted">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
