import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { ModuleForm } from "@/components/admin/module-form";

export default async function NovoModuloPage() {
  await requireAdmin();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Novo módulo"
        description="Depois de criar, você poderá adicionar as aulas."
      />
      <ModuleForm />
    </div>
  );
}
