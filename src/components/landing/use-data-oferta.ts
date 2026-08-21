"use client";

import { useSyncExternalStore } from "react";

const FUSO = "America/Sao_Paulo";

const FORMATO_DIA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
});

const FORMATO_HORA = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Data de hoje no horário de Brasília, no formato dd/mm. */
function hojeEmBrasilia() {
  return FORMATO_DIA.format(new Date());
}

/** Quanto falta para a próxima meia-noite de Brasília, em ms (+1s de folga). */
function msAteVirarODia() {
  const partes = FORMATO_HORA.formatToParts(new Date());
  const valor = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);

  const hora = valor("hour") % 24; // algumas engines devolvem 24 à meia-noite
  const decorrido = (hora * 3600 + valor("minute") * 60 + valor("second")) * 1000;
  return 86_400_000 - decorrido + 1_000;
}

function assinar(avisar: () => void) {
  let timer: ReturnType<typeof setTimeout>;

  const agendar = () => {
    timer = setTimeout(() => {
      avisar();
      agendar();
    }, msAteVirarODia());
  };
  agendar();

  // Aba que passou a noite aberta (ou celular que dormiu) reconfere ao voltar,
  // porque o timer pode acordar atrasado.
  const aoVoltar = () => {
    clearTimeout(timer);
    avisar();
    agendar();
  };
  document.addEventListener("visibilitychange", aoVoltar);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", aoVoltar);
  };
}

/**
 * Data da oferta na faixa do topo, sempre o dia de hoje em Brasília.
 *
 * A home é estática, então o HTML sai com a data do build: quem resolve de
 * verdade é o navegador, na hidratação (por isso o `suppressHydrationWarning`
 * onde a data é exibida). Vira sozinha à meia-noite, sem novo deploy.
 */
export function useDataOferta() {
  return useSyncExternalStore(assinar, hojeEmBrasilia, hojeEmBrasilia);
}
