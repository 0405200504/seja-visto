"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Prateleira horizontal de módulos (estilo streaming).
 *
 * No celular é só scroll com snap — nada de setas ocupando espaço nem
 * dependência de hover. No desktop aparecem as setas, e elas só existem no DOM
 * quando há conteúdo para aquele lado.
 *
 * Os cards vêm como children renderizados no servidor: este componente só
 * cuida do scroll.
 */
export function ModuleRail({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(false);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTemAntes(el.scrollLeft > 8);
    setTemDepois(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);

  const rolar = (direcao: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direcao * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="group/rail">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h2>
        {hint && <span className="shrink-0 text-xs text-muted">{hint}</span>}
      </div>

      <div className="relative">
        <div
          ref={ref}
          onScroll={medir}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 sm:gap-4",
            "snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-10",
            // Sangra até a borda da tela para o card "espiar" no celular.
            "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {children}
        </div>

        {temAntes && (
          <button
            type="button"
            aria-label="Ver módulos anteriores"
            onClick={() => rolar(-1)}
            className="absolute -left-3 top-[42%] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-background/90 text-foreground opacity-0 shadow-card backdrop-blur transition hover:bg-surface-2 group-hover/rail:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 lg:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {temDepois && (
          <button
            type="button"
            aria-label="Ver próximos módulos"
            onClick={() => rolar(1)}
            className="absolute -right-3 top-[42%] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-background/90 text-foreground opacity-0 shadow-card backdrop-blur transition hover:bg-surface-2 group-hover/rail:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 lg:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
}
