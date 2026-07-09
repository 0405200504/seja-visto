import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Logo } from "@/components/app/logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#7ea2ff]">
              Admin
            </span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao app
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AdminTabs />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
