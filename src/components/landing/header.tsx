"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Data limite da oferta, no formato dd/mm. É um valor fixo de propósito:
 * gerar a data do dia aqui faria a faixa dizer "último dia" para sempre, o que
 * é prazo falso e dá problema no CDC. Atualize quando prorrogar ou encerrar.
 */
export const OFERTA_ATE = "14/08";

/** Faixa de urgência acima do menu. */
function OfferBar() {
  return (
    <div className="bg-[#146CFF] text-white">
      <div className="mx-auto flex h-8 max-w-[1280px] items-center justify-center gap-2.5 px-4 md:h-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] md:text-xs md:tracking-[0.14em]">
          Último dia por R$27
        </p>
        <span aria-hidden className="h-3 w-px bg-white/40" />
        <p className="text-[11px] font-semibold tabular-nums text-white/85 md:text-xs">
          {OFERTA_ATE}
        </p>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Bônus" },
  { href: "#metodo", label: "Método" },
  { href: "#fit-check", label: "Fit Check" },
  { href: "#planos", label: "Planos" },
  { href: "#duvidas", label: "Dúvidas" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[#20242C]/80 bg-[#050505]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <OfferBar />
      {/* Sem menu no mobile: a barra de logo/CTA roubava a dobra e só dava
          saídas da página. No desktop sobra espaço, então continua. */}
      <div className="mx-auto hidden h-16 max-w-[1280px] items-center justify-between gap-4 px-5 lg:flex lg:h-[72px] lg:px-8">
        <Link href="#" aria-label="MPO — voltar ao topo" className="flex items-center gap-2.5">
          <Image
            src="/logo-mpo-192.png"
            alt="Logo MPO"
            width={34}
            height={34}
            priority
            className="size-8 rounded-lg md:size-[34px]"
          />
          <span className="font-display text-sm font-bold tracking-tight text-[#F5F7FA]">
            MPO
            <span className="ml-2 hidden text-[10px] font-medium uppercase tracking-[0.22em] text-[#A4AAB5] lg:inline">
              Manual Prático do Outfit
            </span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-[#A4AAB5] transition-colors hover:text-[#F5F7FA] focus-visible:text-[#F5F7FA]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg border border-[#20242C] px-4 py-2.5 text-[13px] font-semibold text-[#F5F7FA] transition-colors hover:border-[#146CFF]/60 hover:text-white lg:inline-flex"
          >
            Já sou membro
          </Link>
          <a
            href="#planos"
            className="hidden rounded-lg bg-[#146CFF] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_28px_-6px_rgb(20_108_255/0.8)] lg:inline-flex"
          >
            QUERO ACESSAR O MPO
          </a>
        </div>
      </div>

    </header>
  );
}
