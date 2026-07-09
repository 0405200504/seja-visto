import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { WardrobeForm } from "@/components/admin/wardrobe-form";
import type { WardrobeItem } from "@/lib/types";

export default async function EditarPecaPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const { supabase } = await requireAdmin();

  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", itemId)
    .single<WardrobeItem>();

  if (!item) notFound();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Editar peça" description={item.name} />
      <WardrobeForm item={item} />
    </div>
  );
}
