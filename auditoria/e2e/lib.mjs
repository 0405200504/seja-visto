/**
 * Utilitários do teste E2E do funil da Cakto.
 *
 * Tudo que escreve no banco real passa por aqui: o identificador de teste
 * está fixado num só lugar, para a limpeza no fim conseguir achar 100% do
 * que foi criado. Nenhum segredo é impresso.
 */
import fs from "node:fs";

export const MARCA = "TESTE-MPO-E2E-20260803";
export const EMAIL_TESTE = "luisfaria040505+mpoe2e@gmail.com";
export const TELEFONE_TESTE = "5515988300526";
export const NOME_TESTE = `${MARCA} Cliente`;

/** Produto MPO Mensal no mapa da Cakto (base, 30 dias, R$ 27). */
export const PRODUTO_MENSAL = "70571f0c-4435-4189-a7b9-fbc72578fa39";
export const PRODUTO_ANUAL = "d5294929-026b-43e9-ab2e-609e9b09f9b4";
export const PRODUTO_BONUS = "ac0ee9ff-a3e0-4a82-a444-b38c4af9dddd"; // grupo-whatsapp, R$17

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

export const BASE = process.env.E2E_BASE ?? "https://www.manualpraticodooutfit.com.br";
export const WEBHOOK = `${BASE}/api/webhooks/cakto`;
const SEGREDO = env.CAKTO_WEBHOOK_SECRET;
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SEGREDO || !SUPA_KEY) throw new Error("faltam CAKTO_WEBHOOK_SECRET / SUPABASE_SERVICE_ROLE_KEY no .env.local");

/** Mascara e-mail para o relatório. */
export const mascEmail = (e) => (e ? e.replace(/^(.{1,3})[^@]*(@.*)$/, "$1***$2") : e);
/** Mascara telefone deixando país e final. */
export const mascTel = (t) => (t ? `${t.slice(0, 4)}*****${t.slice(-4)}` : t);

/** POST no webhook, com o segredo no header (nunca no corpo gravado). */
export async function webhook(payload, { semSegredo = false, segredoErrado = false } = {}) {
  const t0 = Date.now();
  const headers = { "Content-Type": "application/json" };
  if (!semSegredo) headers["x-cakto-secret"] = segredoErrado ? "segredo-invalido-de-teste" : SEGREDO;
  const res = await fetch(WEBHOOK, { method: "POST", headers, body: JSON.stringify(payload) });
  const texto = await res.text();
  let corpo;
  try { corpo = JSON.parse(texto); } catch { corpo = texto; }
  return { status: res.status, corpo, ms: Date.now() - t0 };
}

/** Monta um payload no formato que a Cakto envia. */
export function evento(tipo, { eventId, transacaoId, produtos = [PRODUTO_MENSAL], valor = 27, metodo = "pix", extra = {}, dados = {} } = {}) {
  const id = eventId ?? `${MARCA}-EVT-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    event: tipo,
    data: {
      id: transacaoId ?? `${MARCA}-TRX-${Math.random().toString(36).slice(2, 10)}`,
      amount: valor,
      paymentMethod: metodo,
      checkout_id: `${MARCA}-CHK-001`,
      customer: { name: NOME_TESTE, email: EMAIL_TESTE, phone: TELEFONE_TESTE },
      product: { id: produtos[0] },
      offers: produtos.map((p) => ({ id: p })),
      ...dados,
    },
    ...extra,
  };
}

/** REST do Supabase com service role. Só o teste usa. */
export async function db(caminho, opcoes = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      Prefer: opcoes.method === "PATCH" || opcoes.method === "POST" ? "return=representation" : "count=exact",
      ...(opcoes.headers ?? {}),
    },
  });
  const texto = await res.text();
  let corpo = null;
  try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
  return { status: res.status, corpo };
}

/** Usuário do Supabase Auth pelo e-mail (admin API). */
export async function authUser(email) {
  const res = await fetch(`${SUPA_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  const j = await res.json().catch(() => ({}));
  return (j.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}


/** Contagem exata de linhas, lida do header Content-Range do PostgREST. */
export const supabase = {
  async total(tabela, filtro = "") {
    const url = `${SUPA_URL}/rest/v1/${tabela}?select=id${filtro ? "&" + filtro : ""}&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    return (res.headers.get("content-range") ?? "?/?").split("/")[1];
  },
};

export const espera = (ms) => new Promise((r) => setTimeout(r, ms));
