import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-white shadow-[0_0_20px_-4px_rgb(47_107_255/0.7)]">
        PE
      </div>
      <div className="leading-none">
        <span className="font-display text-sm font-semibold tracking-tight">
          Plano Pronto
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          de Estilo
        </span>
      </div>
    </div>
  );
}
