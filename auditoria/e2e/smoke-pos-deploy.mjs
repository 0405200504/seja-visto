/**
 * Smoke test pós-deploy: confere em PRODUÇÃO que o deploy subiu com as
 * correções, sem criar nada que precise de limpeza.
 *
 *   node auditoria/e2e/smoke-pos-deploy.mjs
 *
 * Os cenários que EXERCITAM as correções (aprovação atrasada, cancelamento)
 * criam dados e ficam na bateria/reteste. Aqui só o que é seguro rodar em
 * produção a qualquer momento.
 */
import { BASE, webhook, evento, db } from "./lib.mjs";

let passou = 0, falhou = 0;
function checar(id, cenario, esperado, obtido, ok) {
  ok ? passou++ : falhou++;
  console.log(`${ok ? "✅" : "❌"} ${id.padEnd(6)} ${cenario}`);
  if (!ok) console.log(`         esperado: ${esperado}\n         obtido:   ${obtido}`);
}

console.log(`smoke test em ${BASE}\n`);

// ── o site está de pé ──────────────────────────────────────────────
for (const [id, rota, nome] of [
  ["P1", "/", "página de vendas"],
  ["P2", "/login", "login"],
  ["P3", "/reembolso", "política de reembolso"],
  ["P4", "/termos", "termos"],
  ["P5", "/privacidade", "privacidade"],
]) {
  const r = await fetch(`${BASE}${rota}`);
  checar(id, `${nome} responde`, "200", String(r.status), r.status === 200);
}

// ── o e-mail de contato corrigido está no ar ───────────────────────
for (const [id, rota] of [["P6", "/reembolso"], ["P7", "/termos"], ["P8", "/privacidade"]]) {
  const html = await (await fetch(`${BASE}${rota}`)).text();
  checar(id, `${rota} mostra suporte@ e não equipe@`, "só suporte@",
    `${html.includes("suporte@manualpraticodooutfit") ? "suporte ok" : "sem suporte"} · ` +
    `${html.includes("equipe@manualpraticodooutfit") ? "AINDA TEM equipe@" : "sem equipe@"}`,
    html.includes("suporte@manualpraticodooutfit") && !html.includes("equipe@manualpraticodooutfit"));
}

// ── o webhook continua trancado ────────────────────────────────────
let r = await webhook(evento("purchase_approved"), { semSegredo: true });
checar("W1", "webhook recusa POST sem segredo", "401", String(r.status), r.status === 401);

r = await webhook(evento("purchase_approved"), { segredoErrado: true });
checar("W2", "webhook recusa segredo inválido", "401", String(r.status), r.status === 401);

// ── o webhook aceita o segredo real e reconhece os eventos novos ───
r = await webhook(evento("__smoke_evento_desconhecido__"));
checar("W3", "webhook autentica com o segredo de produção", "200 ignored",
  `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200 && Boolean(r.corpo?.ignored));

/* subscription_canceled sem cliente cadastrado: exercita o caminho NOVO
 * (cancelamento tem bloco próprio) sem tocar em conta nenhuma. Se o deploy
 * fosse o código antigo, isto cairia no bloco de revogação e a resposta
 * viria com `revoked`, não com `cancelado`. */
r = await webhook(evento("subscription_canceled", {
  eventId: `SMOKE-CANCEL-${Date.now()}`,
  dados: { customer: { name: "smoke test", email: `smoke-${Date.now()}@exemplo-inexistente.invalid` } },
}));
checar("W4", "deploy tem o cancelamento novo (não revoga na hora)",
  "resposta com `cancelado`, não com `revoked`",
  `${r.status} ${JSON.stringify(r.corpo)}`,
  r.status === 200 && r.corpo?.cancelado === true && r.corpo?.regra?.includes("período já pago"));

checar("W5", "tempo de resposta do webhook", "abaixo de 10s", `${r.ms} ms`, r.ms < 10000);

// ── limpa o único registro que o smoke deixou ──────────────────────
await db(`webhook_events?event_id=like.SMOKE-CANCEL-*`, { method: "DELETE" });
const sobrou = (await db(`webhook_events?event_id=like.SMOKE-CANCEL-*&select=event_id`)).corpo;
checar("W6", "smoke test não deixou rastro no banco", "0 linhas",
  `${Array.isArray(sobrou) ? sobrou.length : "?"} linha(s)`, Array.isArray(sobrou) && sobrou.length === 0);

console.log(`\n═══ ${passou} aprovados · ${falhou} reprovados ═══`);
process.exit(falhou > 0 ? 1 : 0);
