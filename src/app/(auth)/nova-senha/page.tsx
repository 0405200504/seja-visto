import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { updatePassword } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Nova senha" };

export default function NovaSenhaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm action={updatePassword} submitLabel="Salvar nova senha">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo de 6 caracteres" required minLength={6} autoComplete="new-password" />
          </div>
        </AuthForm>
      </CardContent>
    </Card>
  );
}
