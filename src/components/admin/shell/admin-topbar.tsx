"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { ADMIN_PAGES } from "@/lib/admin/nav";
import { PERIOD_COOKIE, PERIOD_LABELS, type PeriodKey } from "@/lib/admin/period";
import { initials } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/* ---------- Breadcrumb ---------- */

function Breadcrumbs() {
  const pathname = usePathname();
  const match = ADMIN_PAGES
    .filter((p) => (p.href === "/admin" ? pathname === "/admin" : pathname.startsWith(p.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const crumbs: { label: string; href?: string }[] = [];
  if (match) {
    if (match.href !== "/admin") crumbs.push({ label: match.section });
    crumbs.push({ label: match.title, href: match.href });
    if (pathname !== match.href) crumbs.push({ label: "Detalhe" });
  } else {
    crumbs.push({ label: "Admin", href: "/admin" });
  }

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-[13px]" aria-label="Você está em">
      <Link href="/admin" className="shrink-0 font-semibold text-muted transition-colors hover:text-foreground">
        Admin
      </Link>
      {crumbs.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="size-3.5 shrink-0 text-muted-2" />
          {c.href && i === crumbs.length - 1 ? (
            <span className="truncate font-semibold text-foreground">{c.label}</span>
          ) : c.href ? (
            <Link href={c.href} className="truncate text-muted transition-colors hover:text-foreground">
              {c.label}
            </Link>
          ) : (
            <span className="truncate text-muted">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ---------- Seletor global de período ---------- */

function PeriodSelector({ currentKey, currentLabel }: { currentKey: PeriodKey; currentLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const apply = (value: string) => {
    document.cookie = `${PERIOD_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong"
        title="Período das métricas (afeta todas as telas)"
      >
        <CalendarRange className="size-3.5 text-muted" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown className="size-3 text-muted-2" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-60 animate-fade-up rounded-xl border border-border bg-surface-2 p-1.5 shadow-card">
          {(Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]).map((key) => (
            <button
              key={key}
              onClick={() => apply(key)}
              className={cn(
                "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-3",
                key === currentKey ? "font-semibold text-foreground" : "text-muted"
              )}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
          <div className="mt-1 border-t border-border px-2.5 pb-1.5 pt-2">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">Personalizado</p>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-surface px-1.5 text-[11px] text-foreground"
                aria-label="Data inicial"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-surface px-1.5 text-[11px] text-foreground"
                aria-label="Data final"
              />
            </div>
            <button
              disabled={!customFrom || !customTo || customTo < customFrom}
              onClick={() => apply(`custom:${customFrom}:${customTo}`)}
              className="mt-1.5 w-full rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              Aplicar período
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Menu "+ Criar" ---------- */

const CREATE_ITEMS = [
  { label: "Novo look", href: "/admin/conteudo/looks/novo" },
  { label: "Nova peça", href: "/admin/conteudo/pecas?novo=1" },
  { label: "Novo módulo", href: "/admin/conteudo/metodo?novo=1" },
  { label: "Lançar venda manual", href: "/admin/receita/transacoes?nova=1" },
  { label: "Novo link de rastreamento", href: "/admin/crescimento/links?novo=1" },
];

function CreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1 rounded-lg bg-accent px-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="size-3.5" />
        <span className="hidden sm:inline">Criar</span>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-56 animate-fade-up rounded-xl border border-border bg-surface-2 p-1.5 shadow-card">
          {CREATE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Avatar / sair ---------- */

function AvatarMenu({ name, signOutAction }: { name: string | null; signOutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-3 text-[11px] font-bold text-foreground transition-colors hover:border-border-strong"
        aria-label="Conta"
      >
        {initials(name)}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-48 animate-fade-up rounded-xl border border-border bg-surface-2 p-1.5 shadow-card">
          <p className="truncate px-2.5 py-1.5 text-xs font-semibold text-foreground">{name ?? "Admin"}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            Ver como aluno
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-3 hover:text-danger"
            >
              <LogOut className="size-3.5" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- Topbar ---------- */

export function AdminTopbar({
  periodKey,
  periodLabel,
  name,
  signOutAction,
}: {
  periodKey: PeriodKey;
  periodLabel: string;
  name: string | null;
  signOutAction: () => Promise<void>;
}) {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={() => window.dispatchEvent(new Event("admin:menu"))}
        className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <button
        onClick={() => window.dispatchEvent(new Event("admin:palette"))}
        className="hidden h-8 items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground md:flex"
      >
        <Search className="size-3.5" />
        Buscar…
        <kbd className="rounded border border-border-strong bg-surface px-1 font-mono text-[10px] text-muted-2">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <button
        onClick={() => window.dispatchEvent(new Event("admin:palette"))}
        className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground md:hidden"
        aria-label="Buscar"
      >
        <Search className="size-4.5" />
      </button>

      <PeriodSelector currentKey={periodKey} currentLabel={periodLabel} />
      <CreateMenu />
      <AvatarMenu name={name} signOutAction={signOutAction} />
    </header>
  );
}

/** Referência usada pelos atalhos g+letra. */
export const GOTO_SHORTCUTS: Record<string, string> = {
  a: "/admin/alunos",
  l: "/admin/conteudo/looks",
  v: "/admin/receita/transacoes",
  m: "/admin/conteudo/metodo",
  d: "/admin",
};
