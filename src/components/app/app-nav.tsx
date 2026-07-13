"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/app/nav-items";
import { Logo } from "@/components/app/logo";
import { SignOutButton } from "@/components/app/sign-out-button";
import { cn } from "@/lib/utils";

export function Sidebar({ isAdmin, name }: { isAdmin: boolean; name: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/60 backdrop-blur-xl lg:flex">
      <div className="px-6 py-7">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-accent-soft text-foreground shadow-[inset_0_0_0_1px_rgb(47_107_255/0.3)]"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon className={cn("size-[18px]", active && "text-accent")} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-accent-soft text-foreground shadow-[inset_0_0_0_1px_rgb(47_107_255/0.3)]"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <ShieldCheck
              className={cn("size-[18px]", pathname.startsWith("/admin") && "text-accent")}
            />
            Admin
          </Link>
        )}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">{name ?? "Membro"}</p>
          <p className="text-xs text-muted">Área de membros</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}

export function MobileHeader({ isAdmin, name }: { isAdmin: boolean; name: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fecha o menu ao navegar para outra página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll da página enquanto o menu está aberto
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Sidebar deslizante */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-accent-soft text-foreground shadow-[inset_0_0_0_1px_rgb(47_107_255/0.3)]"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <item.icon className={cn("size-[18px]", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                pathname.startsWith("/admin")
                  ? "bg-accent-soft text-foreground shadow-[inset_0_0_0_1px_rgb(47_107_255/0.3)]"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <ShieldCheck
                className={cn("size-[18px]", pathname.startsWith("/admin") && "text-accent")}
              />
              Admin
            </Link>
          )}
        </nav>

        <div className="border-t border-border px-4 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">{name ?? "Membro"}</p>
            <p className="text-xs text-muted">Área de membros</p>
          </div>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
