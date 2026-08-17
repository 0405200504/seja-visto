import Link from "next/link";
import { Check, Play } from "lucide-react";
import { ModuleCover } from "@/components/app/module-cover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ModuleCardData = {
  id: string;
  title: string;
  coverUrl: string | null;
  /** Posição do módulo na trilha (1 a 8) — usada no fallback sem capa. */
  index: number;
  total: number;
  done: number;
};

/**
 * Pôster do módulo no formato das capas oficiais (4:5), estilo prateleira de
 * streaming: progresso por cima da arte e play no hover (só no desktop, onde
 * existe cursor). No toque, o card inteiro é o alvo — sem estado de hover
 * preso depois do tap.
 */
export function ModulePoster({
  mod,
  className,
  priority = false,
}: {
  mod: ModuleCardData;
  className?: string;
  priority?: boolean;
}) {
  const pct = mod.total ? Math.round((mod.done / mod.total) * 100) : 0;
  const complete = mod.total > 0 && mod.done >= mod.total;

  return (
    <Link
      href={`/metodo/${mod.id}`}
      aria-label={`${mod.title} — ${mod.done} de ${mod.total} aulas concluídas`}
      className={cn(
        "group block shrink-0 snap-start rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "w-[46vw] max-w-[210px] sm:w-[190px] lg:w-[212px]",
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-card transition duration-300 group-hover:border-border-strong group-hover:shadow-glow motion-safe:group-hover:-translate-y-1">
        <ModuleCover
          coverUrl={mod.coverUrl}
          title={mod.title}
          index={mod.index}
          priority={priority}
          sizes="(max-width: 640px) 46vw, 212px"
          className="transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
        />

        {/* Véu inferior: garante contraste do progresso sobre qualquer foto. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

        {complete && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-success/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg backdrop-blur-sm">
            <Check className="size-3" />
            Concluído
          </span>
        )}

        {/* Play no hover — só onde há cursor. */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:flex">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-black shadow-xl">
            <Play className="size-5 fill-current" />
          </span>
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-white/85">
            <span>
              {mod.done}/{mod.total} aulas
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1 bg-white/25" />
        </div>
      </div>
    </Link>
  );
}
