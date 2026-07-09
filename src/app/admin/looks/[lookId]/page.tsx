import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { LookForm } from "@/components/admin/look-form";
import type { Look } from "@/lib/types";

export default async function EditarLookPage({
  params,
}: {
  params: Promise<{ lookId: string }>;
}) {
  const { lookId } = await params;
  const { supabase } = await requireAdmin();

  const { data: look } = await supabase
    .from("looks")
    .select("*")
    .eq("id", lookId)
    .single<Look>();

  if (!look) notFound();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Editar look" description={look.title} />
      <LookForm look={look} />
    </div>
  );
}
