"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Footprints, Pencil, Shirt, Shuffle, Layers } from "lucide-react";
import { saveCapsule, type CapsulePieces } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const GUIDE_TOPS = ["Camiseta lisa branca", "Moletom cinza", "Camisa azul-clara"];
const GUIDE_BOTTOMS = ["Jeans azul baggy", "Jorts camuflado", "Calça preta reta"];
const GUIDE_SHOES = ["Retrô runner", "Tênis fino", "Work boot"];

// Formalidade de cada opção do guia (0 = casual, 2 = arrumado)
const FORMALITY = { top: [1, 0, 2], bottom: [1, 0, 2], shoe: [0, 2, 1] };

const OCCASIONS = [
  "Fim de semana, rolês leves e dia a dia sem esforço.",
  "Dia a dia elevado: faculdade, encontros casuais, passeios.",
  "Casual arrumado: almoços, happy hour, primeiro encontro.",
  "Smart casual: trabalho, jantares e eventos casuais.",
  "O mais elegante da cápsula: reunião importante, jantar especial, noite.",
];

function tipFor(t: number, b: number, s: number): string {
  if (t === 0 && b === 0 && s === 0) return "Camiseta branca, baggy e retrô runner: o uniforme do street atual. Impossível errar.";
  if (t === 2 && b === 2 && s === 1) return "O topo da formalidade da cápsula — camisa, calça preta e tênis fino fecham qualquer jantar.";
  if (t === 1 && b === 1) return "Conforto máximo de fim de semana — o camuflado pede o resto do look liso e neutro.";
  if (t === 1 && b === 2 && s === 2) return "Moletom, calça preta e work boot: o look de frio pronto — só falta o café.";
  if (b === 1) return "Jorts camuflado é estampa: mantenha a parte de cima lisa e o tênis discreto.";
  if (s === 2) return "O work boot aterra o look — deixe a barra da calça cair reta por cima do cano.";
  if (t === 2 && s === 0) return "Camisa com retrô runner: arrumado em cima, despretensioso embaixo.";
  if (b === 2) return "A calça preta reta eleva qualquer parte de cima — até o moletom.";
  if (b === 0 && t !== 0) return "Baggy embaixo pede a parte de cima mais próxima do corpo — o contraste define a silhueta.";
  return "Combinação equilibrada da cápsula: caimento certo e peças limpas fazem o resto.";
}

function normalize(capsule?: CapsulePieces | null): CapsulePieces {
  const fill = (arr?: string[]) => Array.from({ length: 3 }, (_, i) => arr?.[i] ?? "");
  return { tops: fill(capsule?.tops), bottoms: fill(capsule?.bottoms), shoes: fill(capsule?.shoes) };
}

function isComplete(c: CapsulePieces): boolean {
  return [...c.tops, ...c.bottoms, ...c.shoes].every((p) => p.trim().length > 0);
}

export function OutfitBuilder({ capsule }: { capsule?: CapsulePieces | null }) {
  const initial = normalize(capsule);
  const [saved, setSaved] = useState<CapsulePieces>(initial);
  const [mode, setMode] = useState<"guia" | "minha">(isComplete(initial) ? "minha" : "guia");

  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [shoe, setShoe] = useState(0);
  const [seenByMode, setSeenByMode] = useState<Record<"guia" | "minha", Set<string>>>({
    guia: new Set(["0-0-0"]),
    minha: new Set(["0-0-0"]),
  });

  const mine = mode === "minha";
  const complete = isComplete(saved);
  const seen = seenByMode[mode];

  const TOPS = mine ? saved.tops : GUIDE_TOPS;
  const BOTTOMS = mine ? saved.bottoms : GUIDE_BOTTOMS;
  const SHOES = mine ? saved.shoes : GUIDE_SHOES;

  const formality =
    FORMALITY.top[top] + FORMALITY.bottom[bottom] + FORMALITY.shoe[shoe];
  const occasion = OCCASIONS[Math.min(4, Math.floor((formality / 6) * 5))];
  const comboNumber = top * 9 + bottom * 3 + shoe + 1;

  const tip = useMemo(() => tipFor(top, bottom, shoe), [top, bottom, shoe]);

  function markSeen(m: "guia" | "minha", key: string) {
    setSeenByMode((prev) => ({ ...prev, [m]: new Set(prev[m]).add(key) }));
  }

  function select(kind: "top" | "bottom" | "shoe", index: number) {
    const next = {
      top: kind === "top" ? index : top,
      bottom: kind === "bottom" ? index : bottom,
      shoe: kind === "shoe" ? index : shoe,
    };
    if (kind === "top") setTop(index);
    if (kind === "bottom") setBottom(index);
    if (kind === "shoe") setShoe(index);
    markSeen(mode, `${next.top}-${next.bottom}-${next.shoe}`);
  }

  function shuffle() {
    const t = Math.floor(Math.random() * 3);
    const b = Math.floor(Math.random() * 3);
    const s = Math.floor(Math.random() * 3);
    setTop(t);
    setBottom(b);
    setShoe(s);
    markSeen(mode, `${t}-${b}-${s}`);
  }

  function switchMode(m: "guia" | "minha") {
    if (m === mode) return;
    setMode(m);
    setTop(0);
    setBottom(0);
    setShoe(0);
    markSeen(m, "0-0-0");
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
    <div className="space-y-6">
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

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => switchMode("guia")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
              !mine
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface-2 text-muted hover:text-foreground"
            )}
          >
            Peças do guia
          </button>
          <button
            type="button"
            onClick={() => switchMode("minha")}
            disabled={!complete}
            title={!complete ? "Preencha suas 9 peças abaixo para desbloquear" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
              mine
                ? "border-accent bg-accent-soft text-foreground cursor-pointer"
                : complete
                  ? "border-border bg-surface-2 text-muted hover:text-foreground cursor-pointer"
                  : "border-border/50 bg-surface/50 text-muted/40 cursor-not-allowed"
            )}
          >
            Minhas peças {!complete && "🔒"}
          </button>
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
                    key={`${i}-${option}`}
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

        {!mine && (
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
        )}

        {mine && (
          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-medium text-foreground">Suas peças, seus looks: </span>
              tire uma foto de cada combinação que funcionar — no fim você terá seu próprio
              lookbook de 27 outfits sem comprar nada.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Você já explorou{" "}
            <span className="font-display font-semibold text-accent">{seen.size}/27</span>{" "}
            combinações{mine && " com as suas peças"}
          </p>
          <Progress value={(seen.size / 27) * 100} className="max-w-32" />
        </div>
        {seen.size === 27 && (
          <p className="mt-3 rounded-xl border border-success/25 bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
            🏆 Todas as 27 exploradas! Agora você sabe o poder de uma cápsula bem montada.
          </p>
        )}
      </div>

      <CapsuleEditor
        saved={saved}
        onSaved={(pieces) => {
          setSaved(pieces);
          if (isComplete(pieces)) switchMode("minha");
        }}
      />
    </div>
  );
}

const SLOT_GROUPS: {
  key: keyof CapsulePieces;
  label: string;
  icon: typeof Shirt;
  placeholders: string[];
}[] = [
  {
    key: "tops",
    label: "Partes de cima",
    icon: Shirt,
    placeholders: ["Ex: Camiseta branca", "Ex: Moletom cinza", "Ex: Camisa azul"],
  },
  {
    key: "bottoms",
    label: "Partes de baixo",
    icon: Layers,
    placeholders: ["Ex: Jeans azul", "Ex: Calça preta", "Ex: Bermuda bege"],
  },
  {
    key: "shoes",
    label: "Calçados",
    icon: Footprints,
    placeholders: ["Ex: Tênis branco", "Ex: Tênis retrô", "Ex: Bota"],
  },
];

function CapsuleEditor({
  saved,
  onSaved,
}: {
  saved: CapsulePieces;
  onSaved: (pieces: CapsulePieces) => void;
}) {
  const [draft, setDraft] = useState<CapsulePieces>(saved);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);

  const filled = [...draft.tops, ...draft.bottoms, ...draft.shoes].filter(
    (p) => p.trim().length > 0
  ).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function setSlot(key: keyof CapsulePieces, index: number, value: string) {
    setFeedback(null);
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].map((v, i) => (i === index ? value : v)),
    }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveCapsule(draft);
      if (result.error) {
        setFeedback("error");
      } else {
        setFeedback("saved");
        onSaved(normalize(draft));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <Pencil className="size-3" />
            Sua cápsula
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold">
            Monte os 27 com as SUAS peças
          </h3>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted">{filled}/9 peças</span>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Preencha os 9 espaços com peças que você já tem no guarda-roupa (que combinem entre
        si!) e o montador acima passa a usar as suas peças.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        {SLOT_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <group.icon className="size-3.5" />
              {group.label}
            </p>
            <div className="space-y-2">
              {group.placeholders.map((placeholder, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={60}
                  value={draft[group.key][i]}
                  placeholder={placeholder}
                  onChange={(e) => setSlot(group.key, i, e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 transition-colors focus:border-accent focus:outline-none"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          {pending ? "Salvando..." : "Salvar minhas 9 peças"}
        </Button>
        {feedback === "saved" && !dirty && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <Check className="size-3.5" />
            Cápsula salva na sua conta!
          </span>
        )}
        {feedback === "error" && (
          <span className="text-xs font-medium text-danger">
            Não foi possível salvar. Tente novamente.
          </span>
        )}
        {filled > 0 && filled < 9 && (
          <span className="text-xs text-muted">
            Complete as 9 para desbloquear o modo &quot;Minhas peças&quot;.
          </span>
        )}
      </div>
    </div>
  );
}
