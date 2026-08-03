/**
 * Remove TUDO que a bateria E2E criou.
 *
 * Só apaga o que casa com o cliente de teste ou com a MARCA da execução —
 * nenhuma linha de cliente real é tocada. Roda em modo simulação por padrão:
 *
 *   node auditoria/e2e/limpeza.mjs            # só lista o que apagaria
 *   node auditoria/e2e/limpeza.mjs --apagar   # apaga de verdade
 */
import fs from "node:fs";
import { MARCA, EMAIL_TESTE, db, authUser, mascEmail } from "./lib.mjs";

const APAGAR = process.argv.includes("--apagar");
const emailUrl = encodeURIComponent(EMAIL_TESTE);
const arr = (x) => (Array.isArray(x) ? x : []);

const u = await authUser(EMAIL_TESTE);
console.log(`cliente de teste: ${mascEmail(EMAIL_TESTE)} ${u ? `(${u.id})` : "(não existe)"}`);
console.log(`modo: ${APAGAR ? "APAGAR" : "simulação — nada será removido"}\n`);

/** Alvos, do mais dependente para o menos — evita erro de chave estrangeira. */
const ALVOS = [
  ["email_sends", u ? `user_id=eq.${u.id}` : null],
  ["email_sends", `email=eq.${emailUrl}`],
  ["user_entitlements", u ? `user_id=eq.${u.id}` : null],
  ["fit_check_credits", u ? `user_id=eq.${u.id}` : null],
  ["sales", `email=eq.${emailUrl}`],
  ["sales", `cakto_id=like.${MARCA}*`],
  ["subscriptions", `email=eq.${emailUrl}`],
  ["webhook_events", `user_email=eq.${emailUrl}`],
  ["webhook_events", `event_id=like.${MARCA}*`],
  ["whatsapp_messages", null], // filtrado abaixo, depende do contato
  ["whatsapp_carts", `checkout_id=like.${MARCA}*`],
  ["whatsapp_contacts", `email=eq.${emailUrl}`],
];

// Mensagens dependem do contato de teste; resolve o id antes.
const contatos = arr((await db(`whatsapp_contacts?email=eq.${emailUrl}&select=id`)).corpo).map((c) => c.id);

let removidos = 0;
for (const [tabela, filtro] of ALVOS) {
  let f = filtro;
  if (tabela === "whatsapp_messages") {
    if (!contatos.length) continue;
    f = `contact_id=in.(${contatos.join(",")})`;
  }
  if (!f) continue;

  const achados = arr((await db(`${tabela}?${f}&select=*`)).corpo);
  if (!achados.length) continue;

  console.log(`${tabela.padEnd(20)} ${String(achados.length).padStart(3)} linha(s)  [${f}]`);
  removidos += achados.length;

  if (APAGAR) {
    const r = await db(`${tabela}?${f}`, { method: "DELETE" });
    if (r.status >= 400) console.error(`  ⚠️  falha ao apagar ${tabela}: ${r.status} ${JSON.stringify(r.corpo)}`);
  }
}

// O perfil e a conta de auth vão por último.
if (u) {
  console.log(`${"users_profile".padEnd(20)}   1 linha(s)  [user_id=${u.id}]`);
  console.log(`${"auth.users".padEnd(20)}   1 conta      [${mascEmail(EMAIL_TESTE)}]`);
  removidos += 2;

  if (APAGAR) {
    await db(`users_profile?user_id=eq.${u.id}`, { method: "DELETE" });
    const env = Object.fromEntries(
      fs.readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
        .split("\n").filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
      method: "DELETE",
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) console.error(`  ⚠️  falha ao apagar a conta de auth: ${res.status}`);
  }
}

console.log(`\n${APAGAR ? "removidas" : "seriam removidas"} ${removidos} linha(s).`);
if (!APAGAR) console.log("rode com --apagar para executar.");
