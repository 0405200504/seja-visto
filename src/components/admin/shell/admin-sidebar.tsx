"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Pin, X } from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { Logo } from "@/components/app/logo";
import { cn } from "@/lib/utils";

export type SavedViewLink = { id: string; page: string; name: string; params: string };

const COLLAPSE_KEY = "admin_sidebar_collapsed";

export function AdminSidebar({
  badges,
  views,
}: {
  badges: Record<string, number>;
  views: SavedViewLink[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    const openMenu = () => setMobileOpen(true);
    window.addEventListener("admin:menu", openMenu);
    return () => window.removeEventListener("admin:menu", openMenu);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      window.dispatchEvent(new CustomEvent("admin:sidebar", { detail: !c }));
      return !c;
    });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex-1 overflow-y-auto px-2.5 pb-6">
      {ADMIN_NAV.map((section) => (
        <div key={section.label} className="mt-5 first:mt-2">
          {!collapsed && (
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href);
              const count = item.badge ? (badges[item.badge] ?? 0) : 0;
              const pinned = views.filter((v) => v.page === item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                      active
                        ? "bg-accent-soft text-foreground"
                        : "text-muted hover:bg-surface-2 hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon
                      className={cn("size-4 shrink-0", active ? "text-[#7ea2ff]" : "text-muted-2 group-hover:text-muted")}
                    />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {count > 0 && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full bg-accent px-1.5 py-px text-[10px] font-bold leading-4 text-white",
                          collapsed && "absolute ml-4 -mt-4 px-1"
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                  {!collapsed &&
                    pinned.map((v) => (
                      <Link
                        key={v.id}
                        href={`${v.page}?${v.params}`}
                        className="mt-0.5 flex items-center gap-2 rounded-lg py-1 pl-9 pr-2.5 text-xs text-muted-2 transition-colors hover:text-foreground"
                      >
                        <Pin className="size-3 shrink-0" />
                        <span className="truncate">{v.name}</span>
                      </Link>
                    ))}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface lg:flex",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center gap-2 border-b border-border px-4", collapsed && "justify-center px-0")}>
          {!collapsed && (
            <>
              <Logo />
              <span className="rounded-full border border-accent/30 bg-accent-soft px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-[#7ea2ff]">
                Admin
              </span>
            </>
          )}
          <button
            onClick={toggle}
            className={cn("rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground", !collapsed && "ml-auto")}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        {nav}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <Logo />
                <span className="rounded-full border border-accent/30 bg-accent-soft px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-[#7ea2ff]">
                  Admin
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
                aria-label="Fechar menu"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}

/** Empurra o conteúdo conforme a sidebar (fixa) está expandida ou não. */
export function AdminContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    const onToggle = (e: Event) => setCollapsed((e as CustomEvent<boolean>).detail);
    window.addEventListener("admin:sidebar", onToggle);
    return () => window.removeEventListener("admin:sidebar", onToggle);
  }, []);

  return (
    <div className={cn("flex min-h-dvh flex-col", collapsed ? "lg:pl-[60px]" : "lg:pl-60")}>
      {children}
    </div>
  );
}
