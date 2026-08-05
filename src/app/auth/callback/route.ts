import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  /* A troca falha quando o link é aberto em outro navegador ou aparelho:
   * o verificador do PKCE ficou no navegador que pediu. Mandar a pessoa
   * para o login sem dizer nada era o buraco em que ela sumia — agora cai
   * na tela de pedir um link novo, com o motivo escrito. */
  return NextResponse.redirect(`${origin}/recuperar-senha?erro=link`);
}
