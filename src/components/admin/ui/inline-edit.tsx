"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/utils";

type SaveAction = (value: string) => Promise<{ ok: boolean; message?: string }>;

/**
 * Edição inline: clique → edita → Enter salva, Esc cancela.
 * Usado dentro de células do DataTable e em cabeçalhos de detalhe.
 */
export function InlineText({
  value,
  action,
  placeholder,
  className,
  inputClassName,
  type = "text",
}: {
  value: string;
  action: SaveAction;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  type?: "text" | "number";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(value);
  const toast = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    const next = draft.trim();
    setEditing(false);
    if (next === current) return;
    setSaving(true);
    const prev = current;
    setCurrent(next); // optimistic
    try {
      const res = await action(next);
      if (!res.ok) throw new Error(res.message ?? "Erro ao salvar.");
      router.refresh();
    } catch (err) {
      setCurrent(prev);
      setDraft(prev);
      toast({ title: err instanceof Error ? err.message : "Erro ao salvar.", kind: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type={type}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setDraft(current);
            setEditing(false);
          }
        }}
        className={cn(
          "w-full rounded-md border border-accent bg-surface px-1.5 py-0.5 text-[13px] text-foreground outline-none",
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDraft(current);
        setEditing(true);
      }}
      title="Clique para editar (Enter salva, Esc cancela)"
      className={cn(
        "group/inline inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface-3",
        className
      )}
    >
      <span className={cn("truncate", !current && "text-muted-2 italic")}>
        {current || placeholder || "vazio"}
      </span>
      {saving ? (
        <Loader2 className="size-3 shrink-0 animate-spin text-muted-2" />
      ) : (
        <Pencil className="size-3 shrink-0 text-muted-2 opacity-0 transition-opacity group-hover/inline:opacity-100" />
      )}
    </button>
  );
}

/** Select inline com salvamento imediato. */
export function InlineSelect({
  value,
  options,
  action,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  action: SaveAction;
  className?: string;
}) {
  const [current, setCurrent] = useState(value);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <span className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <select
        value={current}
        disabled={saving}
        onChange={async (e) => {
          const next = e.target.value;
          const prev = current;
          setCurrent(next);
          setSaving(true);
          try {
            const res = await action(next);
            if (!res.ok) throw new Error(res.message);
            router.refresh();
          } catch (err) {
            setCurrent(prev);
            toast({ title: err instanceof Error ? err.message : "Erro ao salvar.", kind: "error" });
          } finally {
            setSaving(false);
          }
        }}
        className={cn(
          "h-7 cursor-pointer rounded-md border border-transparent bg-transparent pr-1 text-[13px] text-foreground transition-colors hover:border-border-strong hover:bg-surface-3 focus:border-accent focus:outline-none",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2">
            {o.label}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="size-3 animate-spin text-muted-2" />}
    </span>
  );
}
