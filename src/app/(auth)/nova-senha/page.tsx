import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthForm } from "@/components/app/auth-form";
import { RecoverySession } from "@/components/app/recovery-session";
import { updatePassword } from "@/app/actions/auth";
import { REGRA_SENHA } from "@/lib/senha";

export const metadata: Metadata = { title: "Nova senha" };

/**
 * Tela antiga, mantida só para os links do Supabase que ainda estejam em
 * caixas de entrada. Os links novos vão para /definir-senha/[token], que
 * não depende de sessão nem de fragmento de URL.
 */

export default function NovaSenhaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* O token do link de acesso chega no fragmento da URL e precisa
            virar sessão antes do formulário ser útil. Ver o componente. */}
        <RecoverySession>
          <AuthForm action={updatePassword} submitLabel="Salvar nova senha">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              {/* O mínimo real é 8, e com letra e número: o Supabase recusa
                  qualquer coisa abaixo disso. Prometer 6 aqui só fazia a
                  pessoa levar um "não foi possível atualizar a senha". */}
              <Input id="password" name="password" type="password" placeholder={REGRA_SENHA} required minLength={8} autoComplete="new-password" />
            </div>
          </AuthForm>
        </RecoverySession>
      </CardContent>
    </Card>
  );
}
