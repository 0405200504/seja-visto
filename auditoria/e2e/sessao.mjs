/**
 * Teste de sessão real do cliente de teste (FASES 9 e 14).
 *
 * Faz login de verdade, monta o cookie do @supabase/ssr e bate nas páginas
 * protegidas e na API paga do site em produção. Serve para provar duas
 * coisas que só o código não prova:
 *
 *   · quem tem acesso entra;
 *   · quem foi reembolsado perde o acesso NA MESMA SESSÃO, sem precisar
 *     deslogar — inclusive em chamada direta de API.
 *
 * Nenhuma senha é impressa. A senha de teste é aleatória a cada execução.
 */
import fs from "node:fs";
import { BASE, EMAIL_TESTE, authUser, mascEmail } from "./lib.mjs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REF = new URL(SUPA_URL).hostname.split(".")[0];

const resultados = [];
let passou = 0, falhou = 0;
function checar(id, cenario, esperado, obtido, ok) {
  resultados.push({ id, cenario, esperado, obtido, veredito: ok ? "APROVADO" : "REPROVADO" });
  ok ? passou++ : falhou++;
  console.log(`${ok ? "✅" : "❌"} ${id.padEnd(6)} ${cenario}`);
  if (!ok) console.log(`         esperado: ${esperado}\n         obtido:   ${obtido}`);
}

/** Senha descartável, só existe dentro desta execução. */
function senhaDescartavel() {
  return "T3ste!" + Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");
}

/** Codifica a sessão no formato de cookie do @supabase/ssr. */
function cookieDaSessao(sessao) {
  const valor = "base64-" + Buffer.from(JSON.stringify(sessao), "utf8").toString("base64url");
  const nome = `sb-${REF}-auth-token`;
  // Acima de ~3180 chars o SDK quebra em .0/.1 — o mesmo corte aqui.
  if (valor.length <= 3180) return `${nome}=${valor}`;
  const partes = valor.match(/.{1,3180}/g) ?? [];
  return partes.map((p, i) => `${nome}.${i}=${p}`).join("; ");
}

async function login(senha) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL_TESTE, password: senha }),
  });
  const j = await res.json();
  return { status: res.status, sessao: res.ok ? j : null, erro: res.ok ? null : j.error_description ?? j.msg };
}

/** GET numa rota do site com o cookie de sessão. Não segue redirect. */
async function comoCliente(caminho, cookie) {
  const res = await fetch(`${BASE}${caminho}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, destino: res.headers.get("location") };
}

// ── 1. prepara a sessão ────────────────────────────────────────────
const u = await authUser(EMAIL_TESTE);
if (!u) { console.error("cliente de teste não existe — rode a bateria grupo B antes."); process.exit(1); }

/* O onboarding roda ANTES da porta do conteúdo pago (requireProfile dentro
 * de requirePaidAccess). Sem concluí-lo, todo redirect vira /onboarding e o
 * teste nunca chega a exercitar o /acesso-expirado. */
await fetch(`${SUPA_URL}/rest/v1/users_profile?user_id=eq.${u.id}`, {
  method: "PATCH",
  headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ onboarding_completed: true }),
});

const senha = senhaDescartavel();
const patch = await fetch(`${SUPA_URL}/auth/v1/admin/users/${u.id}`, {
  method: "PUT",
  headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ password: senha }),
});
checar("S1", "cliente define a própria senha (equivale ao /nova-senha)", "senha aceita",
  `HTTP ${patch.status}`, patch.ok);

const { status, sessao, erro } = await login(senha);
checar("S2", "login com e-mail e senha", "sessão emitida",
  sessao ? "token recebido" : `${status} ${erro}`, Boolean(sessao));
if (!sessao) process.exit(1);

const cookie = cookieDaSessao(sessao);

// ── 2. com acesso ativo ────────────────────────────────────────────
console.log("\n── com acesso ativo ──");
for (const [id, rota, nome] of [
  ["S3", "/dashboard", "dashboard"],
  ["S4", "/metodo", "método (conteúdo pago)"],
  ["S5", "/fit-check", "Fit Check"],
]) {
  const r = await comoCliente(rota, cookie);
  checar(id, `cliente pagante abre ${nome}`, "200 (ou onboarding), nunca /acesso-expirado",
    `${r.status}${r.destino ? " → " + r.destino : ""}`,
    r.status === 200 || (r.destino ?? "").includes("/onboarding"));
}

const apiOk = await fetch(`${BASE}/api/fit-check`, {
  method: "POST", headers: { cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ message: "teste e2e de acesso", requestId: `e2e-${Date.now()}-ok` }),
});
const corpoOk = await apiOk.json().catch(() => ({}));
checar("S6", "API paga /api/fit-check com acesso ativo", "não retorna 403 de acesso",
  `${apiOk.status} ${corpoOk.semAcesso ? "semAcesso=true" : ""}`, apiOk.status !== 403);

const admin = await comoCliente("/admin", cookie);
checar("S7", "cliente comum NÃO entra no /admin", "redirecionado para fora do admin",
  `${admin.status}${admin.destino ? " → " + admin.destino : ""}`,
  admin.status !== 200 || (admin.destino ?? "").includes("/dashboard"));

// ── 3. revogação a quente ──────────────────────────────────────────
console.log("\n── revogando o acesso com a sessão ainda aberta ──");
const del = await fetch(`${SUPA_URL}/rest/v1/user_entitlements?user_id=eq.${u.id}&entitlement=eq.base`, {
  method: "DELETE", headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
});
checar("S8", "acesso revogado no banco (simula o efeito do reembolso)", "entitlement removido",
  `HTTP ${del.status}`, del.ok);

// A MESMA sessão, sem novo login.
console.log("\n── mesma sessão, depois da revogação ──");
for (const [id, rota, nome] of [
  ["S9", "/dashboard", "dashboard"],
  ["S10", "/metodo", "método"],
]) {
  const r = await comoCliente(rota, cookie);
  checar(id, `sessão ativa perde ${nome} após revogação`, "redirect para /acesso-expirado",
    `${r.status}${r.destino ? " → " + r.destino : ""}`, (r.destino ?? "").includes("/acesso-expirado"));
}

const apiBloqueada = await fetch(`${BASE}/api/fit-check`, {
  method: "POST", headers: { cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ message: "teste e2e apos revogacao", requestId: `e2e-${Date.now()}-bloq` }),
});
const corpoBloq = await apiBloqueada.json().catch(() => ({}));
checar("S11", "chamada DIRETA à API paga bloqueada após revogação", "403 com semAcesso",
  `${apiBloqueada.status} ${JSON.stringify(corpoBloq).slice(0, 120)}`,
  apiBloqueada.status === 403 && corpoBloq.semAcesso === true);

// ── 4. devolve o acesso e confere o logout ─────────────────────────
await fetch(`${SUPA_URL}/rest/v1/user_entitlements`, {
  method: "POST",
  headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: u.id, entitlement: "base", source: "e2e:restaurado", expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }),
});

const saiu = await fetch(`${SUPA_URL}/auth/v1/logout`, {
  method: "POST",
  headers: { apikey: ANON, Authorization: `Bearer ${sessao.access_token}` },
});
checar("S12", "logout encerra a sessão no servidor", "204/200",
  `HTTP ${saiu.status}`, saiu.status === 204 || saiu.status === 200);

const relogin = await login(senha);
checar("S13", "cliente consegue entrar de novo depois do logout", "nova sessão emitida",
  relogin.sessao ? "ok" : `${relogin.status} ${relogin.erro}`, Boolean(relogin.sessao));

fs.writeFileSync(new URL("./resultado-sessao.json", import.meta.url), JSON.stringify({
  em: new Date().toISOString(),
  cliente: mascEmail(EMAIL_TESTE),
  userId: u.id,
  resumo: { total: passou + falhou, aprovados: passou, reprovados: falhou },
  resultados,
}, null, 2));
console.log(`\n═══ ${passou} aprovados · ${falhou} reprovados ═══`);
