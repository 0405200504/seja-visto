"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Loader2,
  Rows3,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/admin/ui/toast";
import { useConfirm, type ConfirmOptions } from "@/components/admin/ui/confirm";
import { DetailDrawer } from "@/components/admin/ui/drawer";
import { saveViewAction, deleteViewAction } from "@/app/actions/admin/views";
import { num } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/* =========================================================
   <DataTable/> — padrão único de listagem do admin.
   Estado 100% na URL: ?q=&sort=col.dir&page=&per=&f_x=a,b
   ========================================================= */

export type TableColumn = {
  id: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right";
  /** escondida por padrão (pode ser ligada no menu de colunas) */
  defaultHidden?: boolean;
  /** largura mínima em px na tabela desktop */
  width?: number;
};

export type TableRow = {
  id: string;
  cells: Record<string, React.ReactNode>;
  /** card mobile */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  /** rota de edição (tecla e / "abrir em página cheia" / fallback do clique) */
  editHref?: string;
  /** conteúdo do painel lateral; se ausente, clique navega para editHref */
  drawer?: React.ReactNode;
  drawerTitle?: React.ReactNode;
  drawerSubtitle?: React.ReactNode;
  drawerFooter?: React.ReactNode;
};

export type TableFacet = {
  id: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
  selected: string[];
};

export type BulkAction = {
  id: string;
  label: string;
  danger?: boolean;
  confirm?: ConfirmOptions;
  /** id de outra ação que desfaz esta (ex: restaurar após excluir) */
  undoActionId?: string;
};

export type BulkPayload = { ids: string[]; allFiltered: boolean; queryString: string };
export type BulkResult = { ok: boolean; message: string };

export type SavedView = { id: string; name: string; params: string };

type Props = {
  tableId: string;
  basePath: string;
  columns: TableColumn[];
  rows: TableRow[];
  total: number;
  page: number;
  per: number;
  sort: string; // "col.asc" | "col.desc"
  q: string;
  searchPlaceholder?: string;
  facets?: TableFacet[];
  bulkActions?: BulkAction[];
  onBulk?: (actionId: string, payload: BulkPayload) => Promise<BulkResult>;
  csvAction?: (queryString: string) => Promise<{ filename: string; content: string }>;
  savedViews?: SavedView[];
  emptyTitle?: string;
  emptyHint?: string;
  createHref?: string;
  createLabel?: string;
  children?: React.ReactNode;
};

function useUrlState(basePath: string) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(sp.toString());
      if (resetPage) params.delete("page");
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, sp]
  );

  return { update, pending, sp, basePath };
}

/* ---------- dropdown genérico ---------- */

function Dropdown({
  trigger,
  children,
  align = "left",
  width = "w-56",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface-2 p-1.5 shadow-card animate-fade-up",
            width,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

/* ---------- componente principal ---------- */

export function DataTable(props: Props) {
  const {
    tableId, columns, rows, total, page, per, sort, q,
    facets = [], bulkActions = [], onBulk, csvAction, savedViews = [],
  } = props;

  const { update, pending, sp } = useUrlState(props.basePath);
  const toast = useToast();
  const confirm = useConfirm();
  const pathname = usePathname();

  // busca com debounce 300ms
  const [search, setSearch] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(t);
  }, [search, q, update]);

  // preferências locais: densidade, colunas ocultas e ordem
  const [dense, setDense] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem(`table:${tableId}`) ?? "{}");
      if (prefs.dense) setDense(true);
      if (Array.isArray(prefs.hidden)) setHidden(prefs.hidden);
      else setHidden(columns.filter((c) => c.defaultHidden).map((c) => c.id));
      if (Array.isArray(prefs.order)) setOrder(prefs.order);
    } catch {
      setHidden(columns.filter((c) => c.defaultHidden).map((c) => c.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);
  const savePrefs = (patch: Partial<{ dense: boolean; hidden: string[]; order: string[] }>) => {
    const current = { dense, hidden, order, ...patch };
    localStorage.setItem(`table:${tableId}`, JSON.stringify(current));
  };

  const visibleColumns = useMemo(() => {
    const base = columns.filter((c) => !hidden.includes(c.id));
    if (!order.length) return base;
    return [...base].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [columns, hidden, order]);

  // seleção
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allFiltered, setAllFiltered] = useState(false);
  useEffect(() => {
    setSelected(new Set());
    setAllFiltered(false);
  }, [rows.map((r) => r.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRow = (id: string) => {
    setAllFiltered(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePage = () => {
    setAllFiltered(false);
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))
    );
  };

  // drawer + navegação por teclado
  const [activeIdx, setActiveIdx] = useState(-1);
  const [drawerIdx, setDrawerIdx] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (drawerIdx >= 0) return; // drawer cuida de ↑/↓/Esc

      if (e.key === "j") setActiveIdx((i) => Math.min(i + 1, rows.length - 1));
      if (e.key === "k") setActiveIdx((i) => Math.max(i - 1, 0));
      if (e.key === "x" && activeIdx >= 0) toggleRow(rows[activeIdx].id);
      if (e.key === "Enter" && activeIdx >= 0) {
        const row = rows[activeIdx];
        if (row.drawer) setDrawerIdx(activeIdx);
        else if (row.editHref) router.push(row.editHref);
      }
      if (e.key === "e" && activeIdx >= 0 && rows[activeIdx].editHref) {
        router.push(rows[activeIdx].editHref!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, activeIdx, drawerIdx, router]);

  // ordenação
  const [sortCol, sortDir] = sort.split(".");
  const cycleSort = (col: TableColumn) => {
    if (!col.sortable) return;
    if (sortCol !== col.id) update({ sort: `${col.id}.desc` }, false);
    else if (sortDir === "desc") update({ sort: `${col.id}.asc` }, false);
    else update({ sort: null }, false);
  };

  // bulk
  const [bulkPending, setBulkPending] = useState(false);
  const runBulk = async (action: BulkAction, idsOverride?: string[]) => {
    if (!onBulk) return;
    const ids = idsOverride ?? [...selected];
    if (action.confirm && !idsOverride) {
      const ok = await confirm({
        ...action.confirm,
        message: action.confirm.message.replace("{n}", String(allFiltered ? total : ids.length)),
      });
      if (!ok) return;
    }
    setBulkPending(true);
    try {
      const res = await onBulk(action.id, {
        ids,
        allFiltered: !idsOverride && allFiltered,
        queryString: sp.toString(),
      });
      toast({
        title: res.message,
        kind: res.ok ? "success" : "error",
        undo:
          res.ok && action.undoActionId && !allFiltered
            ? async () => {
                await onBulk(action.undoActionId!, { ids, allFiltered: false, queryString: sp.toString() });
                router.refresh();
              }
            : undefined,
      });
      if (res.ok) {
        setSelected(new Set());
        setAllFiltered(false);
        router.refresh();
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Erro na ação em massa.", kind: "error" });
    } finally {
      setBulkPending(false);
    }
  };

  // CSV
  const [csvPending, setCsvPending] = useState(false);
  const exportCsv = async () => {
    if (!csvAction) return;
    setCsvPending(true);
    try {
      const { filename, content } = await csvAction(sp.toString());
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exportado: ${filename}` });
    } catch {
      toast({ title: "Erro ao exportar CSV.", kind: "error" });
    } finally {
      setCsvPending(false);
    }
  };

  // export automático via ?export=1 (ação rápida do Cmd+K)
  useEffect(() => {
    if (sp.get("export") === "1" && csvAction) {
      update({ export: null }, false);
      exportCsv();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // views salvas
  const [viewName, setViewName] = useState("");
  const currentParams = sp.toString();

  const totalPages = Math.max(1, Math.ceil(total / per));
  const fromN = total === 0 ? 0 : (page - 1) * per + 1;
  const toN = Math.min(page * per, total);

  const activeFilterChips = facets.flatMap((f) =>
    f.selected.map((v) => ({
      facet: f,
      value: v,
      label: f.options.find((o) => o.value === v)?.label ?? v,
    }))
  );

  const removeFilter = (facetId: string, value: string) => {
    const facet = facets.find((f) => f.id === facetId)!;
    const next = facet.selected.filter((v) => v !== value);
    update({ [`f_${facetId}`]: next.length ? next.join(",") : null });
  };

  const rowPad = dense ? "py-1.5" : "py-2.5";
  const drawerRow = drawerIdx >= 0 ? rows[drawerIdx] : null;

  return (
    <div className="relative">
      {/* ---------- barra de controles ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-2" />
          <input
            ref={searchRef}
            data-table-search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setSearch(""), searchRef.current?.blur())}
            placeholder={props.searchPlaceholder ?? "Buscar…  ( / )"}
            className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
          />
        </div>

        {facets.map((facet) => (
          <Dropdown
            key={facet.id}
            trigger={
              <button
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] transition-colors",
                  facet.selected.length
                    ? "border-accent/40 bg-accent-soft text-foreground"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong"
                )}
              >
                {facet.label}
                {facet.selected.length > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-white">
                    {facet.selected.length}
                  </span>
                )}
                <ChevronDown className="size-3 text-muted-2" />
              </button>
            }
          >
            {facet.options.map((opt) => {
              const on = facet.selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const next = on
                      ? facet.selected.filter((v) => v !== opt.value)
                      : [...facet.selected, opt.value];
                    update({ [`f_${facet.id}`]: next.length ? next.join(",") : null });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-accent bg-accent text-white" : "border-border-strong"
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-2">{num(opt.count)}</span>
                  )}
                </button>
              );
            })}
          </Dropdown>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          {savedViews.length > 0 || currentParams ? (
            <Dropdown
              align="right"
              width="w-64"
              trigger={
                <button
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 text-[13px] text-muted transition-colors hover:border-border-strong hover:text-foreground"
                  title="Views salvas"
                >
                  <Bookmark className="size-3.5" />
                  <span className="hidden sm:inline">Views</span>
                </button>
              }
            >
              {(close) => (
                <>
                  {savedViews.map((v) => (
                    <div key={v.id} className="group flex items-center gap-1">
                      <Link
                        href={`${pathname}?${v.params}`}
                        onClick={close}
                        className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
                      >
                        {v.name}
                      </Link>
                      <button
                        onClick={async () => {
                          await deleteViewAction(v.id);
                          toast({ title: "Visão removida." });
                          router.refresh();
                        }}
                        className="rounded p-1 text-muted-2 opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                        aria-label={`Excluir visão ${v.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {savedViews.length > 0 && <div className="my-1 border-t border-border" />}
                  <div className="flex items-center gap-1.5 px-1.5 py-1">
                    <input
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      placeholder="Salvar filtros atuais como…"
                      className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted-2 focus:border-accent focus:outline-none"
                    />
                    <button
                      disabled={!viewName.trim()}
                      onClick={async () => {
                        const res = await saveViewAction(pathname, viewName, currentParams);
                        toast({ title: res.message, kind: res.ok ? "success" : "error" });
                        setViewName("");
                        close();
                        router.refresh();
                      }}
                      className="h-8 rounded-lg bg-accent px-2.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </Dropdown>
          ) : null}

          {csvAction && (
            <button
              onClick={exportCsv}
              disabled={csvPending}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 text-[13px] text-muted transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50"
              title="Exportar o resultado filtrado em CSV"
            >
              {csvPending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setDense((d) => {
                savePrefs({ dense: !d });
                return !d;
              });
            }}
            className={cn(
              "hidden h-9 items-center rounded-lg border px-2.5 transition-colors md:flex",
              dense ? "border-accent/40 bg-accent-soft text-foreground" : "border-border bg-surface-2 text-muted hover:border-border-strong"
            )}
            title={dense ? "Densidade: compacta" : "Densidade: confortável"}
          >
            <Rows3 className="size-3.5" />
          </button>

          <Dropdown
            align="right"
            trigger={
              <button
                className="hidden h-9 items-center rounded-lg border border-border bg-surface-2 px-2.5 text-muted transition-colors hover:border-border-strong hover:text-foreground md:flex"
                title="Configurar colunas (mostrar, ocultar e reordenar)"
              >
                <Settings2 className="size-3.5" />
              </button>
            }
          >
            <ColumnConfig
              columns={columns}
              hidden={hidden}
              order={order}
              onChange={(nextHidden, nextOrder) => {
                setHidden(nextHidden);
                setOrder(nextOrder);
                savePrefs({ hidden: nextHidden, order: nextOrder });
              }}
            />
          </Dropdown>
        </div>
      </div>

      {/* chips de filtros ativos */}
      {activeFilterChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeFilterChips.map((chip) => (
            <button
              key={`${chip.facet.id}-${chip.value}`}
              onClick={() => removeFilter(chip.facet.id, chip.value)}
              className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-[#7ea2ff] transition-colors hover:border-accent/60"
            >
              {chip.facet.label}: {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <button
            onClick={() => {
              const patch: Record<string, null> = {};
              for (const f of facets) patch[`f_${f.id}`] = null;
              update(patch);
            }}
            className="text-[11px] text-muted-2 underline-offset-2 hover:text-foreground hover:underline"
          >
            limpar tudo
          </button>
        </div>
      )}

      {props.children}

      {/* ---------- tabela desktop ---------- */}
      <div
        className={cn(
          "mt-3 overflow-hidden rounded-xl border border-border bg-surface transition-opacity",
          pending && "pointer-events-none opacity-60"
        )}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">{props.emptyTitle ?? "Nada por aqui."}</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              {props.emptyHint ?? (q || activeFilterChips.length ? "Nenhum resultado com esses filtros. Ajuste a busca ou limpe os filtros." : "Assim que houver registros, eles aparecem aqui.")}
            </p>
            {props.createHref && (
              <Link
                href={props.createHref}
                className="mt-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                {props.createLabel ?? "Criar"}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60">
                    {bulkActions.length > 0 && (
                      <th className="w-10 px-3">
                        <input
                          type="checkbox"
                          checked={selected.size === rows.length && rows.length > 0}
                          onChange={togglePage}
                          className="size-3.5 cursor-pointer accent-[#2f6bff]"
                          aria-label="Selecionar página"
                        />
                      </th>
                    )}
                    {visibleColumns.map((col) => (
                      <th
                        key={col.id}
                        style={col.width ? { minWidth: col.width } : undefined}
                        className={cn(
                          "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2",
                          col.align === "right" ? "text-right" : "text-left",
                          col.sortable && "cursor-pointer select-none hover:text-foreground"
                        )}
                        onClick={() => cycleSort(col)}
                        aria-sort={sortCol === col.id ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {sortCol === col.id &&
                            (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.id}
                      data-active={i === activeIdx || undefined}
                      onClick={() => {
                        setActiveIdx(i);
                        if (row.drawer) setDrawerIdx(i);
                        else if (row.editHref) router.push(row.editHref);
                      }}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors last:border-0",
                        i === activeIdx ? "bg-accent-soft/60" : "hover:bg-surface-2/70",
                        selected.has(row.id) && "bg-accent-soft/40"
                      )}
                    >
                      {bulkActions.length > 0 && (
                        <td className="px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            className="size-3.5 cursor-pointer accent-[#2f6bff]"
                            aria-label="Selecionar linha"
                          />
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.id}
                          className={cn("px-3", rowPad, col.align === "right" && "text-right")}
                        >
                          {row.cells[col.id] ?? <span className="text-muted-2">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- cards mobile ---------- */}
            <ul className="divide-y divide-border md:hidden">
              {rows.map((row, i) => (
                <li key={row.id}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    onClick={() => {
                      setActiveIdx(i);
                      if (row.drawer) setDrawerIdx(i);
                      else if (row.editHref) router.push(row.editHref);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{row.title}</div>
                      {row.subtitle && <div className="mt-0.5 truncate text-xs text-muted">{row.subtitle}</div>}
                      {row.meta && <div className="mt-1 text-xs text-muted-2">{row.meta}</div>}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-2" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ---------- paginação ---------- */}
      {total > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {num(fromN)}–{num(toN)} de {num(total)}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={per}
              onChange={(e) => update({ per: e.target.value })}
              className="h-8 rounded-lg border border-border bg-surface-2 px-2 text-xs text-foreground"
              aria-label="Registros por página"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / pág.</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
                className="rounded-lg border border-border p-1.5 transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-16 text-center tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) }, false)}
                className="rounded-lg border border-border p-1.5 transition-colors hover:text-foreground disabled:opacity-30"
                aria-label="Próxima página"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- barra flutuante de ações em massa ---------- */}
      {selected.size > 0 && bulkActions.length > 0 && (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-strong bg-surface-2 px-4 py-2.5 shadow-card">
            <span className="text-xs font-semibold text-foreground">
              {allFiltered ? `${num(total)} filtrados` : `${selected.size} na página`}
            </span>
            {selected.size === rows.length && total > rows.length && !allFiltered && (
              <button
                onClick={() => setAllFiltered(true)}
                className="text-xs text-[#7ea2ff] underline-offset-2 hover:underline"
              >
                selecionar todos os {num(total)} filtrados
              </button>
            )}
            <div className="mx-1 h-4 w-px bg-border-strong" />
            {bulkActions.map((action) => (
              <button
                key={action.id}
                disabled={bulkPending}
                onClick={() => runBulk(action)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                  action.danger
                    ? "bg-danger/10 text-danger hover:bg-danger/20"
                    : "bg-surface-3 text-foreground hover:bg-border"
                )}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => { setSelected(new Set()); setAllFiltered(false); }}
              className="rounded-lg p-1 text-muted-2 transition-colors hover:text-foreground"
              aria-label="Limpar seleção"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ---------- painel lateral (DetailPanel) ---------- */}
      {drawerRow && (
        <DetailDrawer
          open
          onClose={() => setDrawerIdx(-1)}
          onPrev={drawerIdx > 0 ? () => { setDrawerIdx(drawerIdx - 1); setActiveIdx(drawerIdx - 1); } : undefined}
          onNext={drawerIdx < rows.length - 1 ? () => { setDrawerIdx(drawerIdx + 1); setActiveIdx(drawerIdx + 1); } : undefined}
          fullHref={drawerRow.editHref}
          title={drawerRow.drawerTitle ?? drawerRow.title}
          subtitle={drawerRow.drawerSubtitle ?? drawerRow.subtitle}
          footer={drawerRow.drawerFooter}
        >
          {drawerRow.drawer}
        </DetailDrawer>
      )}
    </div>
  );
}

/* ---------- menu de colunas com drag-and-drop ---------- */

function ColumnConfig({
  columns,
  hidden,
  order,
  onChange,
}: {
  columns: TableColumn[];
  hidden: string[];
  order: string[];
  onChange: (hidden: string[], order: string[]) => void;
}) {
  const ordered = useMemo(() => {
    if (!order.length) return columns;
    return [...columns].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [columns, order]);
  const dragId = useRef<string | null>(null);

  return (
    <>
      <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-2">
        Colunas (arraste para reordenar)
      </p>
      {ordered.map((col) => {
        const on = !hidden.includes(col.id);
        return (
          <div
            key={col.id}
            draggable
            onDragStart={() => (dragId.current = col.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!dragId.current || dragId.current === col.id) return;
              const ids = ordered.map((c) => c.id);
              const from = ids.indexOf(dragId.current);
              const to = ids.indexOf(col.id);
              ids.splice(to, 0, ids.splice(from, 1)[0]);
              onChange(hidden, ids);
              dragId.current = null;
            }}
            className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted hover:bg-surface-3"
          >
            <GripVertical className="size-3.5 shrink-0 text-muted-2" />
            <button
              onClick={() =>
                onChange(on ? [...hidden, col.id] : hidden.filter((h) => h !== col.id), order)
              }
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border",
                  on ? "border-accent bg-accent text-white" : "border-border-strong"
                )}
              >
                {on && <Check className="size-3" />}
              </span>
              <span className="truncate">{col.label}</span>
            </button>
          </div>
        );
      })}
    </>
  );
}
