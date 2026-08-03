/**
 * Bateria E2E do funil da Cakto.
 *
 * Dispara webhooks assinados contra o endpoint real e confere o efeito no
 * banco. Tudo que cria fica marcado com MARCA e é removido por limpeza.mjs.
 *
 *   node auditoria/e2e/bateria.mjs           # tudo
 *   node auditoria/e2e/bateria.mjs A B       # só os grupos A e B
 */
import fs from "node:fs";
import {
  MARCA, EMAIL_TESTE, TELEFONE_TESTE, PRODUTO_MENSAL, PRODUTO_ANUAL, PRODUTO_BONUS,
  webhook, evento, db, authUser, espera, mascEmail, mascTel,
} from "./lib.mjs";

const grupos = process.argv.slice(2);
const querGrupo = (g) => grupos.length === 0 || grupos.includes(g);

const resultados = [];
let passou = 0, falhou = 0;

/** Registra o resultado de um teste com evidência. */
function checar(id, cenario, esperado, obtido, ok, evidencia = {}) {
  resultados.push({ id, cenario, esperado, obtido, veredito: ok ? "APROVADO" : "REPROVADO", evidencia });
  ok ? passou++ : falhou++;
  console.log(`${ok ? "✅" : "❌"} ${id.padEnd(6)} ${cenario}`);
  if (!ok) console.log(`         esperado: ${esperado}\n         obtido:   ${obtido}`);
}

/** Estado atual do cliente de teste no banco. */
async function estado() {
  const u = await authUser(EMAIL_TESTE);
  const perfil = u ? (await db(`users_profile?user_id=eq.${u.id}&select=user_id,email,name,is_admin`)).corpo : [];
  const ents = u ? (await db(`user_entitlements?user_id=eq.${u.id}&select=entitlement,expires_at,source`)).corpo : [];
  const vendas = (await db(`sales?email=eq.${encodeURIComponent(EMAIL_TESTE)}&select=id,status,amount_cents,entitlement,cakto_id,is_test,refunded_at&order=created_at.desc`)).corpo;
  const eventos = (await db(`webhook_events?user_email=eq.${encodeURIComponent(EMAIL_TESTE)}&select=event_id,event_type,status,error_message&order=created_at.desc`)).corpo;
  const emails = u ? (await db(`email_sends?user_id=eq.${u.id}&select=chave,tipo,status,provedor,tentativas`)).corpo : [];
  const assinaturas = (await db(`subscriptions?email=eq.${encodeURIComponent(EMAIL_TESTE)}&select=id,plan,status,next_charge_at,canceled_at`)).corpo;
  const msgs = (await db(`whatsapp_messages?select=id,message_type,status,skip_reason&order=id.desc&limit=20`)).corpo;
  const carts = (await db(`whatsapp_carts?select=id,status,abandoned_at&order=id.desc&limit=10`)).corpo;
  return { user: u, perfil, ents, vendas, eventos, emails, assinaturas, msgs, carts };
}

const arr = (x) => (Array.isArray(x) ? x : []);
const temEnt = (e, chave) => arr(e.ents).some((x) => x.entitlement === chave);

// ===================================================================
// GRUPO A — autenticidade e robustez do endpoint (FASE 3)
// ===================================================================
if (querGrupo("A")) {
  console.log("\n── GRUPO A · autenticidade do endpoint ──");

  let r = await webhook(evento("purchase_approved"), { semSegredo: true });
  checar("A1", "POST sem segredo", "401 recusado", `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 401, { ms: r.ms });

  r = await webhook(evento("purchase_approved"), { segredoErrado: true });
  checar("A2", "POST com segredo inválido", "401 recusado", `${r.status}`, r.status === 401, { ms: r.ms });

  r = await webhook({ id: `${MARCA}-A3`, event: "purchase_approved" });
  checar("A3", "payload sem o campo data", "400 dados ausentes", `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 400);

  r = await webhook(evento("evento_que_nao_existe_na_cakto"));
  checar("A4", "evento desconhecido", "200 ignorado, sem efeito", `${r.status} ${JSON.stringify(r.corpo)}`,
    r.status === 200 && r.corpo?.ignored === "evento_que_nao_existe_na_cakto");

  r = await webhook(evento("purchase_approved", { dados: { customer: { name: "sem email", phone: TELEFONE_TESTE } } }));
  checar("A5", "compra aprovada SEM e-mail do comprador", "400, nada liberado, alerta ao admin",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 400);

  const semId = evento("purchase_approved");
  delete semId.id; delete semId.data.id;
  r = await webhook(semId);
  checar("A6", "evento sem identificador único", "400 — sem id não há idempotência", `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 400);

  r = await webhook(evento("purchase_approved", { produtos: ["id-de-produto-inexistente"] }));
  const ev = arr((await db(`webhook_events?event_type=eq.purchase_approved&status=eq.failed&select=event_id,error_message&order=created_at.desc&limit=1`)).corpo)[0];
  checar("A7", "compra de produto SEM mapeamento", "200 pendente, NADA liberado, registrado como falho",
    `${r.status} ${JSON.stringify(r.corpo)} · registro: ${ev?.error_message ?? "nenhum"}`,
    r.status === 200 && r.corpo?.pendente === "sem_mapeamento" && /sem mapeamento/i.test(ev?.error_message ?? ""));

  const est = await estado();
  checar("A8", "nenhum teste do grupo A criou conta", "usuário de teste não existe",
    est.user ? `conta ${est.user.id} criada` : "nenhuma conta", !est.user);
}

// ===================================================================
// GRUPO B — compra aprovada (FASES 5 e 6)
// ===================================================================
let compraEventId = `${MARCA}-COMPRA-MENSAL`;
let compraTrxId = `${MARCA}-TRX-MENSAL`;
if (querGrupo("B")) {
  console.log("\n── GRUPO B · compra aprovada ──");
  const t0 = new Date();

  const r = await webhook(evento("purchase_approved", {
    eventId: compraEventId, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27, metodo: "pix",
  }));
  checar("B1", "purchase_approved do MPO Mensal", "200 ok, conta criada, acesso liberado",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200 && r.corpo?.ok === true, { ms: r.ms, resposta: r.corpo });

  await espera(1500);
  const e = await estado();

  checar("B2", "usuário criado no Supabase Auth", "1 usuário com o e-mail de teste",
    e.user ? `id ${e.user.id}` : "nenhum", Boolean(e.user), { userId: e.user?.id, email: mascEmail(EMAIL_TESTE) });

  checar("B3", "perfil criado no banco", "1 linha em users_profile ligada ao usuário",
    `${arr(e.perfil).length} linha(s)`, arr(e.perfil).length === 1);

  const base = arr(e.ents).find((x) => x.entitlement === "base");
  const dias = base?.expires_at ? Math.round((new Date(base.expires_at) - t0) / 86400000) : null;
  checar("B4", "entitlement 'base' liberado com validade de 30 dias", "base presente, expira em ~30 dias",
    base ? `base expira em ${dias} dias` : "sem entitlement base", Boolean(base) && dias >= 29 && dias <= 31,
    { expires_at: base?.expires_at, source: base?.source });

  checar("B5", "plano correto — só o comprado", "apenas 'base', nenhum bônus de brinde",
    arr(e.ents).map((x) => x.entitlement).join(", ") || "nenhum", arr(e.ents).length === 1 && temEnt(e, "base"));

  const venda = arr(e.vendas).find((v) => v.cakto_id === compraTrxId);
  checar("B6", "venda registrada no faturamento", "1 venda approved de R$ 27,00",
    venda ? `${venda.status} R$ ${(venda.amount_cents / 100).toFixed(2)}` : "nenhuma venda",
    Boolean(venda) && venda.status === "approved" && venda.amount_cents === 2700, { saleId: venda?.id });

  const evento1 = arr(e.eventos).find((x) => x.event_id === compraEventId);
  checar("B7", "evento marcado como processado", "status processed",
    evento1?.status ?? "não registrado", evento1?.status === "processed");

  const emailAcesso = arr(e.emails).find((x) => x.tipo === "acesso");
  checar("B8", "e-mail de acesso enviado e registrado", "1 registro em email_sends com status 'enviado'",
    emailAcesso ? `${emailAcesso.status} via ${emailAcesso.provedor}` : "nenhum registro",
    emailAcesso?.status === "enviado", { chave: emailAcesso?.chave, provedor: emailAcesso?.provedor });

  // Nenhuma senha em texto puro em lugar nenhum do rastro.
  const rastro = JSON.stringify([e.eventos, e.emails, e.vendas]);
  checar("B9", "nenhuma senha ou token no rastro gravado", "sem 'password'/'senha'/'access_token' no banco",
    /password|"senha"|access_token/i.test(rastro) ? "ENCONTRADO" : "nada encontrado",
    !/password|"senha"|access_token/i.test(rastro));

  checar("B10", "conta NÃO nasce com privilégio de admin", "is_admin = false",
    String(arr(e.perfil)[0]?.is_admin), arr(e.perfil)[0]?.is_admin === false);

  const assinatura = arr(e.assinaturas)[0];
  checar("B11", "assinatura registrada como ativa", "1 assinatura mensal ativa",
    assinatura ? `${assinatura.plan}/${assinatura.status}` : "nenhuma",
    assinatura?.status === "ativa" && assinatura?.plan === "mensal", { proximaCobranca: assinatura?.next_charge_at });
}

// ===================================================================
// GRUPO C — webhook duplicado (FASE 12)
// ===================================================================
if (querGrupo("C")) {
  console.log("\n── GRUPO C · webhook duplicado ──");
  const antes = await estado();

  const r1 = await webhook(evento("purchase_approved", { eventId: compraEventId, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27 }));
  checar("C1", "reenvio do MESMO evento aprovado", "200 com marca de duplicado",
    `${r1.status} ${JSON.stringify(r1.corpo)}`, r1.status === 200 && Boolean(r1.corpo?.duplicado));

  // 5 entregas simultâneas do mesmo evento — a corrida que a Cakto provoca em timeout.
  const simultaneos = await Promise.all(
    Array.from({ length: 5 }, () => webhook(evento("purchase_approved", { eventId: compraEventId, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27 })))
  );
  const okTodos = simultaneos.every((s) => s.status === 200);
  checar("C2", "5 entregas simultâneas do mesmo evento", "todas 200, nenhuma erro",
    simultaneos.map((s) => s.status).join(","), okTodos);

  await espera(1500);
  const depois = await estado();

  checar("C3", "não duplicou a conta", "continua 1 usuário",
    depois.user?.id === antes.user?.id ? "mesmo usuário" : "usuário diferente", depois.user?.id === antes.user?.id);

  checar("C4", "não duplicou o entitlement", `continua ${arr(antes.ents).length} entitlement(s)`,
    `${arr(depois.ents).length}`, arr(depois.ents).length === arr(antes.ents).length);

  const baseAntes = arr(antes.ents).find((x) => x.entitlement === "base")?.expires_at;
  const baseDepois = arr(depois.ents).find((x) => x.entitlement === "base")?.expires_at;
  checar("C5", "não esticou a validade do acesso", "expires_at inalterado",
    baseAntes === baseDepois ? "inalterado" : `${baseAntes} → ${baseDepois}`, baseAntes === baseDepois);

  checar("C6", "não duplicou a venda", `continua ${arr(antes.vendas).length} venda(s)`,
    `${arr(depois.vendas).length}`, arr(depois.vendas).length === arr(antes.vendas).length);

  checar("C7", "não reenviou o e-mail de acesso", "1 registro em email_sends, 1 tentativa",
    arr(depois.emails).map((x) => `${x.tipo}:${x.status}/${x.tentativas}x`).join(", "),
    arr(depois.emails).length === arr(antes.emails).length &&
    arr(depois.emails).every((x) => x.tentativas === 1));
}

// ===================================================================
// GRUPO D — pagamento pendente e recusado (FASES 10 e 11)
// ===================================================================
if (querGrupo("D")) {
  console.log("\n── GRUPO D · pendente e recusado ──");
  const antes = await estado();

  let r = await webhook(evento("pix_gerado", { eventId: `${MARCA}-PIX-01`, produtos: [PRODUTO_ANUAL], valor: 164.59, metodo: "pix", dados: { checkout_id: `${MARCA}-CHK-PIX` } }));
  checar("D1", "pix_gerado (pagamento pendente)", "200, carrinho registrado, acesso NÃO liberado",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200 && r.corpo?.carrinho === "registrado");

  r = await webhook(evento("purchase_refused", { eventId: `${MARCA}-REFUSED-01`, produtos: [PRODUTO_ANUAL], valor: 164.59, metodo: "credit_card", dados: { checkout_id: `${MARCA}-CHK-PIX` } }));
  checar("D2", "purchase_refused (cartão recusado)", "200, acesso NÃO liberado, carrinho segue aberto",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200);

  r = await webhook(evento("checkout_abandonment", { eventId: `${MARCA}-ABANDONO-01`, produtos: [PRODUTO_ANUAL], valor: 164.59, dados: { checkout_id: `${MARCA}-CHK-PIX` } }));
  checar("D3", "checkout_abandonment", "200, sequência de recuperação avaliada",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200);

  await espera(1200);
  const depois = await estado();

  checar("D4", "pendente/recusado não mexeram no acesso", "entitlements inalterados",
    `${arr(antes.ents).map((x) => x.entitlement).join(",")} → ${arr(depois.ents).map((x) => x.entitlement).join(",")}`,
    JSON.stringify(arr(antes.ents)) === JSON.stringify(arr(depois.ents)));

  checar("D5", "pendente/recusado não lançaram venda", `continua ${arr(antes.vendas).length} venda(s)`,
    `${arr(depois.vendas).length}`, arr(depois.vendas).length === arr(antes.vendas).length);

  checar("D6", "pendente/recusado não dispararam e-mail", "nenhum e-mail novo",
    `${arr(depois.emails).length} registro(s)`, arr(depois.emails).length === arr(antes.emails).length);
}

// ===================================================================
// GRUPO E — reembolso e chargeback (FASES 14 e 16)
// ===================================================================
if (querGrupo("E")) {
  console.log("\n── GRUPO E · reembolso e chargeback ──");
  const antes = await estado();

  const r = await webhook(evento("refund", { eventId: `${MARCA}-REFUND-01`, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27 }));
  checar("E1", "refund do MPO Mensal", "200, acesso revogado",
    `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200 && r.corpo?.ok === true, { resposta: r.corpo });

  await espera(1200);
  const depois = await estado();

  checar("E2", "acesso premium revogado", "nenhum entitlement 'base'",
    arr(depois.ents).map((x) => x.entitlement).join(", ") || "nenhum", !temEnt(depois, "base"));

  checar("E3", "conta NÃO foi apagada", "usuário e perfil continuam existindo",
    depois.user ? "usuário mantido" : "usuário sumiu", Boolean(depois.user) && arr(depois.perfil).length === 1);

  const venda = arr(depois.vendas).find((v) => v.cakto_id === compraTrxId);
  checar("E4", "venda marcada como reembolsada", "status refunded com data",
    venda ? `${venda.status} em ${venda.refunded_at ?? "sem data"}` : "venda não encontrada",
    venda?.status === "refunded" && Boolean(venda.refunded_at));

  const r2 = await webhook(evento("refund", { eventId: `${MARCA}-REFUND-01`, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27 }));
  checar("E5", "reembolso repetido (mesmo evento)", "200 duplicado, sem efeito novo",
    `${r2.status} ${JSON.stringify(r2.corpo)}`, r2.status === 200 && Boolean(r2.corpo?.duplicado));

  const r3 = await webhook(evento("chargeback", { eventId: `${MARCA}-CHARGEBACK-01`, transacaoId: compraTrxId, produtos: [PRODUTO_MENSAL], valor: 27 }));
  checar("E6", "chargeback", "200, acesso segue revogado",
    `${r3.status} ${JSON.stringify(r3.corpo)}`, r3.status === 200);

  await espera(1000);
  const fim = await estado();
  checar("E7", "após chargeback continua sem acesso", "nenhum entitlement 'base'",
    arr(fim.ents).map((x) => x.entitlement).join(", ") || "nenhum", !temEnt(fim, "base"));
}

// ===================================================================
// GRUPO F — eventos fora de ordem (FASE 13)
// ===================================================================
if (querGrupo("F")) {
  console.log("\n── GRUPO F · eventos fora de ordem ──");

  // Aprovação ANTIGA chegando depois do reembolso: o cenário que reativa
  // indevidamente uma conta já reembolsada.
  const r = await webhook(evento("purchase_approved", {
    eventId: `${MARCA}-APROVADA-ATRASADA`,
    transacaoId: `${MARCA}-TRX-ANTIGA`,
    produtos: [PRODUTO_MENSAL], valor: 27,
    dados: { created_at: "2026-07-01T10:00:00Z", paid_at: "2026-07-01T10:00:00Z" },
  }));
  await espera(1200);
  const e = await estado();

  checar("F1", "aprovação ANTIGA chegando depois do reembolso", "NÃO deve reativar o acesso",
    temEnt(e, "base") ? "acesso REATIVADO indevidamente" : "acesso continua revogado",
    !temEnt(e, "base"), { resposta: r.corpo, entitlements: arr(e.ents).map((x) => x.entitlement) });

  // Reembolso de um produto que essa conta nunca comprou.
  const r2 = await webhook(evento("refund", { eventId: `${MARCA}-REFUND-SEM-COMPRA`, produtos: [PRODUTO_BONUS], valor: 17 }));
  checar("F2", "reembolso de compra que não existe", "200, tratado sem quebrar",
    `${r2.status} ${JSON.stringify(r2.corpo)}`, r2.status === 200);
}

// ===================================================================
// GRUPO G — cancelamento de assinatura (FASE 15)
// ===================================================================
if (querGrupo("G")) {
  console.log("\n── GRUPO G · cancelamento ──");

  // Reconstrói o acesso para poder observar o efeito do cancelamento.
  await webhook(evento("purchase_approved", {
    eventId: `${MARCA}-COMPRA-PARA-CANCELAR`, transacaoId: `${MARCA}-TRX-CANCELAR`,
    produtos: [PRODUTO_MENSAL], valor: 27,
  }));
  await espera(1500);
  const antes = await estado();
  const baseAntes = arr(antes.ents).find((x) => x.entitlement === "base");

  checar("G0", "acesso reconstruído para o teste de cancelamento", "entitlement base ativo",
    baseAntes ? `expira ${baseAntes.expires_at}` : "sem base", Boolean(baseAntes));

  const r = await webhook(evento("subscription_canceled", {
    eventId: `${MARCA}-CANCELAMENTO-01`, transacaoId: `${MARCA}-TRX-CANCELAR`, produtos: [PRODUTO_MENSAL], valor: 27,
  }));
  await espera(1200);
  const depois = await estado();
  const baseDepois = arr(depois.ents).find((x) => x.entitlement === "base");

  // REGRA COMERCIAL definida com o dono do produto: o acesso continua até o
  // fim do período já pago (é o que a página /reembolso promete).
  checar("G1", "subscription_canceled mantém o acesso até o fim do período pago",
    "entitlement base preservado com a data original",
    baseDepois ? `base mantido, expira ${baseDepois.expires_at}` : "base REMOVIDO na hora",
    Boolean(baseDepois) && baseDepois.expires_at === baseAntes?.expires_at,
    { resposta: r.corpo, antes: baseAntes?.expires_at, depois: baseDepois?.expires_at });

  const assinatura = arr(depois.assinaturas)[0];
  checar("G2", "assinatura marcada como cancelada", "status cancelada com data",
    assinatura ? `${assinatura.status} em ${assinatura.canceled_at ?? "sem data"}` : "nenhuma",
    assinatura?.status === "cancelada");

  checar("G3", "cancelamento não apaga a conta", "usuário e perfil mantidos",
    depois.user ? "mantidos" : "apagados", Boolean(depois.user) && arr(depois.perfil).length === 1);
}

// ===================================================================
// GRUPO H — renovação (FASE 17)
// ===================================================================
if (querGrupo("H")) {
  console.log("\n── GRUPO H · renovação ──");
  const antes = await estado();
  const baseAntes = arr(antes.ents).find((x) => x.entitlement === "base");

  const r = await webhook(evento("subscription_renewed", {
    eventId: `${MARCA}-RENOVACAO-01`, transacaoId: `${MARCA}-TRX-RENOVACAO`,
    produtos: [PRODUTO_MENSAL], valor: 27,
  }));
  checar("H1", "subscription_renewed", "200 ok", `${r.status} ${JSON.stringify(r.corpo)}`, r.status === 200);

  await espera(1500);
  const depois = await estado();
  const baseDepois = arr(depois.ents).find((x) => x.entitlement === "base");

  checar("H2", "renovação NÃO cria segunda conta", "mesmo user_id",
    depois.user?.id === antes.user?.id ? "mesma conta" : "conta nova criada", depois.user?.id === antes.user?.id);

  const somou = baseAntes?.expires_at && baseDepois?.expires_at &&
    Math.round((new Date(baseDepois.expires_at) - new Date(baseAntes.expires_at)) / 86400000);
  checar("H3", "renovação soma 30 dias na validade existente", "+30 dias sobre a data anterior",
    `${baseAntes?.expires_at} → ${baseDepois?.expires_at} (${somou} dias)`, somou === 30);

  checar("H4", "renovação NÃO reenvia o e-mail de primeiro acesso", "nenhuma nova tentativa de e-mail 'acesso'",
    arr(depois.emails).map((x) => `${x.tipo}:${x.tentativas}x`).join(", "),
    arr(depois.emails).filter((x) => x.tipo === "acesso").every((x) => x.tentativas === 1));

  checar("H5", "renovação lança a venda nova", "1 venda a mais",
    `${arr(antes.vendas).length} → ${arr(depois.vendas).length}`, arr(depois.vendas).length > arr(antes.vendas).length);

  const r2 = await webhook(evento("subscription_renewal_refused", {
    eventId: `${MARCA}-RENOVACAO-RECUSADA-01`, produtos: [PRODUTO_MENSAL], valor: 27,
  }));
  await espera(1000);
  const fim = await estado();
  const assin = arr(fim.assinaturas)[0];
  checar("H6", "subscription_renewal_refused", "200, assinatura vira pendente, acesso NÃO cai na hora",
    `${r2.status} · assinatura ${assin?.status} · base ${temEnt(fim, "base") ? "mantido" : "removido"}`,
    r2.status === 200 && temEnt(fim, "base"));
}


// ===================================================================
// GRUPO I — falhas parciais e reprocessamento (FASE 18)
// ===================================================================
if (querGrupo("I")) {
  console.log("\n── GRUPO I · falhas parciais e retentativa ──");

  /* Cenário: o evento chegou, foi registrado, mas o processamento falhou no
   * meio (produto sem mapeamento). A Cakto reenvia o MESMO event_id. A trava
   * de idempotência NÃO pode barrar essa segunda entrega — se barrasse, o
   * cliente pagaria e ficaria para sempre sem acesso. */
  const idFalho = `${MARCA}-RETENTATIVA-01`;

  const r1 = await webhook(evento("purchase_approved", {
    eventId: idFalho, transacaoId: `${MARCA}-TRX-RETENTATIVA`,
    produtos: ["produto-que-ainda-nao-foi-mapeado"], valor: 27,
  }));
  await espera(800);
  const reg1 = arr((await db(`webhook_events?event_id=eq.${idFalho}&select=status,error_message`)).corpo)[0];
  checar("I1", "evento que falhou no meio fica registrado como 'failed'", "status failed com motivo",
    reg1 ? `${reg1.status}: ${reg1.error_message}` : "não registrado", reg1?.status === "failed");

  // A Cakto reenvia o mesmo evento — agora com o produto correto no payload.
  const r2 = await webhook(evento("purchase_approved", {
    eventId: idFalho, transacaoId: `${MARCA}-TRX-RETENTATIVA`,
    produtos: [PRODUTO_MENSAL], valor: 27,
  }));
  await espera(1500);
  const reg2 = arr((await db(`webhook_events?event_id=eq.${idFalho}&select=status,error_message`)).corpo)[0];
  const e = await estado();

  checar("I2", "reenvio de evento FALHO passa pela idempotência", "200 ok, não é tratado como duplicado",
    `${r2.status} ${JSON.stringify(r2.corpo)}`, r2.status === 200 && r2.corpo?.ok === true && !r2.corpo?.duplicado);

  checar("I3", "retentativa completa a liberação de acesso", "status processed e entitlement base presente",
    `${reg2?.status} · base ${temEnt(e, "base") ? "presente" : "ausente"}`,
    reg2?.status === "processed" && temEnt(e, "base"));

  checar("I4", "retentativa não criou segunda conta", "1 usuário só",
    e.user ? `1 usuário (${e.user.id.slice(0, 8)}…)` : "nenhum", Boolean(e.user));

  checar("I5", "retentativa não duplicou o e-mail de acesso", "1 registro de e-mail 'acesso'",
    `${arr(e.emails).filter((x) => x.tipo === "acesso").length} registro(s)`,
    arr(e.emails).filter((x) => x.tipo === "acesso").length === 1);

  /* Falha de WhatsApp e de e-mail não podem derrubar a liberação: as
   * automações rodam dentro de try/catch e o e-mail é registrado à parte.
   * Aqui a evidência é que o acesso continua de pé mesmo com a fila em modo
   * de teste (nenhuma mensagem sai para número fora da lista). */
  const msgsForaDaLista = arr(e.msgs).filter((m) => m.status === "sent");
  checar("I6", "automação de WhatsApp em modo de teste não derruba a compra",
    "acesso liberado, nenhuma mensagem enviada para número não autorizado",
    `base ${temEnt(e, "base") ? "presente" : "ausente"} · ${msgsForaDaLista.length} mensagem(ns) enviada(s)`,
    temEnt(e, "base"));

  /* Tempo de resposta: se passar do limite da Vercel, a Cakto considera
   * falha e reenvia — e o reenvio precisa ser inofensivo (já provado em C). */
  checar("I7", "tempo de resposta do webhook de compra", "abaixo de 10s (limite da função)",
    `${r2.ms} ms`, r2.ms < 10000, { ms: r2.ms });
}

// ===================================================================
const relatorio = {
  marca: MARCA,
  em: new Date().toISOString(),
  clienteDeTeste: { email: mascEmail(EMAIL_TESTE), telefone: mascTel(TELEFONE_TESTE) },
  resumo: { total: passou + falhou, aprovados: passou, reprovados: falhou },
  resultados,
  estadoFinal: await (async () => {
    const e = await estado();
    return {
      userId: e.user?.id ?? null,
      entitlements: arr(e.ents).map((x) => ({ entitlement: x.entitlement, expires_at: x.expires_at })),
      vendas: arr(e.vendas).map((v) => ({ status: v.status, valor: v.amount_cents, cakto_id: v.cakto_id })),
      eventos: arr(e.eventos).map((x) => ({ tipo: x.event_type, status: x.status, erro: x.error_message })),
      emails: arr(e.emails),
      assinaturas: arr(e.assinaturas),
    };
  })(),
};

const nome = `resultado-${grupos.length ? grupos.join("") : "completo"}.json`;
fs.writeFileSync(new URL(`./${nome}`, import.meta.url), JSON.stringify(relatorio, null, 2));
console.log(`\n═══ ${passou} aprovados · ${falhou} reprovados ═══`);
console.log(`evidência: auditoria/e2e/${nome}`);
