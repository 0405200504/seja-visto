import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { NewPieceForm } from "@/components/admin/content/new-piece-form";

export default async function NovaPecaPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/conteudo/pecas" className="mb-2 flex items-center gap-1 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="size-3" /> Todas as peças
      </Link>
      <h1 className="font-display text-xl font-bold text-foreground">Nova peça</h1>
      <p className="mt-0.5 text-xs text-muted">Descrição, como usar e imagem você completa na tela seguinte.</p>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <NewPieceForm />
      </div>
    </div>
  );
}
