import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { WardrobeForm } from "@/components/admin/wardrobe-form";

export default async function NovaPecaPage() {
  await requireAdmin();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Nova peça" description="Adicione uma peça ao guarda-roupa essencial." />
      <WardrobeForm />
    </div>
  );
}
