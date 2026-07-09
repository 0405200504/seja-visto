import { Check, Lightbulb } from "lucide-react";
import type { GuideSection } from "@/lib/guides";

/** Renderiza uma seção de conteúdo (usada em Guias e Bônus). */
export function Section({ section }: { section: GuideSection }) {
  switch (section.kind) {
    case "text":
      return (
        <section>
          {section.title && (
            <h2 className="mb-3 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="space-y-4">
            {section.body.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted sm:text-[15px]">
                {p}
              </p>
            ))}
          </div>
        </section>
      );

    case "steps":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="font-display text-[15px] font-semibold">{item.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "table":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  {section.head.map((h) => (
                    <th key={h} className="px-4 py-3.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border bg-surface last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={
                          j === 0
                            ? "px-4 py-3.5 font-medium text-foreground"
                            : "px-4 py-3.5 leading-relaxed text-muted"
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.note && <p className="mt-2 text-xs text-muted-2">{section.note}</p>}
        </section>
      );

    case "tips":
      return (
        <section>
          {section.title && (
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">{section.title}</h2>
          )}
          <ul className="space-y-2.5">
            {section.items.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <Check className="size-3 text-accent" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      );

    case "callout":
      return (
        <section className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent-soft/60 p-5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
            {section.body}
          </p>
        </section>
      );
  }
}
