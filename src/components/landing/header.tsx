"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANNUAL_CHECKOUT_URL, checkoutHref } from "./checkout";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "O que você recebe" },
  { href: "#fit-check", label: "Fit Check" },
  { href: "#planos", label: "Planos" },
  { href: "#duvidas", label: "Dúvidas" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        scrolled || open
          ? "border-b border-[#20242C]/80 bg-[#050505]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 md:h-[72px] md:px-8">
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

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
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
            className="hidden rounded-lg border border-[#20242C] px-4 py-2.5 text-[13px] font-semibold text-[#F5F7FA] transition-colors hover:border-[#146CFF]/60 hover:text-white sm:inline-flex"
          >
            Já sou membro
          </Link>
          <a
            href={checkoutHref(ANNUAL_CHECKOUT_URL)}
            className="hidden rounded-lg bg-[#146CFF] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_28px_-6px_rgb(20_108_255/0.8)] sm:inline-flex"
          >
            QUERO ACESSAR O MPO
          </a>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-[#20242C] px-3 py-2 text-xs font-semibold text-[#F5F7FA] sm:hidden"
          >
            Entrar
          </Link>
          <a
            href="#planos"
            className="inline-flex rounded-lg bg-[#146CFF] px-3.5 py-2 text-xs font-semibold text-white sm:hidden"
          >
            ACESSAR
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-[#20242C] text-[#F5F7FA] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Navegação mobile"
          className="border-t border-[#20242C]/60 bg-[#050505]/95 px-5 py-4 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-[#A4AAB5] transition-colors hover:bg-white/[0.04] hover:text-[#F5F7FA]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-t border-[#20242C]/60 pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-[#F5F7FA] transition-colors hover:bg-white/[0.04]"
              >
                Já sou membro — Entrar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

/** CTA fixo no mobile — aparece depois que o visitante passa da primeira dobra. */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#20242C]/80 bg-[#050505]/90 px-4 py-3 backdrop-blur-xl transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <a
        href={checkoutHref(ANNUAL_CHECKOUT_URL)}
        tabIndex={visible ? 0 : -1}
        className="flex h-12 items-center justify-center rounded-xl bg-[#146CFF] text-sm font-bold tracking-wide text-white shadow-[0_0_30px_-8px_rgb(20_108_255/0.9)]"
      >
        ACESSAR O MPO
      </a>
    </div>
  );
}
