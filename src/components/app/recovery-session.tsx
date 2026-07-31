"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Ponte entre o link do e-mail e a sessão do usuário.
 *
 * O Supabase tem DOIS jeitos de devolver o acesso depois que a pessoa clica
 * no link, e o projeto usa os dois:
 *
 *  · "Esqueci minha senha" nasce no servidor (PKCE) → volta com `?code=` na
 *    query, e quem troca por sessão é /auth/callback.
 *  · O link de acesso da compra é gerado pelo webhook, sem navegador do lado
 *    de cá (`admin.generateLink`) → volta com `#access_token=…` no FRAGMENTO
 *    da URL. Fragmento nunca é enviado ao servidor: nenhum Server Component
 *    ou Server Action enxerga esse token.
 *
 * Sem este componente, o comprador clicava em "Criar minha senha", caía na
 * tela certa e recebia "Não foi possível atualizar a senha" — porque para o
 * servidor ele não estava logado. Aqui o token do fragmento é lido no
 * navegador, virado em sessão (o client do @supabase/ssr grava nos mesmos
 * cookies que o servidor lê) e apagado da barra de endereços.
 */

type Estado = "verificando" | "pronto" | "invalido";

export function RecoverySession({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>("verificando");
  const router = useRouter();

  useEffect(() => {
    let ativo = true;

    (async () => {
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Tira o token da barra de endereços: ele fica no histórico do
        // navegador e em print de tela se continuar ali.
        window.history.replaceState(null, "", window.location.pathname);
        if (!ativo) return;
        if (error) {
          setEstado("invalido");
          return;
        }
        // Sincroniza os cookies novos com o servidor antes do envio do form.
        router.refresh();
        setEstado("pronto");
        return;
      }

      /* Sem fragmento: ou a pessoa veio pelo /auth/callback (já tem sessão),
       * ou abriu a tela direto. Só o segundo caso é erro. */
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      setEstado(data.session ? "pronto" : "invalido");
    })();

    return () => {
      ativo = false;
    };
  }, [router]);

  if (estado === "verificando") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Verificando seu link de acesso…
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Este link expirou ou já foi usado. Peça um novo — leva menos de um minuto e chega
            no mesmo e-mail.
          </span>
        </div>
        <Link
          href="/recuperar-senha"
          className="block w-full rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Receber um link novo
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
