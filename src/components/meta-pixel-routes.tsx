"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * O snippet do Meta só conta um PageView, o do carregamento da página. Como o
 * site é uma SPA, trocar de tela não recarrega nada — então aqui o PageView é
 * disparado a cada troca de rota, pulando a primeira (que o snippet já contou).
 */
export function MetaPixelRoutes() {
  const pathname = usePathname();
  const primeiraRota = useRef(true);

  useEffect(() => {
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
