"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { globalSearchAction, type SearchGroup } from "@/app/actions/admin/search";
import { ADMIN_PAGES } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

type FlatItem = { group: string; title: string; sub?: string; href: string };

const QUICK_ACTIONS: FlatItem[] = [
  { group: "Ações rápidas", title: "Lançar venda manual", href: "/admin/receita/transacoes?nova=1" },
  { group: "Ações rápidas", title: "Liberar acesso a um aluno…", sub: "abre a lista de alunos", href: "/admin/alunos" },
  { group: "Ações rápidas", title: "Adicionar tokens de IA a um aluno…", sub: "abre a lista de alunos", href: "/admin/alunos" },
  { group: "Ações rápidas", title: "Exportar transações (CSV)", href: "/admin/receita/transacoes?export=1" },
  { group: "Ações rápidas", title: "Novo look", href: "/admin/conteudo/looks/novo" },
];

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const openPalette = () => {
      setOpen(true);
      setQ("");
      setGroups([]);
      setActive(0);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("admin:palette", openPalette);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("admin:palette", openPalette);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  // Busca no servidor com debounce de 250ms
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          setGroups(await globalSearchAction(q));
        } catch {
          setGroups([]);
        }
      });
    }, 250);
  }, [q, open]);

  const items = useMemo<FlatItem[]>(() => {
    const nq = normalize(q);
    const pages = ADMIN_PAGES
      .filter((p) => !nq || normalize(`${p.section} ${p.title}`).includes(nq))
      .slice(0, nq ? 6 : 8)
      .map((p) => ({ group: "Páginas", title: p.title, sub: p.section, href: p.href }));
    const actions = QUICK_ACTIONS.filter((a) => !nq || normalize(a.title).includes(nq));
    const server = groups.flatMap((g) => g.items.map((i) => ({ group: g.label, ...i })));
    return [...server, ...pages, ...actions];
  }, [q, groups]);

  useEffect(() => setActive(0), [items.length, q]);

  const go = useCallback(
    (item: FlatItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl animate-fade-up overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          {pending ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted" />
          ) : (
            <Search className="size-4 shrink-0 text-muted" />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter") go(items[active]);
            }}
            placeholder="Busque alunos, looks, aulas, transações ou páginas…"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-2"
          />
          <kbd className="shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-2">
            esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted">
              {q.trim().length < 2 ? "Digite pelo menos 2 letras para buscar nos dados." : pending ? "Buscando…" : "Nada encontrado."}
            </p>
          )}
          {items.map((item, i) => {
            const showHeader = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={`${item.href}-${i}`}>
                {showHeader && (
                  <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                    {item.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    i === active ? "bg-accent-soft" : ""
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px]", i === active ? "text-foreground" : "text-muted")}>
                      {item.title}
                    </span>
                    {item.sub && <span className="block truncate text-[11px] text-muted-2">{item.sub}</span>}
                  </span>
                  {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-2" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
