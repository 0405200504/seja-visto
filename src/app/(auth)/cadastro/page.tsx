import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { signUp } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crie sua conta</CardTitle>
        <CardDescription>
          Comece agora a construir um estilo com presença e intenção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm action={signUp} submitLabel="Criar conta">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Seu nome" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo de 6 caracteres" required minLength={6} autoComplete="new-password" />
          </div>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
