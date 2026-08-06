import type { MetadataRoute } from "next";
import { vendasAbertas } from "@/lib/lancamento";

// Depende da data de abertura, então é calculado a cada pedido — senão o
// arquivo congelaria no build com o site ainda fechado.
export const dynamic = "force-dynamic";

/** Áreas que nunca devem entrar em busca, nem com as vendas abertas. */
const PRIVADO = [
  "/api/",
  "/admin",
  "/auth/",
  "/l/",
  "/portao",
  "/dashboard",
  "/perfil",
  "/guarda-roupa",
  "/plano-de-acao",
  "/fit-check",
  "/favoritos",
  "/onboarding",
  "/definir-senha",
  "/nova-senha",
  "/recuperar-senha",
  "/acesso-expirado",
];

export default function robots(): MetadataRoute.Robots {
  // Antes da abertura o site inteiro fica fora dos buscadores: é o que impede
  // a página de vendas de vazar numa pesquisa antes da hora.
  if (!vendasAbertas()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVADO }],
  };
}
