import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para o site
        </Link>

        <article className="legal-prose">{children}</article>

        <footer className="mt-16 border-t border-border pt-8 text-xs text-muted">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/termos" className="transition-colors hover:text-foreground">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-foreground">
              Política de Privacidade
            </Link>
            <Link href="/reembolso" className="transition-colors hover:text-foreground">
              Política de Reembolso
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
