import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  if (!slug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Utiliza o cliente de admin (service_role) para contornar políticas de RLS e atualizar a contagem de cliques
  const supabase = createAdminClient();

  // 1. Localiza a URL de destino associada ao slug (links desativados caem na home)
  const { data: link, error } = await supabase
    .from("tracking_links")
    .select("id, destination_url, clicks_count")
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !link) {
    // Se não encontrar ou ocorrer erro, redireciona silenciosamente para a página inicial
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Incrementa o total e registra o clique individual (série diária do admin)
  await Promise.all([
    supabase
      .from("tracking_links")
      .update({ clicks_count: (link.clicks_count ?? 0) + 1 })
      .eq("id", link.id),
    supabase.from("tracking_link_clicks").insert({
      link_id: link.id,
      referer: request.headers.get("referer")?.slice(0, 500) ?? null,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    }),
  ]);

  // 3. Executa o redirecionamento com status 302 (temporário) para evitar que o navegador armazene o redirecionamento em cache
  return NextResponse.redirect(new URL(link.destination_url));
}
