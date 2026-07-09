import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { deleteWardrobeItem } from "@/app/actions/admin";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WARDROBE_CATEGORIES, PRIORITIES } from "@/lib/constants";
import type { WardrobeItem } from "@/lib/types";

export default async function AdminPecasPage() {
  const { supabase } = await requireAdmin();
  const { data: items } = await supabase
    .from("wardrobe_items")
    .select("*")
    .order("category")
    .order("name")
    .returns<WardrobeItem[]>();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Peças do guarda-roupa"
        description={`${items?.length ?? 0} peças cadastradas.`}
        action={
          <Link href="/admin/pecas/novo">
            <Button>
              <Plus className="size-4" />
              Nova peça
            </Button>
          </Link>
        }
      />

      <div className="space-y-2.5">
        {(items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge>{WARDROBE_CATEGORIES[item.category]}</Badge>
                <Badge variant={item.priority === "essencial" ? "accent" : "outline"}>
                  {PRIORITIES[item.priority]}
                </Badge>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/admin/pecas/${item.id}`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
              </Link>
              <form action={deleteWardrobeItem}>
                <input type="hidden" name="id" value={item.id} />
                <Button variant="danger" size="sm" type="submit">
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
