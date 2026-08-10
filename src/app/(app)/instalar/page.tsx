import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/app/page-header";
import { InstalarGuia } from "@/components/app/instalar-guia";

export const metadata: Metadata = { title: "Instalar no celular" };

export default function InstalarPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Acesso rápido"
        title="Coloque o MPO na tela do seu celular"
        description="Em 4 toques o MPO vira um ícone na sua tela inicial e abre como aplicativo. Não é download: não ocupa espaço e não passa por loja nenhuma."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        {/* prévia do ícone */}
        <div className="hidden rounded-2xl border border-border bg-surface p-6 text-center lg:block">
          <Image
            src="/app-icon-192.png"
            alt="Ícone do MPO na tela inicial"
            width={96}
            height={96}
            className="mx-auto rounded-[22px] shadow-card"
          />
          <p className="mt-3 text-sm font-semibold text-foreground">MPO</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-2">
            É assim que ele vai aparecer entre os seus apps.
          </p>
        </div>

        <InstalarGuia />
      </div>
    </div>
  );
}
