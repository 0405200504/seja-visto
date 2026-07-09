"use client";

import { useEffect, useState } from "react";
import { Ruler, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FIELDS = [
  { key: "ombro", label: "Ombro a ombro (cm)" },
  { key: "peito", label: "Peito / tórax (cm)" },
  { key: "cintura", label: "Cintura (cm)" },
  { key: "quadril", label: "Quadril (cm)" },
  { key: "entrepernas", label: "Entrepernas (cm)" },
  { key: "comprimento", label: "Comprimento de camiseta (cm)" },
];

const STORAGE_KEY = "vista-se:medidas";

function shirtSize(chest: number): string | null {
  if (!chest || chest < 70) return null;
  if (chest < 96) return "P";
  if (chest < 104) return "M";
  if (chest < 112) return "G";
  if (chest < 120) return "GG";
  return "XGG";
}

export function MeasureForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setValues(JSON.parse(stored));
    } catch {
      // localStorage indisponível — segue sem persistência
    }
  }, []);

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // sem persistência
    }
  }

  const size = shirtSize(Number(values.peito));

  return (
    <div className="rounded-2xl border border-accent/25 bg-surface p-5 shadow-card sm:p-6">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
        <Ruler className="size-3.5" />
        Suas medidas
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold">
        Anote aqui e nunca mais perca
      </h3>
      <p className="mt-1 text-sm text-muted">
        Fica salvo neste dispositivo — consulte na hora de comprar.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs text-muted">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="number"
              inputMode="decimal"
              placeholder="—"
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      {size && (
        <p className="mt-4 rounded-xl bg-accent-soft/60 px-4 py-3 text-sm text-foreground/90">
          Com {values.peito} cm de tórax, seu ponto de partida em camisetas é o tamanho{" "}
          <span className="font-display text-base font-bold text-accent">{size}</span> — confira
          sempre a tabela específica de cada marca.
        </p>
      )}

      <Button variant="secondary" size="sm" className="mt-4" onClick={save}>
        <Save className="size-3.5" />
        {saved ? "Salvo!" : "Salvar medidas"}
      </Button>
    </div>
  );
}
