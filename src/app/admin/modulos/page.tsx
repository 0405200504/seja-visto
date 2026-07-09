import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import type { Module } from "@/lib/types";

export default async function AdminModulosPage() {
  const { supabase } = await requireAdmin();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("modules").select("*").order("order_index").returns<Module[]>(),
    supabase.from("lessons").select("module_id"),
  ]);

  const lessonCount = new Map<string, number>();
  for (const l of lessons ?? []) {
    lessonCount.set(l.module_id, (lessonCount.get(l.module_id) ?? 0) + 1);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Módulos & Aulas"
        description={`${modules?.length ?? 0} módulos no método.`}
        action={
          <Link href="/admin/modulos/novo">
            <Button>
              <Plus className="size-4" />
              Novo módulo
            </Button>
          </Link>
        }
      />

      <div className="space-y-2.5">
        {(modules ?? []).map((mod, i) => (
          <div
            key={mod.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft font-display text-sm font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{mod.title}</p>
                <p className="text-xs text-muted">
                  {lessonCount.get(mod.id) ?? 0} aulas · ordem {mod.order_index}
                </p>
              </div>
            </div>
            <Link href={`/admin/modulos/${mod.id}`} className="shrink-0">
              <Button variant="secondary" size="sm">
                <Pencil className="size-3.5" />
                Editar módulo e aulas
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
