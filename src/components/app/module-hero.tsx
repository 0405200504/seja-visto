import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ModuleCover } from "@/components/app/module-cover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/**
 * Topo da página de um módulo: mesma linguagem do billboard do Método (capa
 * borrada ao fundo, pôster nítido na frente), com o progresso das aulas.
 *
 * Sangra para as bordas do container, então precisa ser o primeiro elemento
 * da página.
 */
export function ModuleHero({
  title,
  description,
  coverUrl,
  index,
  feitas,
  total,
}: {
  title: string;
  description: string | null;
  coverUrl: string | null;
  index: number;
  feitas: number;
  total: number;
}) {
  const pct = total ? Math.round((feitas / total) * 100) : 0;

  return (
    <section className="relative isolate -mx-4 -mt-6 mb-8 overflow-hidden sm:-mx-6 sm:-mt-10 lg:-mx-10">
      <div aria-hidden className="absolute inset-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            priority
            /* Borrada de propósito: 480px de largura já bastam. */
            sizes="480px"
            className="scale-110 object-cover object-center opacity-70 blur-2xl saturate-150 brightness-125"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-3 via-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-transparent" />
      </div>

      <div className="relative px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7 lg:px-10 lg:pb-12">
        <Link
          href="/metodo"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para o método
        </Link>

        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5 sm:gap-x-6 lg:items-end lg:gap-x-8">
          <div className="relative col-start-1 row-start-1 w-28 shrink-0 self-center overflow-hidden rounded-xl border border-white/10 shadow-2xl sm:w-36 lg:row-span-2 lg:w-48 lg:self-end lg:rounded-2xl">
            <div className="relative aspect-[4/5]">
              <ModuleCover
                coverUrl={coverUrl}
                title={title}
                index={index}
                priority
                sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 192px"
              />
            </div>
          </div>

          <div className="col-start-2 row-start-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              Módulo {String(index).padStart(2, "0")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                {title}
              </h1>
              {pct === 100 && (
                <Badge variant="success">
                  <CheckCircle2 className="size-3" />
                  Concluído
                </Badge>
              )}
            </div>
          </div>

          <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2">
            {description && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                {description}
              </p>
            )}
            <div className="mt-5 max-w-sm">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>
                  {feitas}/{total} aulas concluídas
                </span>
                <span className="font-medium text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
