/**
 * Renderiza o conteúdo textual da aula com suporte leve a:
 * "## " títulos, "- " listas e parágrafos.
 */
export function LessonContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted sm:text-[15px]">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={i} className="pt-2 font-display text-base font-semibold text-foreground">
              {trimmed.slice(3)}
            </h4>
          );
        }

        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                  {l.trim().slice(2)}
                </li>
              ))}
            </ul>
          );
        }

        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}
