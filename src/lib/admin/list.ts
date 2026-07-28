/**
 * Estado padrão das listas do admin. Tudo vive na URL:
 *   ?q=&sort=coluna.dir&page=&per=&f_status=a,b&view=nome
 * As páginas (RSC) usam parseListParams para montar a query no Supabase
 * com paginação server-side.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export type ListParams = {
  q: string;
  page: number;       // 1-based
  per: number;        // 25 | 50 | 100
  sortCol: string;
  sortAsc: boolean;
  filters: Record<string, string[]>;
  /** range para o supabase: .range(from, to) */
  from: number;
  to: number;
};

const PER_OPTIONS = [25, 50, 100];

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export function parseListParams(
  sp: SearchParams,
  defaults: { sort: string; per?: number }
): ListParams {
  const q = one(sp.q).trim();
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);
  const perRaw = parseInt(one(sp.per), 10);
  const per = PER_OPTIONS.includes(perRaw) ? perRaw : (defaults.per ?? 25);

  const sortRaw = one(sp.sort) || defaults.sort;
  const [sortCol, dir] = sortRaw.split(".");
  const sortAsc = dir === "asc";

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!key.startsWith("f_")) continue;
    const values = one(value).split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length) filters[key.slice(2)] = values;
  }

  const from = (page - 1) * per;
  return { q, page, per, sortCol: sortCol || defaults.sort.split(".")[0], sortAsc, filters, from, to: from + per - 1 };
}

/** Reconstrói ListParams a partir de uma querystring (usado nos exports CSV). */
export function paramsFromQueryString(
  qs: string,
  defaults: { sort: string; per?: number },
  maxRows = 10000
): ListParams {
  const usp = new URLSearchParams(qs);
  const sp: SearchParams = {};
  for (const [k, v] of usp.entries()) sp[k] = v;
  const params = parseListParams(sp, defaults);
  return { ...params, page: 1, per: maxRows, from: 0, to: maxRows - 1 };
}

/** Escapa um valor para o operador .or()/.ilike() do PostgREST. */
export function ilikePattern(q: string): string {
  return `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
}

/* ---------- CSV ---------- */

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Separador ; — abre certo no Excel/Numbers em pt-BR
  const lines = [headers.map(escape).join(";"), ...rows.map((r) => r.map(escape).join(";"))];
  return "﻿" + lines.join("\n");
}
