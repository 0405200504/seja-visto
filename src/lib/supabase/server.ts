import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client do Supabase para Server Components / Actions.
 *
 * Envolvido no `cache()` do React: dentro da MESMA requisição, layout e página
 * passam a compartilhar uma única instância em vez de criar uma nova cada vez.
 * Isso é o que permite deduplicar o `getUser()` em `@/lib/auth`.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — o middleware renova a sessão.
          }
        },
      },
    }
  );
});
