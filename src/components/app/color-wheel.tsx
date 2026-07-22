"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Roda cromática interativa do bônus "Aprenda a combinar cores".
 * Serve de imagem-exemplo (o próprio círculo em SVG) e de ferramenta:
 * escolha uma cor base e uma relação e veja a tradução vestível.
 */

type Hue = {
  /** Nome da cor pura no círculo. */
  name: string;
  /** Versão dessaturada/vestível (como isso vira roupa). */
  wearName: string;
  /** Hex vivo (mostra a teoria no círculo). */
  vivid: string;
  /** Hex vestível (dessaturado — como usar de verdade). */
  wear: string;
};

/** 12 matizes na ordem do círculo cromático, com a tradução vestível de cada uma. */
const HUES: Hue[] = [
  { name: "Vermelho", wearName: "Vinho", vivid: "#E23B3B", wear: "#8C3B3B" },
  { name: "Laranja-vermelho", wearName: "Terracota", vivid: "#E8622E", wear: "#A45B3C" },
  { name: "Laranja", wearName: "Caramelo", vivid: "#EF8A2B", wear: "#B5793F" },
  { name: "Âmbar", wearName: "Mostarda", vivid: "#F0B429", wear: "#B79246" },
  { name: "Amarelo", wearName: "Bege quente", vivid: "#E9D01E", wear: "#C9B77A" },
  { name: "Lima", wearName: "Verde-seco", vivid: "#9FC93C", wear: "#7E8B4A" },
  { name: "Verde", wearName: "Verde-oliva", vivid: "#4CA64C", wear: "#5E6B43" },
  { name: "Verde-azulado", wearName: "Petróleo", vivid: "#2FA88A", wear: "#3C6B62" },
  { name: "Azul", wearName: "Navy", vivid: "#2F6BF0", wear: "#2E4372" },
  { name: "Índigo", wearName: "Índigo escuro", vivid: "#4B4FD8", wear: "#3E4066" },
  { name: "Violeta", wearName: "Ameixa", vivid: "#7A43D6", wear: "#574168" },
  { name: "Magenta", wearName: "Bordô rosado", vivid: "#C0409B", wear: "#7A4258" },
];

type Relation = "complementar" | "analogas" | "triade" | "split" | "mono";

const RELATIONS: { key: Relation; label: string; hint: string }[] = [
  { key: "analogas", label: "Análogas", hint: "Vizinhas no círculo — harmonia suave e elegante." },
  { key: "complementar", label: "Complementar", hint: "Opostas — contraste máximo. Use sempre dessaturadas." },
  { key: "split", label: "Complementar dividida", hint: "Contraste mais fácil de usar que a complementar pura." },
  { key: "triade", label: "Tríade", hint: "Três equidistantes — sofisticada na versão quebrada." },
  { key: "mono", label: "Monocromática", hint: "Um tom só, variando claro e escuro." },
];

const mod = (n: number) => ((n % 12) + 12) % 12;

/** Índices realçados para uma base e uma relação. */
function relatedIndices(base: number, relation: Relation): number[] {
  switch (relation) {
    case "complementar":
      return [base, mod(base + 6)];
    case "analogas":
      return [mod(base - 1), base, mod(base + 1)];
    case "triade":
      return [base, mod(base + 4), mod(base + 8)];
    case "split":
      return [base, mod(base + 5), mod(base + 7)];
    case "mono":
      return [base];
  }
}

/** Clareia (t>0) ou escurece (t<0) um hex — usado na paleta monocromática. */
function shade(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

const CX = 110;
const CY = 110;
const R_OUT = 100;
const R_IN = 54;

function point(radius: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}

/** Path de um segmento (fatia de rosca) do círculo. */
function slicePath(index: number): string {
  const start = index * 30;
  const end = start + 30;
  const [x1o, y1o] = point(R_OUT, start);
  const [x2o, y2o] = point(R_OUT, end);
  const [x1i, y1i] = point(R_IN, start);
  const [x2i, y2i] = point(R_IN, end);
  return `M ${x1o} ${y1o} A ${R_OUT} ${R_OUT} 0 0 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${R_IN} ${R_IN} 0 0 0 ${x1i} ${y1i} Z`;
}

function suggestion(relation: Relation, names: string[]): string {
  const [a, b, c] = names;
  switch (relation) {
    case "complementar":
      return `${a} como base dominante do look e ${b} só no detalhe (calçado, boné, meia). Nunca 50/50.`;
    case "analogas":
      return `${a}, ${b} e ${c} em camadas — harmonia suave, quase monocromática. A forma mais elegante de usar cor.`;
    case "triade":
      return `Base em ${a}, ${b} numa peça e ${c} apenas no acessório. Avançada e sofisticada em versão quebrada.`;
    case "split":
      return `${a} de base, com ${b} e ${c} em doses pequenas. O contraste mais fácil de acertar.`;
    case "mono":
      return `Só ${a}, variando do claro ao escuro. Mantenha a mesma temperatura (não misture quente com frio).`;
  }
}

export function ColorWheel() {
  const [base, setBase] = useState(8); // Azul → Navy
  const [relation, setRelation] = useState<Relation>("analogas");

  const related = relatedIndices(base, relation);
  const relatedSet = new Set(related);
  const activeRelation = RELATIONS.find((r) => r.key === relation)!;

  // Swatches vestíveis que aparecem no painel.
  const wearSwatches =
    relation === "mono"
      ? [
          { color: shade(HUES[base].wear, 0.32), label: `${HUES[base].wearName} claro` },
          { color: HUES[base].wear, label: HUES[base].wearName },
          { color: shade(HUES[base].wear, -0.35), label: `${HUES[base].wearName} escuro` },
        ]
      : related.map((i) => ({ color: HUES[i].wear, label: HUES[i].wearName }));

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          Ferramenta interativa
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold">Roda cromática — experimente</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Toque numa cor do círculo e escolha uma relação. Veja na hora como aquela teoria vira uma
        combinação vestível (na versão dessaturada, que é como cor se usa de verdade).
      </p>

      <div className="mt-5 grid items-start gap-6 sm:grid-cols-[minmax(0,240px)_1fr]">
        {/* Círculo (SVG) */}
        <div className="mx-auto w-full max-w-[240px]">
          <svg viewBox="0 0 220 220" className="w-full" role="img" aria-label="Roda cromática interativa">
            {HUES.map((h, i) => {
              const isRelated = relatedSet.has(i);
              const isBase = i === base;
              return (
                <path
                  key={i}
                  d={slicePath(i)}
                  fill={h.vivid}
                  onClick={() => setBase(i)}
                  className={cn(
                    "cursor-pointer transition-all duration-300 [transform-box:fill-box] [transform-origin:center]",
                    isRelated ? "opacity-100" : "opacity-25 hover:opacity-60"
                  )}
                  stroke={isBase ? "var(--color-foreground)" : isRelated ? "var(--color-surface)" : "transparent"}
                  strokeWidth={isBase ? 3 : 2}
                />
              );
            })}
            {/* Miolo */}
            <circle cx={CX} cy={CY} r={R_IN - 2} className="fill-surface" />
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              className="fill-muted text-[9px]"
              style={{ fontSize: 9 }}
            >
              cor base
            </text>
            <text
              x={CX}
              y={CY + 10}
              textAnchor="middle"
              className="fill-foreground font-semibold"
              style={{ fontSize: 13 }}
            >
              {HUES[base].wearName}
            </text>
          </svg>
        </div>

        {/* Controles + resultado */}
        <div>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRelation(r.key)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  relation === r.key
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-2">{activeRelation.hint}</p>

          {/* Swatches vestíveis */}
          <div className="mt-4 flex flex-wrap gap-3">
            {wearSwatches.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className="size-12 rounded-xl border border-border shadow-inner"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[11px] font-medium text-muted">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Sugestão de look */}
          <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft/50 p-4">
            <p className="text-xs font-semibold text-accent">Como vestir</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
              {suggestion(
                relation,
                relation === "mono"
                  ? [HUES[base].wearName]
                  : related.map((i) => HUES[i].wearName)
              )}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-2">
        Regra de ouro: neutros (preto, branco, cinza, bege, marrom) entram em qualquer combinação —
        as cores acima são o seu tempero por cima da base neutra.
      </p>
    </section>
  );
}
