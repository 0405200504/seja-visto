"use client";

import { useEffect } from "react";
import { pinterestEnhancedMatch } from "@/lib/pinterest";

/**
 * Informa à tag do Pinterest quem é o aluno logado, pra ele casar a compra com
 * o clique no anúncio. Só existe dentro do app: na página de vendas a visita é
 * anônima, não há e-mail nenhum pra passar.
 *
 * O e-mail vem pronto do layout (que já carregou o perfil) — nada de consulta
 * extra ao banco por causa disso.
 */
export function PinterestEnhancedMatch({ email }: { email?: string | null }) {
  useEffect(() => {
    if (email) pinterestEnhancedMatch(email);
  }, [email]);

  return null;
}
