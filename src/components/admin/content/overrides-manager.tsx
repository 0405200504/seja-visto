"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronRight, Eye, EyeOff, Loader2, RotateCcw } from "lucide-react";
import {
  reorderOverridesAction,
  resetOverrideAction,
  saveOverrideFieldAction,
  setOverrideHiddenAction,
} from "@/app/actions/admin/overrides";
import { SortableList } from "@/components/admin/ui/sortable-list";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm } from "@/components/admin/ui/confirm";
import type { ContentKind } from "@/lib/content-overrides";
import { cn } from "@/lib/utils";

export type OverrideField = { name: string; label: string; textarea?: boolean };

export type OverrideItem = {
  slug: string;
  hidden: boolean;
  overridden: boolean;
  /** valores JÁ com override aplicado */
  values: Record<string, string>;
  /** linha informativa (nº de seções, fotos etc.) */
  info?: string;
};

/**
 * Editor padrão de conteúdo estático com overrides: edite textos (autosave),
 * oculte itens e arraste para reordenar — vale na hora para os alunos.
 */
export function OverridesManager({
  kind,
  fields,
  items,
  canReorder = true,
  canHide = true,
}: {
  kind: ContentKind;
  fields: OverrideField[];
  items: OverrideItem[];
  canReorder?: boolean;
  canHide?: boolean;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const renderItem = (item: OverrideItem) => (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpenSlug((o) => (o === item.slug ? null : item.slug))}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {openSlug === item.slug ? (
            <ChevronDown className="size-4 shrink-0 text-muted-2" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-2" />
          )}
          <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", item.hidden ? "text-muted-2 line-through" : "text-foreground")}>
            {item.values[fields[0].name] || item.slug}
          </span>
          {item.overridden && (
            <span className="shrink-0 rounded-full border border-accent/30 bg-accent-soft px-2 py-px text-[10px] font-semibold text-[#7ea2ff]">
              editado
            </span>
          )}
          {item.info && <span className="hidden shrink-0 text-[11px] text-muted-2 sm:inline">{item.info}</span>}
        </button>

        {item.overridden && (
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Restaurar o texto original?",
                message: "As edições feitas neste item são descartadas e ele volta ao conteúdo original do produto.",
                confirmLabel: "Restaurar original",
                danger: false,
              });
              if (!ok) return;
              const res = await resetOverrideAction(kind, item.slug);
              toast({ title: res.message, kind: res.ok ? "success" : "error" });
              router.refresh();
            }}
            className="shrink-0 rounded-md p-1 text-muted-2 transition-colors hover:text-foreground"
            title="Restaurar texto original"
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
        {canHide && (
          <button
            onClick={async () => {
              const res = await setOverrideHiddenAction(kind, item.slug, !item.hidden);
              toast({
                title: res.message,
                kind: res.ok ? "success" : "error",
                undo: res.ok ? async () => { await setOverrideHiddenAction(kind, item.slug, item.hidden); router.refresh(); } : undefined,
              });
              router.refresh();
            }}
            className="shrink-0 rounded-md p-1 text-muted-2 transition-colors hover:text-foreground"
            title={item.hidden ? "Mostrar para os alunos" : "Ocultar dos alunos"}
          >
            {item.hidden ? <EyeOff className="size-3.5 text-[#e5a83b]" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </div>

      {openSlug === item.slug && (
        <div className="mt-2 space-y-2.5 rounded-lg border border-border bg-surface-2/50 p-3">
          {fields.map((f) => (
            <OverrideFieldInput key={f.name} kind={kind} slug={item.slug} field={f} initial={item.values[f.name] ?? ""} />
          ))}
        </div>
      )}
    </div>
  );

  if (!canReorder) {
    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slug} className="rounded-xl border border-border bg-surface px-3 py-2">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <SortableList
      onReorder={(slugs) => reorderOverridesAction(kind, slugs)}
      items={items.map((item) => ({ id: item.slug, node: renderItem(item) }))}
    />
  );
}

function OverrideFieldInput({
  kind, slug, field, initial,
}: {
  kind: ContentKind;
  slug: string;
  field: OverrideField;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setState("saving");
      const res = await saveOverrideFieldAction(kind, slug, field.name, next);
      setState(res.ok ? "saved" : "error");
      if (res.ok) router.refresh();
    }, 800);
  };

  const cls =
    "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none";

  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        {field.label}
        {state === "saving" && <Loader2 className="size-3 animate-spin text-muted-2" />}
        {state === "saved" && <CheckCircle2 className="size-3 text-success" />}
        {state === "error" && <span className="text-danger">erro ao salvar</span>}
      </label>
      {field.textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
