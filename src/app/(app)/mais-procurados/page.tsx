/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { MOST_WANTED } from "@/lib/constants";

export const metadata: Metadata = { title: "Mais Procurados" };

export default async function MaisProcuradosPage() {
  await requireProfile();

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Glossário visual"
        title="As peças mais procuradas"
        description="Aquelas peças que todo mundo quer mas quase ninguém sabe o nome. Aprenda como pedir na loja — e como pesquisar."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {MOST_WANTED.map((item) => (
          <div
            key={item.slug}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:border-border-strong"
          >
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-surface-2 p-3">
              <img
                src={`/mais-procurados/${item.slug}.jpg`}
                alt={item.name}
                loading="lazy"
                className="max-h-full max-w-full rounded-lg object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 border-t border-border p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                “{item.knownAs}”
              </p>
              <h3 className="font-display text-lg font-bold text-accent">{item.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
