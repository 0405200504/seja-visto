"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/combinacoes", label: "Looks da plataforma", icon: Layers, exact: true },
  { href: "/combinacoes/comunidade", label: "Fits da comunidade", icon: Users, exact: false },
];

export function CombinacoesTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 inline-flex rounded-full border border-border bg-surface p-1">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground shadow-[0_4px_20px_-6px_rgb(47_107_255/0.5)]"
                : "text-muted hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
