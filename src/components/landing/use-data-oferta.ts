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

/** No HTML pré-renderizado a data sai vazia — veja o porquê em `useDataOferta`. */
const semDataNoServidor = () => "";

/**
 * Data da oferta na faixa do topo, sempre o dia de hoje em Brasília.
 *
 * A home é estática: o HTML é gerado no deploy e serviria uma data velha. Por
 * isso o servidor não escreve data nenhuma e quem preenche é o navegador, logo
 * após a hidratação — se o servidor escrevesse um dia e o navegador outro, o
 * React trataria como divergência de hidratação e manteria o valor errado do
 * HTML. Depois disso vira sozinha à meia-noite, sem novo deploy.
 */
export function useDataOferta() {
  return useSyncExternalStore(assinar, hojeEmBrasilia, semDataNoServidor);
}
