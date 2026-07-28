import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { NewLookForm } from "@/components/admin/content/new-look-form";

export default async function NovoLookPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/conteudo/looks" className="mb-2 flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="size-3" /> Todos os looks
      </Link>
      <h1 className="font-display text-xl font-bold text-foreground">Novo look</h1>
      <p className="mt-0.5 text-xs text-muted">
        Comece pelo essencial — imagem, peças e detalhes você completa na tela seguinte (salva sozinha).
      </p>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <NewLookForm />
      </div>
    </div>
  );
}
