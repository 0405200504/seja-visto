"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BASE_COLORS, COLOR_SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Combo = { name: string; colors: string[]; note: string };

const COMBOS: Record<string, Combo[]> = {
  preto: [
    { name: "Presença total", colors: ["preto", "cinza"], note: "O duo noturno definitivo — varie as texturas para dar profundidade." },
    { name: "Contraste limpo", colors: ["preto", "branco"], note: "O contraste máximo: gráfico, atemporal e impossível de errar." },
    { name: "Aquecido", colors: ["preto", "bege"], note: "O bege tira o peso do preto — perfeito para o dia." },
  ],
  branco: [
    { name: "Luz total", colors: ["branco", "bege"], note: "Verão editorial — ancore com calçado ou acessório escuro." },
    { name: "Náutico", colors: ["branco", "azul"], note: "O clássico que nunca falha, do trabalho ao passeio." },
    { name: "Recorte", colors: ["branco", "preto"], note: "Base branca com âncoras pretas: minimalismo com força." },
  ],
  bege: [
    { name: "Terroso", colors: ["bege", "marrom"], note: "Gradiente de terra: quente, sofisticado e raro de ver bem-feito." },
    { name: "Militar suave", colors: ["bege", "verde"], note: "O verde-oliva adora o bege — dupla de outono perfeita." },
    { name: "Contraste seco", colors: ["bege", "preto"], note: "Preto sobre bege claro: contraste elegante de verão." },
  ],
  cinza: [
    { name: "Monocromático", colors: ["cinza", "preto"], note: "Tons de carvão empilhados — profundidade sem esforço." },
    { name: "Frio limpo", colors: ["cinza", "branco"], note: "Claro, moderno e sereno. Ideal para o minimalismo." },
    { name: "Inesperado", colors: ["cinza", "vinho"], note: "O vinho acende o cinza — combinação avançada e memorável." },
  ],
  azul: [
    { name: "Clássico eterno", colors: ["azul", "branco"], note: "Navy + branco: a combinação mais confiável do guarda-roupa masculino." },
    { name: "Old money", colors: ["azul", "bege"], note: "Navy com caramelo/bege é herança aristocrática — elegância imediata." },
    { name: "Profundo", colors: ["azul", "cinza"], note: "Dois frios que se completam: perfeito para o trabalho." },
  ],
  marrom: [
    { name: "Câmara de couro", colors: ["marrom", "preto"], note: "Pesado e masculino — ideal para noite e inverno." },
    { name: "Terra e luz", colors: ["marrom", "branco"], note: "O branco arejando o marrom: contraste quente e limpo." },
    { name: "Outono completo", colors: ["marrom", "verde"], note: "Dois terrosos profundos — a paleta das jaquetas e botas." },
  ],
  verde: [
    { name: "Militar clássico", colors: ["verde", "preto"], note: "Verde-oliva ancorado no preto: força sem esforço." },
    { name: "Campo", colors: ["verde", "bege"], note: "A dupla de outono mais fácil de usar — quente e natural." },
    { name: "Fresco", colors: ["verde", "branco"], note: "Verde sobre branco: verão com personalidade." },
  ],
  vinho: [
    { name: "Noite profunda", colors: ["vinho", "preto"], note: "O vinho brilha sobre o preto — presença rara e sofisticada." },
    { name: "Inverno inglês", colors: ["vinho", "cinza"], note: "Bordô com cinza é biblioteca londrina: intelectual e quente." },
    { name: "Clássico nobre", colors: ["vinho", "azul"], note: "Vinho + navy: profundidade dupla para looks de frio." },
  ],
};

export function ColorMixer() {
  const [base, setBase] = useState("azul");
  const combos = COMBOS[base] ?? [];

  return (
    <div className="rounded-2xl border border-accent/25 bg-surface p-5 shadow-card sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
        Combinador de cores
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold">
        Escolha sua cor base
      </h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(BASE_COLORS).map(([slug, label]) => (
          <button
            key={slug}
            type="button"
            onClick={() => setBase(slug)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
              base === slug
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-foreground"
            )}
          >
            <span
              className="size-3.5 rounded-full ring-1 ring-white/20"
              style={{ background: COLOR_SWATCHES[slug] }}
            />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {combos.map((combo) => (
          <div
            key={combo.name}
            className="flex items-center gap-4 rounded-xl bg-surface-2 p-4"
          >
            <div className="flex shrink-0 -space-x-1.5">
              {combo.colors.map((c) => (
                <span
                  key={c}
                  className="size-8 rounded-full ring-2 ring-surface"
                  style={{ background: COLOR_SWATCHES[c] }}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{combo.name}</p>
              <p className="text-xs leading-relaxed text-muted sm:text-sm">{combo.note}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/combinacoes?cor=${base}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        Ver looks do lookbook com base {BASE_COLORS[base]?.toLowerCase()}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
