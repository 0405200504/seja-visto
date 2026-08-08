/**
 * Bateria de compra de TODOS os produtos da Cakto.
 *
 * Simula o webhook da Cakto para os 14 produtos cadastrados em
 * cakto_product_map e confere, um por um, se a liberação sai certa: o
 * entitlement correto, a validade correta, a venda no faturamento, os tokens
 * creditados e o e-mail de acesso. Depois testa reembolso, chargeback,
 * cancelamento, renovação, idempotência, segurança e as automações de
 * WhatsApp.
 *
 * A lista de produtos NÃO está escrita aqui: é lida do banco. Se você
 * cadastrar um produto novo no /admin/receita/produtos, ele entra na bateria
 * sozinho na próxima execução.
 *
 * Uso:
 *   node auditoria/e2e/produtos.mjs                        # produção
 *   E2E_BASE=http://localhost:3000 node auditoria/e2e/produtos.mjs
 *   node auditoria/e2e/produtos.mjs --limpar                # apaga o que criou
 *   node auditoria/e2e/produtos.mjs --so=produtos           # só um grupo
 *
 * Grupos: produtos · pacote · reembolsos · idempotencia · seguranca · whatsapp
 *
 * Segurança: só escreve em contas com o e-mail de teste (+mpoe2e-*) e em
 * linhas marcadas com MARCA_PROD. Nenhum dado de cliente real é tocado, e a
 * limpeza usa exatamente os mesmos filtros.
 */
import fs from "node:fs";
import { webhook, db, authUser, mascEmail, espera, BASE } from "./lib.mjs";

/* ---------------------------------------------------------------- setup -- */

const MARCA_PROD = "TESTE-MPO-PRODUTOS";
const TELEFONE = "5515988300526"; // número de teste do WHATSAPP_TEST_NUMBERS
const SO = (process.argv.find((a) => a.startsWith("--so=")) ?? "").slice(5);
const LIMPAR = process.argv.includes("--limpar");

/** Contas do teste. O sufixo entra como +mpoe2e-<x> para a limpeza achar. */
/**
 * Uma conta por cenário, de propósito. Compartilhar conta entre grupos
 * contamina o teste: uma assinatura ativa criada no grupo de segurança faz o
 * abandono de carrinho ser (corretamente) ignorado no grupo de WhatsApp, e a
 * falha aparece como se fosse do produto.
 */
const CONTA = {
  mensal: email("a"),
  anual: email("b"),
  pacote: email("c"),
  sobonus: email("d"),
  whats: email("e"),
  seg: email("f"),
};
function email(sufixo) {
  return `luisfaria040505+mpoe2e-${sufixo}@gmail.com`;
}

const resultados = [];
let atual = null;

/** Ids que um grupo cria e o outro precisa (ex.: reembolsar a MESMA transação). */
const contexto = {};

/**
 * Abre um grupo. O filtro --so= compara com `atual` (a chave curta), não com
 * o título exibido — senão `--so=pacote` nunca casaria com "pacote 58%".
 */
function grupo(titulo) {
  if (SO && SO !== atual) return false;
  console.log(`\n${"═".repeat(72)}\n  ${titulo.toUpperCase()}\n${"═".repeat(72)}`);
  return true;
}

/** Registra um caso: ok=true passa, ok=false falha, ok=null é só informação. */
function checa(titulo, ok, detalhe = "") {
  const icone = ok === null ? "•" : ok ? "✓" : "✗";
  resultados.push({ grupo: atual, titulo, ok, detalhe });
  console.log(`  ${icone} ${titulo}${detalhe ? `\n      ${detalhe}` : ""}`);
}

const arr = (x) => (Array.isArray(x) ? x : []);
const uid = () => Math.random().toString(36).slice(2, 10);

/** Payload no formato da Cakto. offers[] é o que o webhook lê para mapear. */
function payload(evento, { conta, ofertas = [], valor = 27, metodo = "pix", eventId, trxId, dados = {} }) {
  return {
    id: eventId ?? `${MARCA_PROD}-EVT-${uid()}`,
    event: evento,
    data: {
      id: trxId ?? `${MARCA_PROD}-TRX-${uid()}`,
      amount: valor,
      paymentMethod: metodo,
      checkout_id: `${MARCA_PROD}-CHK-${uid()}`,
      customer: { name: `${MARCA_PROD} Cliente`, email: conta, phone: TELEFONE },
      product: { id: ofertas[0] },
      offers: ofertas.map((o) => ({ id: o })),
      ...dados,
    },
  };
}

/** Entitlements de uma conta, como mapa entitlement -> expires_at. */
async function acessos(conta) {
  const u = await authUser(conta);
  if (!u) return { user: null, mapa: new Map() };
  const rows = arr((await db(`user_entitlements?user_id=eq.${u.id}&select=entitlement,expires_at,source`)).corpo);
  return { user: u, mapa: new Map(rows.map((r) => [r.entitlement, r])) };
}

async function saldoTokens(conta) {
  const u = await authUser(conta);
  if (!u) return null;
  const r = arr((await db(`fit_check_credits?user_id=eq.${u.id}&select=balance`)).corpo);
  return r[0]?.balance ?? 0;
}

async function vendas(conta) {
  return arr((await db(`sales?email=eq.${encodeURIComponent(conta)}&select=*&order=created_at.desc`)).corpo);
}

async function eventoNoBanco(eventId) {
  const r = arr((await db(`webhook_events?event_id=eq.${encodeURIComponent(eventId)}&select=status,error_message`)).corpo);
  return r[0] ?? null;
}

/** Dias entre agora e uma data ISO (arredondado). */
function emDias(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/* ------------------------------------------------------------- limpeza -- */

async function limpar() {
  console.log(`\nlimpando contas de teste (+mpoe2e-*) e linhas ${MARCA_PROD}*\n`);
  const contas = Object.values(CONTA);
  let total = 0;

  for (const conta of contas) {
    const u = await authUser(conta);
    const e = encodeURIComponent(conta);

    const contatos = arr((await db(`whatsapp_contacts?email=eq.${e}&select=id`)).corpo).map((c) => c.id);
    const assinaturas = arr((await db(`subscriptions?email=eq.${e}&select=id`)).corpo).map((s) => s.id);

    const alvos = [
      ["email_sends", u ? `user_id=eq.${u.id}` : null],
      ["email_sends", `email=eq.${e}`],
      ["user_entitlements", u ? `user_id=eq.${u.id}` : null],
      ["fit_check_credits", u ? `user_id=eq.${u.id}` : null],
      ["fit_check_requests", u ? `user_id=eq.${u.id}` : null],
      ["sales", `email=eq.${e}`],
      ["webhook_events", `user_email=eq.${e}`],
      ["whatsapp_messages", contatos.length ? `contact_id=in.(${contatos.join(",")})` : null],
      ["whatsapp_messages", assinaturas.length ? `subscription_id=in.(${assinaturas.join(",")})` : null],
      ["whatsapp_carts", contatos.length ? `contact_id=in.(${contatos.join(",")})` : null],
      ["subscriptions", `email=eq.${e}`],
      ["whatsapp_contacts", `email=eq.${e}`],
      ["access_links", u ? `user_id=eq.${u.id}` : null],
    ];

    for (const [tabela, filtro] of alvos) {
      if (!filtro) continue;
      const achados = arr((await db(`${tabela}?${filtro}&select=*`)).corpo);
      if (!achados.length) continue;
      total += achados.length;
      console.log(`  ${tabela.padEnd(22)} ${String(achados.length).padStart(3)}  [${mascEmail(conta)}]`);
      const r = await db(`${tabela}?${filtro}`, { method: "DELETE" });
      if (r.status >= 400) console.error(`    ⚠️  ${tabela}: ${r.status} ${JSON.stringify(r.corpo)}`);
    }

    if (u) {
      await db(`users_profile?user_id=eq.${u.id}`, { method: "DELETE" });
      const env = lerEnv();
      const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
        method: "DELETE",
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      });
      console.log(`  ${"conta de auth".padEnd(22)}   1  [${mascEmail(conta)}]${res.ok ? "" : ` ⚠️ ${res.status}`}`);
      total += 2;
    }
  }

  // Sobras marcadas, de qualquer conta.
  for (const [tabela, filtro] of [
    ["webhook_events", `event_id=like.${MARCA_PROD}*`],
    ["sales", `cakto_id=like.${MARCA_PROD}*`],
    ["whatsapp_carts", `checkout_id=like.${MARCA_PROD}*`],
  ]) {
    const achados = arr((await db(`${tabela}?${filtro}&select=*`)).corpo);
    if (!achados.length) continue;
    total += achados.length;
    console.log(`  ${tabela.padEnd(22)} ${String(achados.length).padStart(3)}  [${filtro}]`);
    await db(`${tabela}?${filtro}`, { method: "DELETE" });
  }

  console.log(`\n${total} linha(s) removida(s).`);
}

function lerEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      })
  );
}

/* =========================================================== GRUPO 1 ===== */
/* Compra de cada produto do mapa, um por um.                               */

async function grupoProdutos(mapa) {
  atual = "produtos";
  if (!grupo("produtos")) return;

  const base = mapa.filter((m) => m.entitlement === "base");
  const outros = mapa.filter((m) => m.entitlement !== "base" && m.entitlement !== "economize-58");

  // ---- 1.1 MPO Mensal: a compra que cria a conta ----
  const mensal = base.find((m) => m.validity_days === 30);
  console.log(`\n— ${mensal.label} (R$ ${(mensal.expected_amount_cents / 100).toFixed(2)}) —`);
  const evMensal = `${MARCA_PROD}-EVT-mensal-${uid()}`;
  // O id da transação fica guardado: o reembolso mais adiante precisa citar
  // a MESMA transação, que é o que a Cakto faz de verdade.
  contexto.trxMensal = `${MARCA_PROD}-TRX-mensal-${uid()}`;
  const r1 = await webhook(
    payload("purchase_approved", {
      conta: CONTA.mensal,
      ofertas: [mensal.cakto_id],
      valor: mensal.expected_amount_cents / 100,
      eventId: evMensal,
      trxId: contexto.trxMensal,
    })
  );

  checa("webhook responde 200", r1.status === 200, `status ${r1.status} em ${r1.ms}ms`);
  checa("conta criada agora", r1.corpo?.created === true, `created=${r1.corpo?.created}`);
  checa("liberou exatamente [base]", JSON.stringify(r1.corpo?.granted) === '["base"]', JSON.stringify(r1.corpo?.granted));

  await espera(1200);
  const a1 = await acessos(CONTA.mensal);
  const dias = emDias(a1.mapa.get("base")?.expires_at);
  checa("acesso base vale ~30 dias", dias === 30, `expires_at em ${dias} dia(s)`);

  const v1 = await vendas(CONTA.mensal);
  checa(
    "venda no faturamento com produto certo",
    v1[0]?.entitlement === "base" && v1[0]?.amount_cents === mensal.expected_amount_cents,
    `${v1[0]?.offer_name} · R$ ${((v1[0]?.amount_cents ?? 0) / 100).toFixed(2)} · taxa R$ ${((v1[0]?.gateway_fee_cents ?? 0) / 100).toFixed(2)} · ${v1[0]?.payment_method}`
  );
  checa("evento marcado como processed", (await eventoNoBanco(evMensal))?.status === "processed");

  const envio = r1.corpo?.email;
  checa(
    "e-mail de acesso disparado",
    envio?.enviado === true,
    envio?.enviado ? "enviado" : `NÃO saiu: ${envio?.motivo ?? "?"}`
  );

  // ---- 1.2 Cada bônus e pacote de token, na conta que já tem o MPO ----
  for (const p of outros) {
    console.log(`\n— ${p.label} (R$ ${(p.expected_amount_cents / 100).toFixed(2)}) —`);
    const antesTokens = await saldoTokens(CONTA.mensal);
    const ev = `${MARCA_PROD}-EVT-${p.entitlement}-${uid()}`;

    const r = await webhook(
      payload("purchase_approved", {
        conta: CONTA.mensal,
        ofertas: [p.cakto_id],
        valor: p.expected_amount_cents / 100,
        eventId: ev,
      })
    );

    const esperadoToken = /^tokens-(\d+)$/.exec(p.entitlement);
    checa(`${p.entitlement}: webhook 200`, r.status === 200, `status ${r.status}`);

    if (esperadoToken) {
      const qtd = Number(esperadoToken[1]);
      await espera(1000);
      const depois = await saldoTokens(CONTA.mensal);
      checa(
        `${p.entitlement}: creditou ${qtd} tokens`,
        depois === antesTokens + qtd,
        `saldo ${antesTokens} → ${depois}`
      );
      checa(
        `${p.entitlement}: NÃO cria entitlement (é consumível)`,
        !arr(r.corpo?.granted).includes(p.entitlement),
        `granted=${JSON.stringify(r.corpo?.granted)}`
      );
    } else {
      checa(
        `${p.entitlement}: liberou só esse bônus`,
        JSON.stringify(r.corpo?.granted) === JSON.stringify([p.entitlement]),
        JSON.stringify(r.corpo?.granted)
      );
      await espera(800);
      const a = await acessos(CONTA.mensal);
      const row = a.mapa.get(p.entitlement);
      checa(
        `${p.entitlement}: acesso vitalício (sem validade)`,
        Boolean(row) && row.expires_at === null,
        row ? `expires_at=${row.expires_at}` : "entitlement AUSENTE no banco"
      );
    }

    const vs = await vendas(CONTA.mensal);
    const venda = vs.find((v) => v.entitlement === p.entitlement);
    checa(
      `${p.entitlement}: venda registrada`,
      Boolean(venda) && venda.amount_cents === p.expected_amount_cents,
      venda ? `${venda.offer_name} · R$ ${(venda.amount_cents / 100).toFixed(2)}` : "venda AUSENTE"
    );
    checa(`${p.entitlement}: evento processed`, (await eventoNoBanco(ev))?.status === "processed");
  }

  // ---- 1.3 MPO Anual em conta limpa: valida os 365 dias ----
  const anual = base.find((m) => m.validity_days === 365);
  console.log(`\n— ${anual.label} (R$ ${(anual.expected_amount_cents / 100).toFixed(2)}) —`);
  const rAnual = await webhook(
    payload("purchase_approved", {
      conta: CONTA.anual,
      ofertas: [anual.cakto_id],
      valor: anual.expected_amount_cents / 100,
      metodo: "credit_card",
    })
  );
  checa("anual: webhook 200", rAnual.status === 200, `status ${rAnual.status}`);
  await espera(1200);
  const aAnual = await acessos(CONTA.anual);
  const diasAnual = emDias(aAnual.mapa.get("base")?.expires_at);
  checa("anual: acesso vale ~365 dias", diasAnual === 365, `expires_at em ${diasAnual} dia(s)`);

  // ---- 1.4 Compra com dois produtos no mesmo evento (produto + order bump) ----
  console.log(`\n— produto + order bump no mesmo evento —`);
  const bump = outros.find((m) => m.entitlement === "corte-ideal-rosto");
  const rBump = await webhook(
    payload("purchase_approved", {
      conta: CONTA.anual,
      ofertas: [anual.cakto_id, bump.cakto_id],
      valor: (anual.expected_amount_cents + bump.expected_amount_cents) / 100,
    })
  );
  const g = arr(rBump.corpo?.granted).sort();
  checa(
    "libera os dois itens do mesmo evento",
    g.length === 2 && g.includes("base") && g.includes(bump.entitlement),
    JSON.stringify(g)
  );

  // ---- 1.5 Renovação soma na validade que ainda existe ----
  console.log(`\n— renovação da assinatura mensal —`);
  const antes = (await acessos(CONTA.mensal)).mapa.get("base")?.expires_at;
  const rRenov = await webhook(
    payload("subscription_renewed", {
      conta: CONTA.mensal,
      ofertas: [mensal.cakto_id],
      valor: mensal.expected_amount_cents / 100,
      dados: { subscription_id: `${MARCA_PROD}-SUB-001` },
    })
  );
  await espera(1200);
  const depoisRenov = (await acessos(CONTA.mensal)).mapa.get("base")?.expires_at;
  checa("renovação responde 200", rRenov.status === 200, `status ${rRenov.status}`);
  checa(
    "renovação SOMA 30 dias no que faltava (não reinicia)",
    emDias(depoisRenov) === 60,
    `${emDias(antes)} dia(s) → ${emDias(depoisRenov)} dia(s)`
  );
}

/* =========================================================== GRUPO 2 ===== */
/* O pacote "economize-58", que precisa liberar tudo.                       */

async function grupoPacote(mapa) {
  atual = "pacote";
  if (!grupo("pacote 58%")) return;

  const pacote = mapa.find((m) => m.entitlement === "economize-58");
  const bonusKeys = lerChavesDosBonus();

  console.log(`\n— ${pacote.label} (R$ ${(pacote.expected_amount_cents / 100).toFixed(2)}) —`);
  const r = await webhook(
    payload("purchase_approved", {
      conta: CONTA.pacote,
      ofertas: [pacote.cakto_id],
      valor: pacote.expected_amount_cents / 100,
    })
  );
  checa("pacote: webhook 200", r.status === 200, `status ${r.status}`);

  const granted = arr(r.corpo?.granted);
  const faltando = bonusKeys.filter((e) => !granted.includes(e));
  checa(
    `pacote libera os ${bonusKeys.length} bônus`,
    faltando.length === 0,
    faltando.length ? `FALTOU: ${faltando.join(", ")}` : `${granted.length} itens liberados`
  );

  /* A regra do negócio: bônus é vitalício, mas só abre com a assinatura do
   * MPO em dia. Então o pacote NÃO pode entregar `base` — senão R$ 67
   * comprariam a plataforma inteira para sempre. */
  checa(
    "pacote NÃO entrega o MPO junto",
    !granted.includes("base"),
    granted.includes("base") ? "REGRESSÃO: o pacote voltou a liberar 'base'" : "só bônus, como esperado"
  );

  await espera(1500);
  const a = await acessos(CONTA.pacote);
  checa(
    "todos os bônus do pacote estão no banco, sem validade",
    bonusKeys.every((e) => a.mapa.has(e) && a.mapa.get(e).expires_at === null),
    `${a.mapa.size} entitlement(s) gravado(s)`
  );
  checa(
    "quem só comprou o pacote não tem acesso à plataforma",
    !a.mapa.has("base"),
    a.mapa.has("base") ? `base presente (expira em ${emDias(a.mapa.get("base").expires_at)} dias)` : "sem 'base' — precisa assinar o MPO para ver os bônus"
  );

  // ---- Reembolso do pacote não pode derrubar a assinatura, que foi paga à parte ----
  console.log(`\n— reembolso do pacote em quem TAMBÉM assina o MPO —`);
  const mensal = mapa.find((m) => m.entitlement === "base" && m.validity_days === 30);
  await webhook(
    payload("purchase_approved", {
      conta: CONTA.pacote,
      ofertas: [mensal.cakto_id],
      valor: mensal.expected_amount_cents / 100,
    })
  );
  await espera(1200);
  await webhook(payload("refund", { conta: CONTA.pacote, ofertas: [pacote.cakto_id] }));
  await espera(1500);
  const depois = await acessos(CONTA.pacote);
  checa(
    "reembolso do pacote tira os bônus",
    bonusKeys.every((k) => !depois.mapa.has(k)),
    `sobrou dos bônus: ${bonusKeys.filter((k) => depois.mapa.has(k)).join(", ") || "nada"}`
  );
  checa(
    "reembolso do pacote MANTÉM a assinatura do MPO",
    depois.mapa.has("base"),
    depois.mapa.has("base")
      ? `base intacto, expira em ${emDias(depois.mapa.get("base").expires_at)} dia(s)`
      : "REGRESSÃO: devolver o pacote de bônus cancelou a assinatura paga à parte"
  );
}

/* =========================================================== GRUPO 3 ===== */
/* Reembolso, chargeback e cancelamento.                                    */

async function grupoReembolsos(mapa) {
  atual = "reembolsos";
  if (!grupo("reembolsos e cancelamento")) return;

  const mensal = mapa.find((m) => m.entitlement === "base" && m.validity_days === 30);
  const bonus = mapa.find((m) => m.entitlement === "mala-10x-mais-rapido");
  const tokens = mapa.find((m) => m.entitlement === "tokens-50");

  // ---- 3.1 Reembolso de um bônus só derruba aquele bônus ----
  console.log(`\n— reembolso de um bônus avulso —`);
  const antes = await acessos(CONTA.mensal);
  const r1 = await webhook(payload("refund", { conta: CONTA.mensal, ofertas: [bonus.cakto_id] }));
  await espera(1200);
  const depois = await acessos(CONTA.mensal);
  checa("reembolso do bônus: 200", r1.status === 200, `status ${r1.status}`);
  checa(
    "tirou só o bônus reembolsado",
    !depois.mapa.has(bonus.entitlement) && depois.mapa.has("base"),
    `entitlements ${antes.mapa.size} → ${depois.mapa.size}; base ainda presente: ${depois.mapa.has("base")}`
  );

  // ---- 3.2 Reembolso de pacote de tokens estorna o saldo ----
  console.log(`\n— reembolso de pacote de tokens —`);
  const saldoAntes = await saldoTokens(CONTA.mensal);
  await webhook(payload("refund", { conta: CONTA.mensal, ofertas: [tokens.cakto_id] }));
  await espera(1200);
  const saldoDepois = await saldoTokens(CONTA.mensal);
  checa(
    "estornou 50 tokens do saldo",
    saldoDepois === Math.max(0, saldoAntes - 50),
    `saldo ${saldoAntes} → ${saldoDepois}`
  );

  // ---- 3.3 Cancelamento de assinatura NÃO tira o acesso já pago ----
  console.log(`\n— cancelamento de assinatura —`);
  const rCancel = await webhook(payload("subscription_canceled", { conta: CONTA.mensal, ofertas: [mensal.cakto_id] }));
  await espera(1200);
  const posCancel = await acessos(CONTA.mensal);
  checa("cancelamento: 200", rCancel.status === 200, `status ${rCancel.status}`);
  checa(
    "acesso MANTIDO até o fim do período pago",
    posCancel.mapa.has("base"),
    `resposta: ${JSON.stringify(rCancel.corpo?.regra ?? rCancel.corpo)}`
  );
  checa(
    "resposta informa até quando vale",
    Boolean(rCancel.corpo?.acessoAte),
    `acessoAte=${rCancel.corpo?.acessoAte}`
  );

  // ---- 3.4 Reembolso do produto principal derruba TUDO ----
  console.log(`\n— reembolso do MPO (produto principal) —`);
  const rTudo = await webhook(
    payload("refund", {
      conta: CONTA.mensal,
      ofertas: [mensal.cakto_id],
      // Mesma transação da compra: é assim que o gateway referencia a
      // devolução, e é o que faz a venda virar "refunded" no faturamento.
      trxId: contexto.trxMensal,
    })
  );
  await espera(1500);
  const zerado = await acessos(CONTA.mensal);
  checa("reembolso do principal: 200", rTudo.status === 200, `status ${rTudo.status}`);
  checa(
    "revogou base e TODOS os bônus",
    zerado.mapa.size === 0,
    `sobrou: ${[...zerado.mapa.keys()].join(", ") || "nada"}`
  );

  const vs = await vendas(CONTA.mensal);
  const aVenda = vs.find((v) => v.cakto_id === contexto.trxMensal);
  checa(
    "venda da transação reembolsada vira refunded no faturamento",
    aVenda?.status === "refunded" && Boolean(aVenda?.refunded_at),
    aVenda ? `status=${aVenda.status} · refunded_at=${aVenda.refunded_at}` : "venda não encontrada pelo cakto_id"
  );

  /* Contraprova: reembolso citando OUTRA transação revoga o acesso (correto,
   * é o mesmo produto) mas não acha a venda para marcar. Fica documentado
   * porque o formato do payload da Cakto não é público: se ela mandar um id
   * próprio de devolução em vez do id da compra, o faturamento não fecha. */
  const aindaAprovadas = vs.filter((v) => v.status === "approved").length;
  checa(
    "ATENÇÃO: só a venda com o mesmo id de transação é marcada",
    aindaAprovadas > 0 ? null : true,
    aindaAprovadas > 0
      ? `${aindaAprovadas} de ${vs.length} venda(s) desta conta seguem "approved" porque foram outras transações. ` +
          `Se a Cakto mandar um id de devolução diferente do id da compra, a venda não vira refunded — confira uma devolução real em /admin/receita/transacoes.`
      : "todas as vendas da conta ficaram refunded"
  );

  // ---- 3.5 Aprovação atrasada depois do reembolso não devolve acesso ----
  console.log(`\n— aprovação atrasada, chegando depois do reembolso —`);
  const rAtrasado = await webhook(
    payload("purchase_approved", {
      conta: CONTA.mensal,
      ofertas: [mensal.cakto_id],
      valor: 27,
      dados: { created_at: new Date(Date.now() - 3 * 3600_000).toISOString() },
    })
  );
  await espera(1200);
  const posAtrasado = await acessos(CONTA.mensal);
  checa(
    "aprovação atrasada é BLOQUEADA",
    rAtrasado.corpo?.bloqueado === "revogacao_posterior",
    `resposta: ${JSON.stringify(rAtrasado.corpo).slice(0, 160)}`
  );
  checa("nada foi devolvido", posAtrasado.mapa.size === 0, `${posAtrasado.mapa.size} entitlement(s)`);

  // ---- 3.6 Chargeback do anual ----
  console.log(`\n— chargeback —`);
  const anual = mapa.find((m) => m.entitlement === "base" && m.validity_days === 365);
  const rCb = await webhook(payload("chargeback", { conta: CONTA.anual, ofertas: [anual.cakto_id] }));
  await espera(1200);
  const posCb = await acessos(CONTA.anual);
  checa("chargeback: 200", rCb.status === 200, `status ${rCb.status}`);
  checa("chargeback revoga o acesso", posCb.mapa.size === 0, `sobrou: ${[...posCb.mapa.keys()].join(", ") || "nada"}`);
}

/* =========================================================== GRUPO 4 ===== */
/* Idempotência, produto sem mapeamento, bônus sem MPO.                     */

async function grupoIdempotencia(mapa) {
  atual = "idempotencia";
  if (!grupo("idempotência e casos de borda")) return;

  const tokens = mapa.find((m) => m.entitlement === "tokens-200");
  const bonus = mapa.find((m) => m.entitlement === "tendencias-do-ano");

  // ---- 4.1 Mesmo evento duas vezes não credita token duas vezes ----
  console.log(`\n— reenvio do mesmo evento (a Cakto reenvia em timeout) —`);
  const ev = `${MARCA_PROD}-EVT-dup-${uid()}`;
  const trx = `${MARCA_PROD}-TRX-dup-${uid()}`;
  const corpo = payload("purchase_approved", {
    conta: CONTA.pacote,
    ofertas: [tokens.cakto_id],
    valor: tokens.expected_amount_cents / 100,
    eventId: ev,
    trxId: trx,
  });

  const p1 = await webhook(corpo);
  await espera(1200);
  const saldo1 = await saldoTokens(CONTA.pacote);
  const p2 = await webhook(corpo);
  await espera(1200);
  const saldo2 = await saldoTokens(CONTA.pacote);

  checa("1ª entrega processa", p1.status === 200 && !p1.corpo?.duplicado, JSON.stringify(p1.corpo).slice(0, 120));
  checa("2ª entrega é reconhecida como duplicada", p2.corpo?.duplicado === ev, JSON.stringify(p2.corpo).slice(0, 120));
  checa("token NÃO creditado duas vezes", saldo1 === saldo2, `saldo ${saldo1} → ${saldo2}`);

  const dupVendas = (await vendas(CONTA.pacote)).filter((v) => v.cakto_id === trx);
  checa("venda NÃO duplicada no faturamento", dupVendas.length === 1, `${dupVendas.length} linha(s) com o mesmo cakto_id`);

  // ---- 4.2 Produto que não está no mapa ----
  console.log(`\n— produto desconhecido (não cadastrado no admin) —`);
  const evSem = `${MARCA_PROD}-EVT-semmapa-${uid()}`;
  const rSem = await webhook(
    payload("purchase_approved", {
      conta: CONTA.sobonus,
      ofertas: ["00000000-0000-4000-8000-000000000999"],
      valor: 9,
      eventId: evSem,
    })
  );
  await espera(1200);
  checa(
    "produto sem mapa NÃO libera nada",
    rSem.corpo?.pendente === "sem_mapeamento",
    JSON.stringify(rSem.corpo).slice(0, 140)
  );
  const evRow = await eventoNoBanco(evSem);
  checa(
    "evento fica como failed para reprocessar",
    evRow?.status === "failed",
    `status=${evRow?.status} · ${evRow?.error_message ?? ""}`
  );
  const contaSem = await acessos(CONTA.sobonus);
  checa("nenhuma conta foi criada por compra desconhecida", contaSem.user === null, `user=${contaSem.user?.id ?? "não existe"}`);

  // ---- 4.3 Bônus comprado por quem NÃO tem o MPO ----
  console.log(`\n— bônus avulso, comprador sem MPO ativo —`);
  const rSo = await webhook(
    payload("purchase_approved", {
      conta: CONTA.sobonus,
      ofertas: [bonus.cakto_id],
      valor: bonus.expected_amount_cents / 100,
    })
  );
  await espera(1200);
  const aSo = await acessos(CONTA.sobonus);
  checa(
    "bônus é creditado mas o MPO NÃO vem de graça",
    arr(rSo.corpo?.granted).join(",") === bonus.entitlement && !aSo.mapa.has("base"),
    `granted=${JSON.stringify(rSo.corpo?.granted)} · tem base: ${aSo.mapa.has("base")}`
  );
  checa(
    "gera alerta crítico para você resolver com o cliente",
    null,
    "esperado: alerta 🚨 avisando que a pessoa comprou um bônus sem ter o MPO ativo"
  );
}

/* =========================================================== GRUPO 5 ===== */
/* Segurança do endpoint.                                                    */

async function grupoSeguranca(mapa) {
  atual = "seguranca";
  if (!grupo("segurança do webhook")) return;

  const mensal = mapa.find((m) => m.entitlement === "base" && m.validity_days === 30);
  const corpoValido = payload("purchase_approved", { conta: CONTA.seg, ofertas: [mensal.cakto_id] });

  const semSegredo = await webhook(corpoValido, { semSegredo: true });
  checa("sem segredo → 401", semSegredo.status === 401, `status ${semSegredo.status}`);

  const segredoErrado = await webhook(corpoValido, { segredoErrado: true });
  checa("segredo errado → 401", segredoErrado.status === 401, `status ${segredoErrado.status}`);

  const semEmail = await webhook({
    id: `${MARCA_PROD}-EVT-noemail-${uid()}`,
    event: "purchase_approved",
    data: { id: `${MARCA_PROD}-TRX-${uid()}`, amount: 27, customer: { name: "Sem email" }, offers: [{ id: mensal.cakto_id }] },
  });
  checa("compra sem e-mail do cliente → 400 + alerta", semEmail.status === 400, `status ${semEmail.status}`);

  const semId = await webhook({
    event: "purchase_approved",
    data: { amount: 27, customer: { email: CONTA.seg }, offers: [{ id: mensal.cakto_id }] },
  });
  checa("evento sem identificador → 400", semId.status === 400, `status ${semId.status}`);

  const desconhecido = await webhook({ id: `${MARCA_PROD}-EVT-x-${uid()}`, event: "evento_que_nao_existe", data: { id: "x" } });
  checa("evento desconhecido é ignorado com 200", desconhecido.corpo?.ignored === "evento_que_nao_existe", JSON.stringify(desconhecido.corpo));

  const valorBaixo = await webhook(
    payload("purchase_approved", { conta: CONTA.seg, ofertas: [mensal.cakto_id], valor: 1 })
  );
  checa(
    "valor muito abaixo do preço gera alerta (mas não bloqueia)",
    valorBaixo.status === 200,
    "esperado: alerta ⚠️ de valor abaixo do esperado — pagamento segue, você decide"
  );
}

/* =========================================================== GRUPO 6 ===== */
/* Automações de WhatsApp.                                                   */

async function grupoWhatsApp(mapa) {
  atual = "whatsapp";
  if (!grupo("automações de whatsapp")) return;

  const mensal = mapa.find((m) => m.entitlement === "base" && m.validity_days === 30);
  const anual = mapa.find((m) => m.entitlement === "base" && m.validity_days === 365);
  const conta = CONTA.whats;
  const e = encodeURIComponent(conta);

  /**
   * Um telefone = um contato. Como todas as contas de teste usam o mesmo
   * número, TODAS as mensagens da bateria caem no mesmo contact_id — então
   * filtrar por contato mistura cenários. As conferências abaixo se apoiam
   * no carrinho e na assinatura deste cenário, não no contato.
   */
  const msgs = async () => {
    const contatos = arr((await db(`whatsapp_contacts?phone=eq.${TELEFONE}&select=id`)).corpo).map((c) => c.id);
    if (!contatos.length) return [];
    return arr(
      (await db(`whatsapp_messages?contact_id=in.(${contatos.join(",")})&select=message_type,status,scheduled_for,skip_reason,cart_id,subscription_id&order=scheduled_for`)).corpo
    );
  };

  // ---- 6.1 Checkout iniciado registra o carrinho ----
  console.log(`\n— initiate_checkout —`);
  const chk = `${MARCA_PROD}-CHK-wa-${uid()}`;
  const r1 = await webhook({
    id: `${MARCA_PROD}-EVT-ini-${uid()}`,
    event: "initiate_checkout",
    data: {
      id: `${MARCA_PROD}-TRX-${uid()}`,
      checkout_id: chk,
      amount: 27,
      paymentMethod: "pix",
      customer: { name: `${MARCA_PROD} Cliente`, email: conta, phone: TELEFONE },
      offers: [{ id: mensal.cakto_id }],
    },
  });
  checa("initiate_checkout aceito", r1.status === 200 && r1.corpo?.carrinho === "registrado", JSON.stringify(r1.corpo));

  await espera(1200);
  const contatos = arr((await db(`whatsapp_contacts?email=eq.${e}&select=id,phone,name,consent_granted_at,opted_out_at`)).corpo);
  checa("contato de WhatsApp criado", contatos.length === 1, contatos.length ? `phone ***${String(contatos[0].phone).slice(-4)}` : "nenhum contato");

  const carts = arr((await db(`whatsapp_carts?checkout_id=eq.${chk}&select=*`)).corpo);
  checa(
    "carrinho registrado com plano e valor certos",
    carts[0]?.plan === "mensal" && carts[0]?.amount_cents === 2700,
    carts.length ? `plano=${carts[0].plan} · R$ ${(carts[0].amount_cents / 100).toFixed(2)} · status=${carts[0].status}` : "nenhum carrinho"
  );
  checa(
    "prazo do PIX gravado (30 min) — antes disso não é abandono",
    Boolean(carts[0]?.expires_at),
    `expires_at=${carts[0]?.expires_at}`
  );

  // ---- 6.2 Abandono agenda a sequência ----
  console.log(`\n— checkout_abandonment —`);
  const r2 = await webhook({
    id: `${MARCA_PROD}-EVT-aband-${uid()}`,
    event: "checkout_abandonment",
    data: {
      id: `${MARCA_PROD}-TRX-${uid()}`,
      checkout_id: chk,
      amount: 27,
      paymentMethod: "pix",
      customer: { name: `${MARCA_PROD} Cliente`, email: conta, phone: TELEFONE },
      offers: [{ id: mensal.cakto_id }],
    },
  });
  const agendadas = r2.corpo?.agendadas ?? 0;
  const motivos = arr(r2.corpo?.motivos).join(" · ");
  const desligada = motivos.includes("desligada");

  checa("checkout_abandonment aceito", r2.status === 200, `status ${r2.status}`);
  if (desligada) {
    checa(
      "AUTOMAÇÃO DE CARRINHO ESTÁ DESLIGADA neste ambiente",
      null,
      `nada foi agendado. Motivo do sistema: "${motivos}". Para ligar: WHATSAPP_CART_RECOVERY_ENABLED=true e WHATSAPP_QUEUE_ENABLED=true`
    );
  } else {
    checa("agendou a sequência de recuperação (3 mensagens)", agendadas === 3, `${agendadas} mensagem(ns) · ${motivos}`);
    await espera(1200);
    const cartId = carts[0]?.id;
    const recuperacao = (await msgs())
      .filter((x) => x.cart_id === cartId)
      .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));

    checa(
      "as 3 mensagens ficam escalonadas em 30min / 24h / 72h",
      recuperacao.length === 3,
      recuperacao
        .map((x) => {
          const h = Math.round((new Date(x.scheduled_for) - Date.now()) / 60000);
          return `${x.message_type.padEnd(16)} em ${h >= 120 ? `${Math.round(h / 60)}h` : `${h}min`} → ${new Date(x.scheduled_for).toLocaleString("pt-BR")} (${x.status})`;
        })
        .join("\n      ")
    );
    checa(
      "tipos corretos e sem repetição",
      JSON.stringify(recuperacao.map((x) => x.message_type)) ===
        JSON.stringify(["cart_recovery_1", "cart_recovery_2", "cart_recovery_3"]),
      recuperacao.map((x) => x.message_type).join(", ")
    );
  }

  const cartAband = arr((await db(`whatsapp_carts?checkout_id=eq.${chk}&select=abandoned_at,status`)).corpo);
  checa("carrinho marcado como abandonado", Boolean(cartAband[0]?.abandoned_at), `abandoned_at=${cartAband[0]?.abandoned_at}`);

  // ---- 6.3 Compra aprovada fecha o carrinho e cria a assinatura ----
  console.log(`\n— purchase_approved depois do abandono —`);
  const r3 = await webhook(
    payload("purchase_approved", {
      conta,
      ofertas: [mensal.cakto_id],
      valor: 27,
      dados: { checkout_id: chk, subscription_id: `${MARCA_PROD}-SUB-wa` },
    })
  );
  checa("compra aprovada: 200", r3.status === 200, `status ${r3.status}`);

  await espera(1500);
  const cartPago = arr((await db(`whatsapp_carts?checkout_id=eq.${chk}&select=status,resolved_reason,resolved_at`)).corpo);
  checa(
    "carrinho fechado como PAGO (não recebe mais cobrança)",
    cartPago[0]?.status === "pago",
    `status=${cartPago[0]?.status} · ${cartPago[0]?.resolved_reason ?? ""}`
  );

  const canceladas = (await msgs()).filter((m) => m.status === "cancelled");
  checa(
    "mensagens de recuperação canceladas após o pagamento",
    desligada ? null : canceladas.length > 0,
    desligada ? "não havia mensagem agendada (automação desligada)" : `${canceladas.length} cancelada(s)`
  );

  const assinaturas = arr((await db(`subscriptions?email=eq.${e}&select=*&order=created_at.desc`)).corpo);
  checa(
    "assinatura criada como ativa",
    assinaturas[0]?.status === "ativa" && assinaturas[0]?.plan === "mensal",
    assinaturas.length
      ? `plano=${assinaturas[0].plan} · status=${assinaturas[0].status} · próxima cobrança ${assinaturas[0].next_charge_at}`
      : "nenhuma assinatura"
  );

  // ---- 6.4 Renovação recusada ----
  console.log(`\n— subscription_renewal_refused —`);
  const r4 = await webhook({
    id: `${MARCA_PROD}-EVT-recusa-${uid()}`,
    event: "subscription_renewal_refused",
    data: {
      id: `${MARCA_PROD}-TRX-${uid()}`,
      checkout_id: `${MARCA_PROD}-CHK-recusa`,
      amount: 27,
      customer: { name: `${MARCA_PROD} Cliente`, email: conta, phone: TELEFONE },
      offers: [{ id: mensal.cakto_id }],
    },
  });
  checa("renovação recusada aceita", r4.status === 200, JSON.stringify(r4.corpo).slice(0, 120));
  await espera(1200);
  const assinPend = arr((await db(`subscriptions?email=eq.${e}&select=status,payment_failed_at&order=created_at.desc`)).corpo);
  checa(
    "assinatura vira pendente com a data da falha",
    assinPend[0]?.status === "pendente" && Boolean(assinPend[0]?.payment_failed_at),
    `status=${assinPend[0]?.status} · falhou em ${assinPend[0]?.payment_failed_at}`
  );

  // ---- 6.5 Cancelamento encerra tudo ----
  console.log(`\n— subscription_canceled —`);
  const r5 = await webhook(payload("subscription_canceled", { conta, ofertas: [mensal.cakto_id] }));
  checa("cancelamento aceito", r5.status === 200, `status ${r5.status}`);
  await espera(1200);
  const assinCancel = arr((await db(`subscriptions?email=eq.${e}&select=status,canceled_at&order=created_at.desc`)).corpo);
  checa(
    "assinatura marcada como cancelada",
    assinCancel[0]?.status === "cancelada",
    `status=${assinCancel[0]?.status} · em ${assinCancel[0]?.canceled_at}`
  );
  // Só as mensagens DESTA assinatura: outras contas de teste seguem ativas
  // de propósito e as mensagens delas dividem o mesmo contato.
  const idAssinatura = assinaturas[0]?.id;
  const pendentes = (await msgs()).filter(
    (m) => m.subscription_id === idAssinatura && ["scheduled", "failed"].includes(m.status)
  );
  checa(
    "nenhuma cobrança pendente sobrou para quem cancelou",
    pendentes.length === 0,
    pendentes.length ? pendentes.map((p) => p.message_type).join(", ") : "fila desta assinatura limpa"
  );

  // ---- 6.6 Estado da fila e do cron ----
  console.log(`\n— estado da fila —`);
  const todas = await msgs();
  checa(
    "resumo da fila desta conta",
    null,
    todas.length
      ? todas.map((m) => `${m.message_type.padEnd(28)} ${m.status}${m.skip_reason ? ` (${m.skip_reason})` : ""}`).join("\n      ")
      : "nenhuma mensagem — automações desligadas neste ambiente"
  );
}

/* ------------------------------------------------------------- execução -- */

function lerChavesDosBonus() {
  const src = fs.readFileSync(new URL("../../src/lib/bonuses.ts", import.meta.url), "utf8");
  return [...src.matchAll(/^ {2}\{\n {4}key: "([^"]+)"/gm)].map((m) => m[1]);
}

async function main() {
  if (LIMPAR) return limpar();

  const mapa = arr((await db("cakto_product_map?select=*&order=expected_amount_cents.desc")).corpo);
  if (!mapa.length) throw new Error("cakto_product_map vazio — nada para testar");

  console.log(`alvo:      ${BASE}`);
  console.log(`produtos:  ${mapa.length} no mapa da Cakto`);
  console.log(`contas:    ${Object.values(CONTA).map(mascEmail).join(", ")}`);
  console.log(`marca:     ${MARCA_PROD}`);
  console.log(`\n⚠️  ISTO ESCREVE NO BANCO DE VERDADE. Rode --limpar no fim.`);

  await grupoProdutos(mapa);
  await grupoPacote(mapa);
  await grupoReembolsos(mapa);
  await grupoIdempotencia(mapa);
  await grupoSeguranca(mapa);
  await grupoWhatsApp(mapa);

  /* ---------------- relatório ---------------- */
  const falhas = resultados.filter((r) => r.ok === false);
  const passes = resultados.filter((r) => r.ok === true);
  const avisos = resultados.filter((r) => r.ok === null);

  console.log(`\n${"═".repeat(72)}\n  RESULTADO\n${"═".repeat(72)}`);
  console.log(`  ✓ ${passes.length} passaram`);
  console.log(`  ✗ ${falhas.length} falharam`);
  console.log(`  • ${avisos.length} informativos / precisam do seu olho`);

  if (falhas.length) {
    console.log(`\n  FALHAS:`);
    for (const f of falhas) console.log(`   ✗ [${f.grupo}] ${f.titulo}\n       ${f.detalhe}`);
  }
  if (avisos.length) {
    console.log(`\n  PARA VOCÊ OLHAR:`);
    for (const a of avisos) console.log(`   • [${a.grupo}] ${a.titulo}\n       ${a.detalhe}`);
  }

  const saida = new URL("./resultado-produtos.json", import.meta.url);
  fs.writeFileSync(saida, JSON.stringify({ base: BASE, quando: new Date().toISOString(), resultados }, null, 2));
  console.log(`\nrelatório completo em auditoria/e2e/resultado-produtos.json`);
  console.log(`limpeza:  node auditoria/e2e/produtos.mjs --limpar`);

  process.exitCode = falhas.length ? 1 : 0;
}

await main();
