import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { ModuleCover } from "@/components/app/module-cover";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModuleCardData } from "@/components/app/module-poster";

/**
 * Destaque no topo do Método, no formato "billboard" das plataformas de
 * streaming: a própria capa entra borrada como fundo e o pôster aparece
 * nítido na frente.
 *
 * Sangra para as bordas do container (`-mx-*`/`-mt-*` cancelam o respiro do
 * layout) — por isso precisa ser o primeiro elemento da página.
 */
export function ModuleBillboard({
  mod,
  description,
  resumo,
}: {
  mod: ModuleCardData;
  description: string | null;
  /** Linha de apoio ao lado do botão, ex.: "38 aulas no método · 12% concluído". */
  resumo: string;
}) {
  const pct = mod.total ? Math.round((mod.done / mod.total) * 100) : 0;
  const comecou = mod.done > 0;

  return (
    <section className="relative isolate -mx-4 -mt-6 mb-10 overflow-hidden sm:-mx-6 sm:-mt-10 sm:mb-12 lg:-mx-10">
      <div aria-hidden className="absolute inset-0">
        {mod.coverUrl ? (
          <Image
            src={mod.coverUrl}
            alt=""
            fill
            priority
            /* Imagem borrada: não precisa de resolução — 480px basta e
               economiza banda no celular. */
            sizes="480px"
            /* Brilho e saturação puxados para cima: as capas são fotos
               escuras e, borradas atrás do preto do app, sumiriam. */
            className="scale-110 object-cover object-center opacity-70 blur-2xl saturate-150 brightness-125"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-3 via-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
      </div>

      {/* No celular o pôster fica ao lado do título (duas colunas) e o resto do
          texto ocupa a largura inteira; no desktop o pôster sobe para a altura
          das duas linhas. Mesmo HTML nos dois casos — nada duplicado. */}
      <div className="relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5 px-4 pb-8 pt-8 sm:gap-x-6 sm:px-6 sm:pb-12 sm:pt-12 lg:items-end lg:gap-x-8 lg:px-10 lg:pb-14 lg:pt-16">
        <Link
          href={`/metodo/${mod.id}`}
          aria-label={`Abrir o módulo ${mod.title}`}
          className="relative col-start-1 row-start-1 block w-28 shrink-0 self-center overflow-hidden rounded-xl border border-white/10 shadow-2xl transition duration-300 motion-safe:hover:-translate-y-0.5 sm:w-36 lg:row-span-2 lg:w-52 lg:self-end lg:rounded-2xl"
        >
          <div className="relative aspect-[4/5]">
            <ModuleCover
              coverUrl={mod.coverUrl}
              title={mod.title}
              index={mod.index}
              priority
              sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 208px"
            />
          </div>
        </Link>

        <div className="col-start-2 row-start-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            {comecou ? "Continue de onde parou" : "Comece por aqui"}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            {mod.title}
          </h1>
        </div>

        <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2">
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {description}
            </p>
          )}

          <div className="mt-5 max-w-sm">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>
                Módulo {mod.index} · {mod.done}/{mod.total} aulas
              </span>
              <span className="font-medium text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href={`/metodo/${mod.id}`} className={cn(buttonVariants(), "min-w-[9.5rem]")}>
              <Play className="fill-current" />
              {comecou ? "Continuar" : "Começar módulo"}
            </Link>
            <span className="text-xs text-muted">{resumo}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
