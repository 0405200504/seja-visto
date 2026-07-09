import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { deleteLook } from "@/app/actions/admin";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OCCASIONS, STYLES, LEVELS } from "@/lib/constants";
import type { Look } from "@/lib/types";

export default async function AdminLooksPage() {
  const { supabase } = await requireAdmin();
  const { data: looks } = await supabase
    .from("looks")
    .select("*")
    .order("created_at")
    .returns<Look[]>();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Looks"
        description={`${looks?.length ?? 0} looks cadastrados no lookbook.`}
        action={
          <Link href="/admin/looks/novo">
            <Button>
              <Plus className="size-4" />
              Novo look
            </Button>
          </Link>
        }
      />

      <div className="space-y-2.5">
        {(looks ?? []).map((look) => (
          <div
            key={look.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{look.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant="accent">{OCCASIONS[look.occasion]}</Badge>
                <Badge>{STYLES[look.style]}</Badge>
                <Badge variant="outline">{LEVELS[look.level]}</Badge>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/admin/looks/${look.id}`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
              </Link>
              <form action={deleteLook}>
                <input type="hidden" name="id" value={look.id} />
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
