/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** Capa do módulo com fallback editorial numerado. */
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
    return <img src={coverUrl} alt={title} className={cn("size-full object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        "relative flex size-full items-end overflow-hidden bg-gradient-to-br from-surface-3 via-surface to-background p-5",
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
