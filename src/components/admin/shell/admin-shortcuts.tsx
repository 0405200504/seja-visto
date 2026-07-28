"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const GOTO: Record<string, { href: string; label: string }> = {
  a: { href: "/admin/alunos", label: "Alunos" },
  l: { href: "/admin/conteudo/looks", label: "Looks" },
  v: { href: "/admin/receita/transacoes", label: "Vendas" },
  m: { href: "/admin/conteudo/metodo", label: "Método" },
  d: { href: "/admin", label: "Dashboard" },
};

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: "⌘K", desc: "Busca global (alunos, looks, aulas, transações, páginas)" },
  { keys: "/", desc: "Focar a busca da lista atual" },
  { keys: "j / k", desc: "Navegar entre as linhas da lista" },
  { keys: "Enter", desc: "Abrir o detalhe da linha selecionada" },
  { keys: "e", desc: "Editar a linha selecionada" },
  { keys: "x", desc: "Selecionar/desselecionar a linha" },
  { keys: "↑ / ↓", desc: "Registro anterior/próximo com o painel aberto" },
  { keys: "Esc", desc: "Fechar painel, modal ou busca" },
  { keys: "g depois a", desc: "Ir para Alunos" },
  { keys: "g depois l", desc: "Ir para Looks" },
  { keys: "g depois v", desc: "Ir para Vendas" },
  { keys: "g depois m", desc: "Ir para Método" },
  { keys: "g depois d", desc: "Ir para o Dashboard" },
  { keys: "?", desc: "Abrir esta ajuda" },
];

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable;
}

export function AdminShortcuts() {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const gPressed = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setHelp((h) => !h);
        return;
      }
      if (e.key === "Escape") {
        setHelp(false);
        return;
      }
      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>("[data-table-search]");
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }
      if (e.key === "g") {
        gPressed.current = Date.now();
        return;
      }
      if (gPressed.current && Date.now() - gPressed.current < 1200) {
        const target = GOTO[e.key.toLowerCase()];
        gPressed.current = 0;
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!help) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => setHelp(false)}
    >
      <div
        className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Atalhos de teclado"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Atalhos de teclado</h2>
          <button
            onClick={() => setHelp(false)}
            className="rounded-lg p-1 text-muted transition-colors hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 hover:bg-surface-2">
              <span className="text-[13px] text-muted">{s.desc}</span>
              <kbd className="shrink-0 rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
