import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { LookForm } from "@/components/admin/look-form";

export default async function NovoLookPage() {
  await requireAdmin();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Novo look" description="Adicione uma combinação ao lookbook." />
      <LookForm />
    </div>
  );
}
