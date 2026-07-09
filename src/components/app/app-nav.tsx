"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
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

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.mobile);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-accent-soft"
                )}
              >
                <item.icon className="size-[19px]" />
              </span>
              {item.label === "Combinações" ? "Looks" : item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
