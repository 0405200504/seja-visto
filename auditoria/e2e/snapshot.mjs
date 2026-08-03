/**
 * Fotografia do banco. Rodada antes e depois da bateria para provar que
 * nenhuma linha real foi criada, alterada ou apagada.
 *
 *   node auditoria/e2e/snapshot.mjs antes
 *   node auditoria/e2e/snapshot.mjs depois
 */
import fs from "node:fs";
import { authUser, EMAIL_TESTE, mascEmail, supabase } from "./lib.mjs";

const rotulo = process.argv[2] ?? "antes";

const ALVOS = [
  ["webhook_events", "webhook_events", ""],
  ["sales", "sales", ""],
  ["sales (reais)", "sales", "is_test=eq.false"],
  ["users_profile", "users_profile", ""],
  ["user_entitlements", "user_entitlements", ""],
  ["user_entitlements (base)", "user_entitlements", "entitlement=eq.base"],
  ["subscriptions", "subscriptions", ""],
  ["email_sends", "email_sends", ""],
  ["whatsapp_messages", "whatsapp_messages", ""],
  ["whatsapp_contacts", "whatsapp_contacts", ""],
  ["whatsapp_carts", "whatsapp_carts", ""],
];

const snap = { rotulo, em: new Date().toISOString(), totais: {} };
for (const [rotuloTabela, tabela, filtro] of ALVOS) {
  snap.totais[rotuloTabela] = await supabase.total(tabela, filtro);
}

const u = await authUser(EMAIL_TESTE);
snap.usuarioDeTeste = u ? { existe: true, id: u.id, email: mascEmail(u.email) } : { existe: false };

fs.writeFileSync(new URL(`./snapshot-${rotulo}.json`, import.meta.url), JSON.stringify(snap, null, 2));
console.log(JSON.stringify(snap, null, 2));
