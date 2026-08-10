"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Share, MoreVertical, PlusSquare, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Plataforma = "ios" | "android";

type Passo = {
  titulo: string;
  detalhe: string;
  /** Ícone que aparece na tela do celular naquele passo. */
  icone?: React.ReactNode;
};

const PASSOS: Record<Plataforma, Passo[]> = {
  ios: [
    {
      titulo: "Abra o MPO no Safari",
      detalhe:
        "Precisa ser o Safari mesmo — no iPhone, Chrome e Instagram não conseguem instalar na tela inicial. Se você chegou aqui por outro app, toque nos três pontinhos e escolha “Abrir no Safari”.",
    },
    {
      titulo: "Toque no botão Compartilhar",
      detalhe:
        "É o quadrado com a seta para cima, na barra de baixo do Safari. Em iPhones mais antigos ele fica no topo.",
      icone: <Share className="size-4" />,
    },
    {
      titulo: "Role e toque em “Adicionar à Tela de Início”",
      detalhe:
        "A lista é grande — role para baixo até achar. Se não aparecer, toque em “Editar ações” no fim da lista e ative a opção.",
      icone: <PlusSquare className="size-4" />,
    },
    {
      titulo: "Confirme em “Adicionar”",
      detalhe:
        "O nome já vem como MPO. Toque em Adicionar no canto superior direito e pronto: o ícone azul aparece na sua tela inicial.",
      icone: <Check className="size-4" />,
    },
  ],
  android: [
    {
      titulo: "Abra o MPO no Chrome",
      detalhe:
        "Se você entrou pelo Instagram ou WhatsApp, toque nos três pontinhos do navegador interno e escolha “Abrir no Chrome”.",
    },
    {
      titulo: "Toque nos três pontinhos",
      detalhe: "No canto superior direito do Chrome.",
      icone: <MoreVertical className="size-4" />,
    },
    {
      titulo: "Escolha “Instalar app” ou “Adicionar à tela inicial”",
      detalhe:
        "O nome muda conforme a versão do Chrome — as duas opções fazem a mesma coisa. Em alguns celulares o próprio Chrome já mostra uma barrinha “Instalar” na parte de baixo.",
      icone: <PlusSquare className="size-4" />,
    },
    {
      titulo: "Confirme em “Instalar”",
      detalhe:
        "O ícone azul do MPO vai para a sua tela inicial (e também para a gaveta de aplicativos), igual a qualquer outro app.",
      icone: <Check className="size-4" />,
    },
  ],
};

/**
 * Leituras que só existem no navegador.
 *
 * Vão por `useSyncExternalStore` em vez de `useEffect` + `setState`: o React
 * usa o valor do servidor na hidratação e troca para o real no mesmo passo,
 * sem uma renderização extra mostrando a aba errada.
 */
const semInscricao = () => () => {};

/** Chuta a plataforma pelo user agent só para já abrir na aba certa. */
function detectaPlataforma(): Plataforma {
  return /android/i.test(navigator.userAgent) ? "android" : "ios";
}

/** Em tela cheia (já instalado), o navegador reporta display-mode standalone. */
function detectaStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari no iOS usa esta propriedade não-padrão.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstalarGuia() {
  const detectada = useSyncExternalStore<Plataforma>(semInscricao, detectaPlataforma, () => "ios");
  const jaInstalado = useSyncExternalStore(semInscricao, detectaStandalone, () => false);

  // Só sai do automático quando o aluno escolhe a aba na mão.
  const [escolha, setEscolha] = useState<Plataforma | null>(null);
  const plataforma = escolha ?? detectada;

  const passos = PASSOS[plataforma];

  return (
    <div className="space-y-6">
      {jaInstalado && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
          <Check className="size-5 shrink-0 text-accent" />
          <p className="text-sm text-foreground">
            Você já está usando o MPO como aplicativo. É exatamente assim que ele deve abrir.
          </p>
        </div>
      )}

      {/* seletor de plataforma */}
      <div
        role="tablist"
        aria-label="Escolha o seu celular"
        className="flex gap-1.5 rounded-xl border border-border bg-surface p-1.5"
      >
        {(["ios", "android"] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={plataforma === p}
            onClick={() => setEscolha(p)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              plataforma === p
                ? "bg-accent text-white"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <Smartphone className="size-4" />
            {p === "ios" ? "iPhone (iOS)" : "Android"}
          </button>
        ))}
      </div>

      {/* passos */}
      <ol className="space-y-3">
        {passos.map((passo, i) => (
          <li
            key={passo.titulo}
            className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                {passo.titulo}
                {passo.icone && (
                  <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
                    {passo.icone}
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{passo.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">Por que vale a pena</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
          <li>· Abre em tela cheia, sem a barra do navegador atrapalhando.</li>
          <li>· Fica um toque de distância, do lado dos seus outros apps.</li>
          <li>· Você continua logado — não precisa digitar a senha toda vez.</li>
          <li>· Não ocupa espaço: não é um download, é um atalho inteligente.</li>
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-muted-2">
        Travou em algum passo? Chame o suporte em{" "}
        <a
          href="mailto:suporte@manualpraticodooutfit.com.br"
          className="font-medium text-accent hover:underline"
        >
          suporte@manualpraticodooutfit.com.br
        </a>{" "}
        que a gente te ajuda.
      </p>
    </div>
  );
}
