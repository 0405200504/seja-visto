"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { pinterestPageVisit } from "@/lib/pinterest";

/**
 * Mesma história do pixel do Meta: o snippet do Pinterest só conta a visita do
 * carregamento inicial. Como o site é uma SPA, aqui a visita é disparada a cada
 * troca de rota.
 */
export function PinterestTagRoutes() {
  const pathname = usePathname();
  const primeiraRota = useRef(true);

  useEffect(() => {
    if (primeiraRota.current) {
      // O `page` do carregamento o snippet já contou.
      primeiraRota.current = false;
    } else {
      window.pintrk?.("page");
    }
    // O `pagevisit` não vem no snippet, então vale também na primeira tela.
    pinterestPageVisit();
  }, [pathname]);

  return null;
}
