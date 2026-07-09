"use client";

import { useMemo, useState } from "react";
import { Footprints, Shirt, Shuffle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const TOPS = ["Camiseta branca lisa", "Camiseta preta lisa", "Camisa azul-clara"];
const BOTTOMS = ["Jeans escuro reto", "Chino bege", "Alfaiataria cinza"];
const SHOES = ["Tênis branco minimalista", "Chelsea boot preta", "Tênis retrô"];

// Formalidade de cada opção (0 = casual, 2 = arrumado)
const FORMALITY = { top: [0, 0, 2], bottom: [0, 1, 2], shoe: [1, 2, 0] };

const OCCASIONS = [
  "Fim de semana, rolês leves e dia a dia sem esforço.",
  "Dia a dia elevado: faculdade, encontros casuais, passeios.",
  "Casual arrumado: almoços, happy hour, primeiro encontro.",
  "Smart casual: trabalho, jantares e eventos casuais.",
  "O mais elegante da cápsula: reunião importante, jantar especial, noite.",
];

function tipFor(t: number, b: number, s: number): string {
  if (t === 1 && b === 0 && s === 1) return "O clássico noturno: adicione uma jaqueta e vá direto pro bar.";
  if (t === 0 && b === 0 && s === 0) return "O look mais confiável da história da moda masculina. Impossível errar.";
  if (t === 2 && b === 2 && s === 1) return "O topo da formalidade da cápsula — pronto para qualquer reunião.";
  if (t === 1 && b === 2 && s === 1) return "Elegância sem esforço: preto sobre cinza é presença silenciosa.";
  if (t === 0 && b === 1 && s === 0) return "Verão em estado puro: claro, leve e fresco.";
  if (s === 2) return "O tênis retrô injeta personalidade — deixe o resto do look limpo.";
  if (t === 2 && s === 0) return "Camisa com tênis branco: arrumado em cima, moderno embaixo.";
  if (b === 2) return "A alfaiataria eleva qualquer parte de cima — até a camiseta mais básica.";
  return "Combinação equilibrada da cápsula: caimento certo e peças limpas fazem o resto.";
}

export function OutfitBuilder() {
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [shoe, setShoe] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(() => new Set(["0-0-0"]));

  const formality =
    FORMALITY.top[top] + FORMALITY.bottom[bottom] + FORMALITY.shoe[shoe];
  const occasion = OCCASIONS[Math.min(4, Math.floor((formality / 6) * 5))];
  const comboNumber = top * 9 + bottom * 3 + shoe + 1;

  const tip = useMemo(() => tipFor(top, bottom, shoe), [top, bottom, shoe]);

  function select(kind: "top" | "bottom" | "shoe", index: number) {
    const next = {
      top: kind === "top" ? index : top,
      bottom: kind === "bottom" ? index : bottom,
      shoe: kind === "shoe" ? index : shoe,
    };
    if (kind === "top") setTop(index);
    if (kind === "bottom") setBottom(index);
    if (kind === "shoe") setShoe(index);
    setSeen((s) => new Set(s).add(`${next.top}-${next.bottom}-${next.shoe}`));
  }

  function shuffle() {
    const t = Math.floor(Math.random() * 3);
    const b = Math.floor(Math.random() * 3);
    const s = Math.floor(Math.random() * 3);
    setTop(t);
    setBottom(b);
    setShoe(s);
    setSeen((prev) => new Set(prev).add(`${t}-${b}-${s}`));
  }

  const rows: {
    label: string;
    icon: typeof Shirt;
    options: string[];
    value: number;
    kind: "top" | "bottom" | "shoe";
  }[] = [
    { label: "Parte de cima", icon: Shirt, options: TOPS, value: top, kind: "top" },
    { label: "Parte de baixo", icon: Layers, options: BOTTOMS, value: bottom, kind: "bottom" },
    { label: "Calçado", icon: Footprints, options: SHOES, value: shoe, kind: "shoe" },
  ];

  return (
    <div className="rounded-2xl border border-accent/25 bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            Montador interativo
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            Outfit #{comboNumber} de 27
          </h3>
        </div>
        <Button variant="secondary" size="sm" onClick={shuffle}>
          <Shuffle className="size-3.5" />
          Sortear
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.kind}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <row.icon className="size-3.5" />
              {row.label}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {row.options.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(row.kind, i)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    row.value === i
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-surface-2 p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>Formalidade</span>
          <span>
            {formality <= 1 ? "Casual" : formality <= 3 ? "Casual arrumado" : "Elegante"}
          </span>
        </div>
        <Progress value={(formality / 6) * 100} />
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-medium text-foreground">Onde usar: </span>
          {occasion}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-accent/90">💡 {tip}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Você já explorou{" "}
          <span className="font-display font-semibold text-accent">{seen.size}/27</span>{" "}
          combinações
        </p>
        <Progress value={(seen.size / 27) * 100} className="max-w-32" />
      </div>
      {seen.size === 27 && (
        <p className="mt-3 rounded-xl border border-success/25 bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
          🏆 Todas as 27 exploradas! Agora você sabe o poder de uma cápsula bem montada.
        </p>
      )}
    </div>
  );
}
