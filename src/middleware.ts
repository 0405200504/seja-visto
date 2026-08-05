import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  // Roda em Portland, colado no Supabase (us-west-2). Sem isso o middleware
  // executa no nó de borda mais perto do aluno (São Paulo) e cada
  // `auth.getUser()` vira uma ida e volta de ~180ms até Oregon — em TODA
  // navegação. Mesma região das funções em vercel.json, de propósito.
  regions: ["pdx1"],
};
