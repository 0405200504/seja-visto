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

  // 2. Incrementa o total e registra o clique num passo só, no banco.
  //    Antes era ler-e-depois-escrever: dois cliques simultâneos liam o mesmo
  //    valor e um deles se perdia.
  await supabase.rpc("registrar_clique", {
    p_link_id: link.id,
    p_referer: request.headers.get("referer")?.slice(0, 500) ?? null,
    p_user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });

  // 3. Só redireciona para destino http(s) — o campo é do admin, mas um
  //    javascript: ou data: aqui viraria XSS a partir do seu próprio domínio.
  let destino: URL;
  try {
    destino = new URL(link.destination_url);
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (destino.protocol !== "https:" && destino.protocol !== "http:") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 302 (temporário) para o navegador não guardar o redirecionamento em cache.
  return NextResponse.redirect(destino);
}
