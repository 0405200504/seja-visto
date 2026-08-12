"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GOOGLE_ADS_ID } from "./google-ads";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * O `gtag('config')` só conta uma visita, a do carregamento da página. Como o
 * site é uma SPA, trocar de tela não recarrega nada — então aqui a visita é
 * disparada a cada troca de rota, pulando a primeira (que o snippet já contou).
 */
export function GoogleAdsRoutes() {
  const pathname = usePathname();
  const primeiraRota = useRef(true);

  useEffect(() => {
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    window.gtag?.("event", "page_view", { send_to: GOOGLE_ADS_ID });
  }, [pathname]);

  return null;
}
