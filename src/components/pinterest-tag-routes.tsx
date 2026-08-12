"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    pintrk?: (...args: unknown[]) => void;
  }
}

/**
 * Mesma história do pixel do Meta: o snippet do Pinterest só conta a visita do
 * carregamento inicial. Como o site é uma SPA, aqui o `page` é disparado a cada
 * troca de rota, pulando a primeira (que o snippet já contou).
 */
export function PinterestTagRoutes() {
  const pathname = usePathname();
  const primeiraRota = useRef(true);

  useEffect(() => {
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    window.pintrk?.("page");
  }, [pathname]);

  return null;
}
