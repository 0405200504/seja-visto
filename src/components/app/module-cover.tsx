import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Capa do módulo com fallback editorial numerado.
 * O elemento pai precisa ter `position: relative` e proporção definida.
 */
export function ModuleCover({
  coverUrl,
  title,
  index,
  className,
}: {
  coverUrl: string | null;
  title: string;
  index: number;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <Image
        src={coverUrl}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-end overflow-hidden bg-gradient-to-br from-surface-3 via-surface to-background p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-accent/15 blur-3xl" />
      <span className="pointer-events-none absolute -right-2 -top-7 font-display text-[110px] font-bold leading-none text-white/[0.06]">
        {String(index).padStart(2, "0")}
      </span>
      <span className="relative font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
        Módulo {String(index).padStart(2, "0")}
      </span>
    </div>
  );
}
