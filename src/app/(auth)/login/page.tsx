import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { signIn } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Entre para acessar suas combinações, módulos e plano de ação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm action={signIn} submitLabel="Entrar">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/recuperar-senha" className="text-xs text-accent hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
          </div>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/#planos" className="font-medium text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
