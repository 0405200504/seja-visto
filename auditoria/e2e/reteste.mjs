/**
 * Reteste dos defeitos encontrados, contra o código corrigido.
 *
 * Roda contra o servidor apontado por E2E_BASE (local, com o código da
 * branch) e usa o MESMO banco de produção — é o que garante que a correção
 * foi exercitada de ponta a ponta, e não só no teste unitário.
 *
 *   E2E_BASE=http://localhost:3000 node auditoria/e2e/reteste.mjs
 *
 * Cada cenário monta o estado que precisa do zero, para não depender da
 * ordem de execução (foi o que estragou o H3 na primeira rodada).
 */
import fs from "node:fs";
import {
  MARCA, EMAIL_TESTE, PRODUTO_MENSAL, webhook, evento, db, authUser, espera, mascEmail,
} from "./lib.mjs";

const resultados = [];
let passou = 0, falhou = 0;
function checar(id, cenario, esperado, obtido, ok, evidencia = {}) {
  resultados.push({ id, cenario, esperado, obtido, veredito: ok ? "APROVADO" : "REPROVADO", evidencia });
  ok ? passou++ : falhou++;
  console.log(`${ok ? "✅" : "❌"} ${id.padEnd(8)} ${cenario}`);
  if (!ok) console.log(`           esperado: ${esperado}\n           obtido:   ${obtido}`);
}

const arr = (x) => (Array.isArray(x) ? x : []);
const sufixo = Date.now().toString(36);

async function ents(userId) {
  return arr((await db(`user_entitlements?user_id=eq.${userId}&select=entitlement,expires_at`)).corpo);
}
const base = (lista) => lista.find((x) => x.entitlement === "base");

/** Zera o cliente de teste para o cenário começar limpo. */
async function zerar(u) {
  await db(`user_entitlements?user_id=eq.${u.id}`, { method: "DELETE" });
  await db(`sales?email=eq.${encodeURIComponent(EMAIL_TESTE)}`, { method: "DELETE" });
  await db(`subscriptions?email=eq.${encodeURIComponent(EMAIL_TESTE)}`, { method: "DELETE" });
  await db(`webhook_events?user_email=eq.${encodeURIComponent(EMAIL_TESTE)}`, { method: "DELETE" });
}

const u = await authUser(EMAIL_TESTE);
if (!u) { console.error("cliente de teste não existe — rode a bateria grupo B antes."); process.exit(1); }

// ═══════════════════════════════════════════════════════════════════
// R1 — o defeito F1: aprovação atrasada não pode reativar conta reembolsada
// ═══════════════════════════════════════════════════════════════════
console.log("\n── R1 · evento antigo depois de reembolso ──");
await zerar(u);

const trx = `${MARCA}-R-TRX-${sufixo}`;
await webhook(evento("purchase_approved", {
  eventId: `${MARCA}-R-COMPRA-${sufixo}`, transacaoId: trx, produtos: [PRODUTO_MENSAL], valor: 27,
  dados: { paid_at: "2026-07-01T10:00:00Z" },
}));
await espera(1500);
checar("R1.0", "compra registrada (preparo do cenário)", "entitlement base presente",
  base(await ents(u.id)) ? "base presente" : "base ausente", Boolean(base(await ents(u.id))));

await webhook(evento("refund", {
  eventId: `${MARCA}-R-REFUND-${sufixo}`, transacaoId: trx, produtos: [PRODUTO_MENSAL], valor: 27,
}));
await espera(1200);
checar("R1.1", "reembolso revoga o acesso", "sem entitlement base",
  base(await ents(u.id)) ? "base ainda presente" : "base removido", !base(await ents(u.id)));

// A MESMA compra, reenviada depois do reembolso — o caso que reprovou antes.
const atrasado = await webhook(evento("purchase_approved", {
  eventId: `${MARCA}-R-ATRASADO-${sufixo}`, transacaoId: trx, produtos: [PRODUTO_MENSAL], valor: 27,
  dados: { paid_at: "2026-07-01T10:00:00Z" },
}));
await espera(1500);
const depoisAtrasado = await ents(u.id);
checar("R1.2", "aprovação ATRASADA da mesma transação não devolve o acesso",
  "bloqueado, entitlement base continua ausente",
  `${JSON.stringify(atrasado.corpo)} · base ${base(depoisAtrasado) ? "REATIVADO" : "ausente"}`,
  !base(depoisAtrasado) && atrasado.corpo?.bloqueado === "revogacao_posterior",
  { resposta: atrasado.corpo });

const regEvt = arr((await db(`webhook_events?event_id=eq.${MARCA}-R-ATRASADO-${sufixo}&select=status,error_message`)).corpo)[0];
checar("R1.3", "o bloqueio fica registrado para auditoria", "evento marcado como failed com motivo",
  regEvt ? `${regEvt.status}: ${regEvt.error_message}` : "não registrado",
  regEvt?.status === "failed" && /revogação/i.test(regEvt.error_message ?? ""));

// O outro lado: compra NOVA de quem foi reembolsado precisa liberar.
const novaCompra = await webhook(evento("purchase_approved", {
  eventId: `${MARCA}-R-RECOMPRA-${sufixo}`, transacaoId: `${MARCA}-R-TRX2-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27,
  dados: { paid_at: new Date().toISOString() },
}));
await espera(1500);
checar("R1.4", "compra NOVA de quem já foi reembolsado LIBERA normalmente",
  "acesso concedido — bloquear aqui seria negar produto a quem pagou",
  `${JSON.stringify(novaCompra.corpo)} · base ${base(await ents(u.id)) ? "presente" : "AUSENTE"}`,
  Boolean(base(await ents(u.id))) && novaCompra.corpo?.ok === true);

// ═══════════════════════════════════════════════════════════════════
// R2 — o defeito G1: cancelamento mantém o acesso até o fim do período pago
// ═══════════════════════════════════════════════════════════════════
console.log("\n── R2 · cancelamento de assinatura ──");
await zerar(u);

await webhook(evento("purchase_approved", {
  eventId: `${MARCA}-R2-COMPRA-${sufixo}`, transacaoId: `${MARCA}-R2-TRX-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27, dados: { paid_at: new Date().toISOString() },
}));
await espera(1500);
const antesCancel = base(await ents(u.id));
checar("R2.0", "assinatura ativa (preparo do cenário)", "base com validade de 30 dias",
  antesCancel ? `expira ${antesCancel.expires_at}` : "sem base", Boolean(antesCancel?.expires_at));

const cancel = await webhook(evento("subscription_canceled", {
  eventId: `${MARCA}-R2-CANCEL-${sufixo}`, transacaoId: `${MARCA}-R2-TRX-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27,
}));
await espera(1200);
const depoisCancel = base(await ents(u.id));

checar("R2.1", "cancelamento MANTÉM o acesso até o fim do período já pago",
  "entitlement base preservado com a MESMA data de vencimento",
  depoisCancel ? `base mantido, expira ${depoisCancel.expires_at}` : "base REMOVIDO na hora",
  Boolean(depoisCancel) && depoisCancel.expires_at === antesCancel?.expires_at,
  { resposta: cancel.corpo, antes: antesCancel?.expires_at, depois: depoisCancel?.expires_at });

checar("R2.2", "a resposta declara a regra aplicada", "acessoAte preenchido e regra explícita",
  JSON.stringify(cancel.corpo), Boolean(cancel.corpo?.cancelado) && Boolean(cancel.corpo?.acessoAte));

const assin = arr((await db(`subscriptions?email=eq.${encodeURIComponent(EMAIL_TESTE)}&select=status,canceled_at`)).corpo)[0];
checar("R2.3", "assinatura marcada como cancelada (para a renovação)", "status cancelada com data",
  assin ? `${assin.status} em ${assin.canceled_at}` : "nenhuma assinatura",
  assin?.status === "cancelada" && Boolean(assin.canceled_at));

const evCancel = arr((await db(`webhook_events?event_id=eq.${MARCA}-R2-CANCEL-${sufixo}&select=status`)).corpo)[0];
checar("R2.4", "evento de cancelamento processado", "status processed",
  evCancel?.status ?? "não registrado", evCancel?.status === "processed");

// Reembolso continua cortando na hora — é o contraste que prova a regra.
await webhook(evento("refund", {
  eventId: `${MARCA}-R2-REFUND-${sufixo}`, transacaoId: `${MARCA}-R2-TRX-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27,
}));
await espera(1200);
checar("R2.5", "reembolso CONTINUA revogando na hora", "sem entitlement base",
  base(await ents(u.id)) ? "base ainda presente" : "base removido", !base(await ents(u.id)));

// ═══════════════════════════════════════════════════════════════════
// R3 — renovação soma na validade existente (o H3 inconclusivo)
// ═══════════════════════════════════════════════════════════════════
console.log("\n── R3 · renovação soma na validade ──");
await zerar(u);

await webhook(evento("purchase_approved", {
  eventId: `${MARCA}-R3-COMPRA-${sufixo}`, transacaoId: `${MARCA}-R3-TRX-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27, dados: { paid_at: new Date().toISOString() },
}));
await espera(1500);
const antesRenov = base(await ents(u.id));

const renov = await webhook(evento("subscription_renewed", {
  eventId: `${MARCA}-R3-RENOV-${sufixo}`, transacaoId: `${MARCA}-R3-TRX2-${sufixo}`,
  produtos: [PRODUTO_MENSAL], valor: 27, dados: { paid_at: new Date().toISOString() },
}));
await espera(1500);
const depoisRenov = base(await ents(u.id));
const somou = antesRenov?.expires_at && depoisRenov?.expires_at
  ? Math.round((new Date(depoisRenov.expires_at) - new Date(antesRenov.expires_at)) / 86400000)
  : null;

checar("R3.1", "renovação soma 30 dias sobre a validade que ainda estava de pé",
  "+30 dias — quem renova antes do fim não perde os dias restantes",
  `${antesRenov?.expires_at} → ${depoisRenov?.expires_at} (${somou} dias)`, somou === 30);

const usuarios = arr((await db(`users_profile?email=ilike.${encodeURIComponent(EMAIL_TESTE)}&select=user_id`)).corpo);
checar("R3.2", "renovação não cria segunda conta", "1 perfil só",
  `${usuarios.length} perfil(is)`, usuarios.length === 1);

const emails = arr((await db(`email_sends?user_id=eq.${u.id}&select=tipo,tentativas`)).corpo);
checar("R3.3", "renovação não reenvia o e-mail de primeiro acesso", "e-mail 'acesso' com 1 tentativa",
  emails.map((e) => `${e.tipo}:${e.tentativas}x`).join(", ") || "nenhum",
  emails.filter((e) => e.tipo === "acesso").every((e) => e.tentativas === 1));

fs.writeFileSync(new URL("./resultado-reteste.json", import.meta.url), JSON.stringify({
  em: new Date().toISOString(),
  base: process.env.E2E_BASE ?? "produção",
  cliente: mascEmail(EMAIL_TESTE),
  resumo: { total: passou + falhou, aprovados: passou, reprovados: falhou },
  resultados,
}, null, 2));
console.log(`\n═══ ${passou} aprovados · ${falhou} reprovados ═══`);
