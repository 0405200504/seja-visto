"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mantém a página de alertas atualizada sozinha.
 *
 * Usa router.refresh(), que refaz só a renderização no servidor e troca o
 * conteúdo no lugar — a página não pisca e você não perde o scroll.
 *
 * Pausa sozinho quando a aba sai de foco. Sem isso, uma aba esquecida aberta
 * a semana toda ficaria consultando o banco a cada 30 segundos para ninguém.
 */
export function AutoRefresh({
  geradoEm,
  intervaloSegundos = 30,
}: {
  geradoEm: string;
  intervaloSegundos?: number;
}) {
  const router = useRouter();
  const [pausado, setPausado] = useState(false);
  const [restante, setRestante] = useState(intervaloSegundos);
  const [atualizando, startTransition] = useTransition();

  /* router e startTransition são estáveis, então este callback também é — e
   * o timer abaixo não reinicia a cada render por causa dele. */
  const atualizar = useCallback(() => {
    startTransition(() => router.refresh());
    setRestante(intervaloSegundos);
  }, [router, intervaloSegundos]);

  useEffect(() => {
    if (pausado) return;

    const tick = setInterval(() => {
      // Aba em segundo plano: segura o contador em vez de consultar o banco.
      if (document.hidden) return;
      setRestante((s) => {
        if (s <= 1) {
          atualizar();
          return intervaloSegundos;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [pausado, intervaloSegundos, atualizar]);

  const hora = new Date(geradoEm).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="tabular-nums">
        Atualizado às {hora}
        {!pausado && !atualizando && ` · próxima em ${restante}s`}
        {atualizando && " · atualizando…"}
      </span>

      <button
        type="button"
        onClick={atualizar}
        aria-label="Atualizar agora"
        className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <RefreshCw className={cn("size-3.5", atualizando && "animate-spin")} />
      </button>

      <button
        type="button"
        onClick={() => setPausado((p) => !p)}
        aria-label={pausado ? "Retomar atualização automática" : "Pausar atualização automática"}
        aria-pressed={pausado}
        className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {pausado ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      </button>
    </div>
  );
}
