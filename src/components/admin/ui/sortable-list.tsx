"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Reordenação por drag-and-drop (substitui o campo "ordem" digitado).
 * Persiste a nova ordem em lote via server action, com UI otimista.
 */
export function SortableList({
  items,
  onReorder,
  className,
}: {
  items: { id: string; node: React.ReactNode }[];
  onReorder: (ids: string[]) => Promise<{ ok: boolean; message?: string }>;
  className?: string;
}) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [saving, setSaving] = useState(false);
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => setOrder(items.map((i) => i.id)), [items.map((i) => i.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = new Map(items.map((i) => [i.id, i.node]));

  const drop = async (targetId: string) => {
    const from = dragId.current;
    dragId.current = null;
    setOverId(null);
    if (!from || from === targetId) return;

    const prev = [...order];
    const next = [...order];
    next.splice(next.indexOf(targetId), 0, next.splice(next.indexOf(from), 1)[0]);
    setOrder(next);
    setSaving(true);
    try {
      const res = await onReorder(next);
      if (!res.ok) throw new Error(res.message);
      router.refresh();
    } catch (err) {
      setOrder(prev);
      toast({ title: err instanceof Error ? err.message : "Erro ao reordenar.", kind: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {saving && (
        <span className="absolute -top-6 right-0 flex items-center gap-1 text-[11px] text-muted">
          <Loader2 className="size-3 animate-spin" /> Salvando ordem…
        </span>
      )}
      <ul className="space-y-2">
        {order.map((id) => (
          <li
            key={id}
            draggable
            onDragStart={() => (dragId.current = id)}
            onDragOver={(e) => { e.preventDefault(); setOverId(id); }}
            onDragLeave={() => setOverId((o) => (o === id ? null : o))}
            onDrop={() => drop(id)}
            className={cn(
              "flex items-start gap-2 rounded-xl border bg-surface transition-all",
              overId === id && dragId.current !== id ? "border-accent" : "border-border"
            )}
          >
            <span className="cursor-grab p-3 text-muted-2 active:cursor-grabbing" title="Arraste para reordenar">
              <GripVertical className="size-4" />
            </span>
            <div className="min-w-0 flex-1 py-2 pr-3">{byId.get(id)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
