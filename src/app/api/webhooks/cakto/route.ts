import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { chaveAcesso, chaveBonus, enviarEmailRegistrado } from "@/lib/email/envio";
import { emailBonusLiberado } from "@/lib/email/templates";
import { enviarEmailDeAcesso } from "@/lib/email/acesso";
import { BASE_ENTITLEMENT, BONUSES } from "@/lib/bonuses";
import {
  getSetting,
  GATEWAY_DEFAULTS,
  estimarTaxaCakto,
  type GatewaySettings,
} from "@/lib/admin/settings";
import { alertaAdmin } from "@/lib/alerts";
import {
  CANCEL_EVENTS,
  GRANT_EVENTS,
  REVOKE_EVENTS,
  dataDoEvento,
  idsDoPayload,
  motivoDeBloqueio,
  novaValidade,
  parseTokenGrant,
} from "@/lib/cakto/regras";
import { checarRateLimit, ipDaRequisicao } from "@/lib/rate-limit";
import {
  EVENTOS_ABANDONO,
  EVENTOS_CARRINHO,
  EVENTOS_RECUSA,
  tratarAbandono,
  tratarAssinaturaCancelada,
  tratarCheckoutIniciado,
  tratarCompraAprovada,
  tratarRenovacaoRecusada,
} from "@/lib/whatsapp/cakto-eventos";

/**
 * Webhook da Cakto.
 *
 * purchase_approved  -> garante a conta do comprador, libera o produto/bônus
 *                       correspondente e envia o e-mail de acesso.
 * refund/chargeback  -> revoga o entitlement correspondente.
 *
 * O produto principal e cada order bump disparam eventos próprios; o mapa
 * cakto_product_map (gerido no /admin/vendas) traduz o ID da Cakto para a
 * chave do bônus na plataforma.
 */

/**
 * Eventos que só interessam às automações de WhatsApp: não liberam nem
 * revogam acesso, então não passam por entitlement, venda ou e-mail.
 */
const WHATSAPP_EVENTS = new Set([
  ...EVENTOS_CARRINHO,
  ...EVENTOS_ABANDONO,
  ...EVENTOS_RECUSA,
  "subscription_created",
  "subscription_renewal_refused",
]);

/**
 * Senha interna aleatória. NUNCA é transmitida: existe só para a conta não
 * nascer sem senha. O comprador define a dele pelo link de acesso.
 * Usa rejeição para não ter viés de módulo.
 */
function senhaInterna(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const limite = 256 - (256 % alfabeto.length);
  let saida = "";
  while (saida.length < 32) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    for (const b of bytes) {
      if (b < limite && saida.length < 32) saida += alfabeto[b % alfabeto.length];
    }
  }
  return saida;
}

/**
 * Busca no banco as duas provas que `motivoDeBloqueio` precisa para decidir
 * se esta aprovação está atrasada em relação a uma devolução de dinheiro.
 *
 * A decisão em si é pura e vive em lib/cakto/regras.ts — aqui só o I/O.
 */
async function revogacaoPosterior(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  caktoIds: string[],
  quando: Date | null
): Promise<string | null> {
  const ids = caktoIds.filter(Boolean);

  const { data: reembolsadas } = ids.length
    ? await admin
        .from("sales")
        .select("cakto_id, refunded_at")
        .in("cakto_id", ids)
        .eq("status", "refunded")
        .limit(1)
    : { data: [] };

  const { data: revogacoes } = quando
    ? await admin
        .from("webhook_events")
        .select("event_type, created_at")
        .eq("provider", "cakto")
        .eq("user_email", email)
        .in("event_type", [...REVOKE_EVENTS])
        .gt("created_at", quando.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: [] };

  return motivoDeBloqueio({
    vendasReembolsadas: reembolsadas ?? [],
    revogacoesPosteriores: revogacoes ?? [],
    quando,
  });
}

/** Comparação em tempo constante — `!==` vaza informação por tempo. */
function segredoConfere(recebido: string | null | undefined, esperado: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  // Rate limit por IP: sem isto, um atacante pode forçar o segredo à vontade.
  const ip = ipDaRequisicao(request);
  if (!(await checarRateLimit(`cakto:${ip}`, 60, 60))) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação do segredo. A query string saiu de propósito: segredo em URL
  // fica gravado em log de acesso, histórico e cabeçalho Referer.
  const provided =
    (payload.secret as string | undefined) ?? request.headers.get("x-cakto-secret");
  const expected = process.env.CAKTO_WEBHOOK_SECRET;

  if (!expected || !segredoConfere(provided, expected)) {
    // Só alerta em volume: uma tentativa isolada é ruído.
    if (!(await checarRateLimit(`cakto-invalido:${ip}`, 5, 300))) {
      await alertaAdmin(
        `Várias tentativas com segredo inválido no webhook, vindas de ${ip}.`,
        { severidade: "critico", chave: `segredo-invalido:${ip}` }
      );
    }
    return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
  }

  const event = String(payload.event ?? "");
  const dataRaw = payload.data;

  if (
    !GRANT_EVENTS.has(event) &&
    !REVOKE_EVENTS.has(event) &&
    !CANCEL_EVENTS.has(event) &&
    !WHATSAPP_EVENTS.has(event)
  ) {
    return NextResponse.json({ ok: true, ignored: event });
  }
  if (!dataRaw) {
    return NextResponse.json({ error: "Dados da transação ausentes" }, { status: 400 });
  }

  // Normaliza o data para ser sempre um Array de objetos
  const isArray = Array.isArray(dataRaw);
  const dataList = isArray 
    ? (dataRaw as Record<string, unknown>[]) 
    : [dataRaw as Record<string, unknown>];

  if (dataList.length === 0) {
    return NextResponse.json({ error: "Lista de transações vazia" }, { status: 400 });
  }

  // Extrai informações do comprador (customer) a partir do primeiro item
  const firstItem = dataList[0];
  const customer = (firstItem.customer ?? {}) as Record<string, string>;
  const email = customer.email?.trim().toLowerCase();
  const name = customer.name?.trim() || "Aluno";

  const admin = createAdminClient();

  /* ---------- Eventos só de WhatsApp ----------
   * Checkout iniciado, abandono, recusa e falha de renovação não liberam
   * nem revogam acesso: não passam por entitlement, venda ou e-mail. Saem
   * por aqui, com idempotência própria — o mesmo carrinho reenviado pela
   * Cakto não agenda a sequência duas vezes.
   *
   * Nada aqui pode derrubar o webhook: se a automação falhar, o pagamento
   * do cliente segue normal e o erro vira alerta. */
  if (
    WHATSAPP_EVENTS.has(event) &&
    !GRANT_EVENTS.has(event) &&
    !REVOKE_EVENTS.has(event) &&
    !CANCEL_EVENTS.has(event)
  ) {
    const checkoutId = String(
      firstItem.checkout_id ?? firstItem.checkoutId ?? firstItem.id ?? payload.id ?? ""
    );
    if (!checkoutId) return NextResponse.json({ ok: true, ignorado: "evento sem identificador de checkout" });

    const chaveEvento = `wa:${event}:${checkoutId}`;
    const { error: dup } = await admin.from("webhook_events").insert({
      provider: "cakto",
      event_id: chaveEvento,
      event_type: event,
      payload: { ...payload, secret: undefined },
      user_email: email ?? null,
      status: "processed",
    });
    if (dup?.code === "23505") {
      return NextResponse.json({ ok: true, duplicado: chaveEvento });
    }

    const ctx = {
      evento: event,
      item: firstItem,
      customer,
      caktoIds: idsDoPayload(dataList),
      checkoutId,
      userId: null,
    };

    try {
      if (EVENTOS_ABANDONO.has(event)) {
        const r = await tratarAbandono(admin, ctx);
        return NextResponse.json({ ok: true, evento: event, agendadas: r.agendadas, motivos: r.motivos });
      }
      if (EVENTOS_CARRINHO.has(event) || event === "subscription_created") {
        await tratarCheckoutIniciado(admin, ctx);
        return NextResponse.json({ ok: true, evento: event, carrinho: "registrado" });
      }
      if (event === "subscription_renewal_refused") {
        await tratarRenovacaoRecusada(admin, ctx);
        return NextResponse.json({ ok: true, evento: event, renovacao: "recusa registrada" });
      }
      if (EVENTOS_RECUSA.has(event)) {
        // Tentativa recusada não fecha o carrinho: a pessoa pode tentar de
        // novo com outro cartão, e a sequência de recuperação continua.
        await tratarCheckoutIniciado(admin, ctx);
        return NextResponse.json({ ok: true, evento: event, carrinho: "mantido aberto" });
      }
    } catch (err) {
      console.error("[cakto] falha na automação de WhatsApp", err);
      await alertaAdmin(
        `Evento "${event}" chegou mas a automação de WhatsApp falhou: ` +
          `${err instanceof Error ? err.message : String(err)}. O pagamento não foi afetado.`,
        { severidade: "aviso", chave: `wa-evento:${event}` }
      );
    }
    return NextResponse.json({ ok: true, evento: event });
  }

  /* Sem e-mail não dá para criar conta nem mandar o link de acesso. Nada é
   * liberado e nenhuma conta é criada — mas alguém pagou, então isto precisa
   * chegar em você agora, não virar reclamação depois. */
  if (!email) {
    await alertaAdmin(
      `Chegou um evento "${event}" da Cakto SEM o e-mail do comprador ` +
        `(cliente: ${customer.name || "sem nome"}, telefone: ${customer.phone ?? "não informado"}). ` +
        `Nada foi liberado. Pegue o e-mail na Cakto e cadastre à mão em /admin/alunos.`,
      // A Cakto vai reenviar este evento; a chave evita um alerta por tentativa.
      { severidade: "critico", chave: `sem-email:${customer.phone ?? customer.name ?? "?"}` }
    );
    return NextResponse.json({ error: "E-mail do cliente ausente" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.manualpraticodooutfit.com.br";

  /* ---------- Idempotência ----------
   * A Cakto reenvia eventos (timeout, retentativa, reprocessamento manual).
   * Gravamos ANTES de processar: o UNIQUE (provider, event_id) é a trava.
   * Se o evento já entrou, saímos sem creditar token, sem duplicar venda e
   * sem estender a validade de novo.
   * O payload fica guardado para você auditar disputa com cliente. */
  const eventId = String(
    payload.id ??
      payload.event_id ??
      firstItem.id ??
      firstItem.purchase_id ??
      ""
  );

  if (!eventId) {
    await alertaAdmin(
      `Webhook da Cakto chegou sem id de evento (${event}, ${email}). ` +
        `Sem id não dá para garantir que não vai duplicar.`,
      { severidade: "critico" }
    );
    return NextResponse.json({ error: "Evento sem identificador" }, { status: 400 });
  }

  // O payload da Cakto pode trazer o segredo no corpo. Guardar isso em texto
  // puro no banco transformaria o log de auditoria num vazamento de credencial.
  const payloadParaLog = { ...payload };
  if ("secret" in payloadParaLog) payloadParaLog.secret = "[redigido]";

  const { error: eventoErro } = await admin.from("webhook_events").insert({
    provider: "cakto",
    event_id: eventId,
    event_type: event,
    payload: payloadParaLog,
    user_email: email,
  });

  if (eventoErro) {
    // 23505 = violação de unicidade: já vimos este evento antes.
    if (eventoErro.code === "23505") {
      const { data: anterior } = await admin
        .from("webhook_events")
        .select("status")
        .eq("provider", "cakto")
        .eq("event_id", eventId)
        .maybeSingle<{ status: string }>();

      // Só ignora se a tentativa anterior tiver COMPLETADO. Se ela falhou no
      // meio, a Cakto está reenviando justamente para consertar — deixamos
      // passar, senão o cliente pagaria e nunca receberia o acesso.
      if (anterior?.status === "processed") {
        return NextResponse.json({ ok: true, duplicado: eventId });
      }
      await admin
        .from("webhook_events")
        .update({ status: "pending", error_message: null })
        .eq("provider", "cakto")
        .eq("event_id", eventId);
    } else {
      console.error("[cakto] falha ao registrar evento", eventoErro);
      await alertaAdmin(
        `Não consegui registrar o evento ${eventId} da Cakto: ${eventoErro.message}. ` +
          `A compra de ${email} NÃO foi processada — a Cakto vai reenviar.`,
        { severidade: "critico" }
      );
      // 500 faz a Cakto reenviar, que é o que queremos.
      return NextResponse.json({ error: "Erro ao registrar evento" }, { status: 500 });
    }
  }

  /** Marca o evento como falho para aparecer na tela de reprocessamento. */
  const marcarFalha = async (motivo: string) => {
    await admin
      .from("webhook_events")
      .update({ status: "failed", error_message: motivo.slice(0, 500) })
      .eq("provider", "cakto")
      .eq("event_id", eventId);
  };

  /* ---------- Cancelamento de assinatura ----------
   * NÃO mexe no entitlement. O acesso já foi pago até uma data e continua
   * valendo até lá — é o que a seção 6 da página /reembolso promete e é o
   * que o CDC espera de um serviço cobrado por período.
   *
   * O que o cancelamento faz: marca a assinatura como cancelada, cancela os
   * lembretes de renovação que ainda estavam agendados e para por aí. Quando
   * a data de validade chegar, `requirePaidAccess` corta o acesso sozinho.
   *
   * Devolver o dinheiro é outro evento (refund/chargeback) e aí sim o acesso
   * cai na hora. */
  if (CANCEL_EVENTS.has(event)) {
    const { data: profile } = await admin
      .from("users_profile")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle<{ user_id: string }>();

    const { data: acesso } = profile
      ? await admin
          .from("user_entitlements")
          .select("expires_at")
          .eq("user_id", profile.user_id)
          .eq("entitlement", BASE_ENTITLEMENT)
          .maybeSingle<{ expires_at: string | null }>()
      : { data: null };

    /* Assinatura sem data de fim é o único caso que precisa de decisão
     * humana: cancelar sem prazo deixaria o acesso vitalício de graça. */
    if (profile && acesso && acesso.expires_at === null) {
      await alertaAdmin(
        `${email} cancelou a assinatura, mas o acesso dessa conta está SEM ` +
          `data de vencimento — cancelar não tira nada e a pessoa ficaria com ` +
          `o MPO para sempre. Defina a data de fim em /admin/alunos.`,
        { severidade: "critico", chave: `cancel-sem-prazo:${email}` }
      );
    }

    try {
      await tratarAssinaturaCancelada(admin, {
        evento: event,
        item: firstItem,
        customer,
        caktoIds: idsDoPayload(dataList),
        checkoutId: String(firstItem.checkout_id ?? firstItem.id ?? eventId),
        userId: profile?.user_id ?? null,
      });
    } catch (err) {
      console.error("[cakto] falha ao encerrar automações no cancelamento", err);
      await alertaAdmin(
        `Cancelamento de ${email} registrado, mas não consegui encerrar os ` +
          `lembretes de renovação: ${err instanceof Error ? err.message : String(err)}. ` +
          `Confira em /admin/whatsapp para a pessoa não receber cobrança.`,
        { severidade: "aviso", chave: `cancel-automacao:${eventId}` }
      );
    }

    await admin
      .from("webhook_events")
      .update({ status: "processed", error_message: null })
      .eq("provider", "cakto")
      .eq("event_id", eventId);

    return NextResponse.json({
      ok: true,
      cancelado: true,
      acessoAte: acesso?.expires_at ?? null,
      regra: "acesso mantido até o fim do período já pago",
    });
  }

  // Coleta todos os IDs de produto/oferta presentes no payload de todas as transações
  const candidateIds = new Set<string>(idsDoPayload(dataList));

  const { data: mappingRows } = await admin
    .from("cakto_product_map")
    .select("entitlement, label, validity_days, expected_amount_cents")
    .in("cakto_id", candidateIds.size ? [...candidateIds] : ["__none__"]);

  const mappings = mappingRows ?? [];

  /* ---------- Produto sem mapeamento ----------
   * Antes, o fallback concedia o acesso completo a QUALQUER compra
   * desconhecida — um bump de R$ 9 entregava o produto inteiro.
   *
   * A regra segura depende da direção do evento:
   *  · COMPRA  → não adivinha, não libera nada, avisa você.
   *  · REEMBOLSO → revoga TUDO. Na dúvida, quem devolveu o dinheiro não
   *    pode continuar com o produto; errar para o outro lado custa caro. */
  const semMapeamento = mappings.length === 0;

  if (semMapeamento && GRANT_EVENTS.has(event)) {
    const idsRecebidos = [...candidateIds].join(", ") || "nenhum id no payload";
    await marcarFalha(`Produto sem mapeamento. IDs: ${idsRecebidos}`);
    await alertaAdmin(
      `Compra de ${email} chegou com produto SEM MAPEAMENTO.\n` +
        `IDs recebidos: ${idsRecebidos}\n` +
        `NADA foi liberado. Cadastre o ID em /admin/receita/produtos e ` +
        `libere o acesso em /admin/alunos.`,
      { severidade: "critico" }
    );
    // 200 para a Cakto não reenviar: o evento já está registrado e aparece
    // na tela /admin/sistema/webhooks para você reprocessar.
    return NextResponse.json({ ok: true, pendente: "sem_mapeamento", eventId });
  }

  if (semMapeamento) {
    await alertaAdmin(
      `Reembolso de ${email} veio de um produto SEM MAPEAMENTO ` +
        `(IDs: ${[...candidateIds].join(", ") || "nenhum"}). ` +
        `Por segurança revoguei TODO o acesso dessa conta. ` +
        `Se foi engano, libere de volta em /admin/alunos.`,
      { severidade: "critico" }
    );
  }

  const allEntitlements = semMapeamento
    ? [BASE_ENTITLEMENT]
    : [...new Set(mappings.map((m) => m.entitlement))];

  // Separa pacotes de tokens (consumíveis) dos entitlements permanentes.
  const tokenCredits = allEntitlements.reduce((sum, e) => sum + (parseTokenGrant(e) ?? 0), 0);
  let entitlements = allEntitlements.filter((e) => parseTokenGrant(e) === null);

  // Se comprou ou reembolsou o compre tudo com 58% off, expande a ação para MPO Base + todos os bônus
  if (entitlements.includes("economize-58")) {
    const bonusKeys = BONUSES.map((b) => b.key);
    entitlements = Array.from(new Set([...entitlements, "base", ...bonusKeys]));
  }

  /* ---------- Revogação (reembolso/chargeback) ---------- */
  if (REVOKE_EVENTS.has(event)) {
    const { data: profile } = await admin
      .from("users_profile")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();

    if (profile) {
      /* Reembolso do produto principal (ou do pacote 58%) derruba TUDO.
       * Antes, só o entitlement mapeado era apagado — então quem comprava
       * um bump barato ganhava o `base` junto e ficava com ele depois de
       * pedir reembolso. */
      const derrubaTudo =
        entitlements.includes(BASE_ENTITLEMENT) || entitlements.includes("economize-58");

      const aRevogar = derrubaTudo
        ? [BASE_ENTITLEMENT, "economize-58", ...BONUSES.map((b) => b.key)]
        : entitlements;

      const { error: revogaErro } = await admin
        .from("user_entitlements")
        .delete()
        .eq("user_id", profile.user_id)
        .in("entitlement", aRevogar);

      if (revogaErro) {
        await marcarFalha(`Falha ao revogar acesso: ${revogaErro.message}`);
        await alertaAdmin(
          `Reembolso de ${email} processado, mas NÃO consegui revogar o acesso: ` +
            `${revogaErro.message}. Revogue à mão em /admin/alunos.`,
          { severidade: "critico" }
        );
      }

      // Estorna também os tokens de IA do pacote reembolsado. A função no
      // banco usa greatest(...,0), então o saldo nunca fica negativo.
      if (tokenCredits > 0) {
        await admin.rpc("add_fit_check_credits", {
          p_user: profile.user_id,
          p_amount: -tokenCredits,
        });
      }
    } else {
      await alertaAdmin(
        `Reembolso de ${email} chegou, mas não achei essa conta na plataforma. ` +
          `Confira se o e-mail da Cakto bate com o do cadastro.`,
        { severidade: "aviso" }
      );
    }

    // Registra o reembolso para cada transação na tabela sales
    for (const item of dataList) {
      const caktoSaleId = String(item.id ?? item.purchase_id ?? payload.id ?? "");
      if (caktoSaleId) {
        await admin
          .from("sales")
          .update({ status: "refunded", refunded_at: new Date().toISOString() })
          .eq("cakto_id", caktoSaleId);
      }
    }

    /* Reembolso e cancelamento param TODA cobrança por WhatsApp: quem
     * pediu o dinheiro de volta não pode receber lembrete de renovação. */
    try {
      await tratarAssinaturaCancelada(admin, {
        evento: event,
        item: firstItem,
        customer,
        caktoIds: [...candidateIds],
        checkoutId: String(firstItem.checkout_id ?? firstItem.id ?? eventId),
        userId: null,
      });
    } catch (err) {
      console.error("[cakto] falha ao encerrar automações no reembolso", err);
    }

    await admin
      .from("webhook_events")
      .update({ status: "processed" })
      .eq("provider", "cakto")
      .eq("event_id", eventId);

    return NextResponse.json({ ok: true, revoked: entitlements, user: Boolean(profile) });
  }

  /* ---------- Compra aprovada ---------- */

  /* Trava do evento atrasado.
   *
   * Uma aprovação que chega DEPOIS da devolução do dinheiro não pode
   * devolver o acesso sozinha — acontece quando a Cakto reenvia um evento
   * que deu timeout, quando alguém reprocessa um evento antigo no
   * /admin/sistema/webhooks, ou quando os dois eventos se cruzam na fila.
   *
   * Nada é liberado e nada é criado. O evento fica marcado como falho, com
   * o motivo, para você decidir na mão se foi engano.
   *
   * Responde 200 de propósito: o evento já está guardado e reenviar não vai
   * mudar o resultado — a Cakto insistir aqui só geraria ruído. */
  const bloqueio = await revogacaoPosterior(
    admin,
    email,
    [...candidateIds, ...dataList.map((i) => String(i.id ?? i.purchase_id ?? ""))],
    dataDoEvento(payload, firstItem)
  );

  if (bloqueio) {
    await marcarFalha(`Aprovação posterior a uma revogação: ${bloqueio}`);
    await alertaAdmin(
      `Chegou uma compra aprovada de ${email} que NÃO foi liberada: ${bloqueio}.\n` +
        `Isso costuma ser reenvio atrasado do gateway. NADA foi creditado e ` +
        `nenhum acesso foi devolvido.\n` +
        `Se a pessoa realmente comprou de novo, libere em /admin/alunos.`,
      { severidade: "critico", chave: `atrasado:${eventId}` }
    );
    return NextResponse.json({ ok: true, bloqueado: "revogacao_posterior", motivo: bloqueio, eventId });
  }

  // Localiza (ou cria) o usuário
  const { data: existingProfile } = await admin
    .from("users_profile")
    .select("user_id, name")
    .ilike("email", email)
    .maybeSingle();

  let userId = existingProfile?.user_id as string | undefined;
  let createdNow = false;

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      // Senha aleatória que ninguém conhece: a conta não nasce sem senha e
      // o comprador define a dele pelo link de acesso do e-mail.
      password: senhaInterna(),
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !created.user) {
      await marcarFalha(`Falha ao criar usuário: ${createError?.message}`);
      await alertaAdmin(
        `${email} pagou mas NÃO consegui criar a conta: ${createError?.message}. ` +
          `Crie à mão em /admin/alunos.`,
        { severidade: "critico" }
      );
      return NextResponse.json(
        { error: `Falha ao criar usuário: ${createError?.message}` },
        { status: 500 }
      );
    }
    userId = created.user.id;
    createdNow = true;
  }

  // Busca os entitlements atuais do usuário para calcular a nova data de validade de forma justa
  const { data: currentEntitlements } = await admin
    .from("user_entitlements")
    .select("entitlement, expires_at")
    .eq("user_id", userId);

  /* Libera exatamente o que foi comprado.
   *
   * Antes o código forçava BASE_ENTITLEMENT em TODA compra. Como cada bônus
   * também é vendido avulso, quem comprasse só o "Grupo no WhatsApp" por
   * R$ 17 levava o MPO inteiro junto — e vitalício, porque a compra do bônus
   * não traz validade. Ou seja, saía mais barato que a assinatura mensal.
   *
   * O pacote "economize-58" continua liberando tudo: a expansão dele já
   * incluiu 'base' na lista acima. */
  const grants = Array.from(new Set(entitlements)).map((key) => ({
    user_id: userId,
    entitlement: key,
    source: `cakto:${[...candidateIds][0] ?? event}`,
    // Renovação soma na data que já existe, quando ela ainda está no futuro.
    expires_at: novaValidade(
      mappings.find((m) => m.entitlement === key)?.validity_days,
      currentEntitlements?.find((c) => c.entitlement === key)?.expires_at
    ),
  }));

  /* Compra só de bônus ou de tokens, de alguém que ainda não tem o MPO.
   * Não liberamos o acesso principal de graça, mas a pessoa também não
   * consegue ver o que comprou — isso precisa de decisão humana. */
  if (!entitlements.includes(BASE_ENTITLEMENT)) {
    const temBase = currentEntitlements?.some(
      (c) =>
        c.entitlement === BASE_ENTITLEMENT &&
        (!c.expires_at || new Date(c.expires_at) > new Date())
    );
    if (!temBase) {
      const oQue = entitlements.length ? entitlements.join(", ") : `${tokenCredits} tokens`;
      await alertaAdmin(
        `${email} comprou "${oQue}" mas NÃO tem o MPO ativo.\n` +
          `O item foi creditado, mas a pessoa não consegue entrar na plataforma ` +
          `para usar. Fale com ela: ou ela assina o MPO, ou você reembolsa.`,
        { severidade: "critico" }
      );
    }
  }

  const { error: grantError } = grants.length
    ? await admin.from("user_entitlements").upsert(grants, { onConflict: "user_id,entitlement" })
    : { error: null }; // compra só de tokens não gera entitlement

  if (grantError) {
    await marcarFalha(`Falha ao liberar acesso: ${grantError.message}`);
    await alertaAdmin(
      `${email} pagou mas o acesso NÃO foi liberado: ${grantError.message}. ` +
        `A conta já existe. Libere em /admin/alunos ou reprocesse o evento ${eventId}.`,
      { severidade: "critico" }
    );
    // 500 para a Cakto reenviar. O evento ficou marcado como 'failed', então
    // a retentativa passa pela idempotência e completa a liberação.
    return NextResponse.json(
      { error: `Falha ao liberar acesso: ${grantError.message}` },
      { status: 500 }
    );
  }

  // Credita os tokens de imagem do Fit Check, quando foi um pacote de tokens.
  if (tokenCredits > 0) {
    await admin.rpc("add_fit_check_credits", { p_user: userId, p_amount: tokenCredits });
  }

  // Registra cada venda do lote individualmente na tabela sales
  const gateway = await getSetting<GatewaySettings>("gateway", GATEWAY_DEFAULTS).catch(() => GATEWAY_DEFAULTS);
  const primaryMapping = mappings[0];
  for (const item of dataList) {
    try {
      const amountRaw = item.amount ?? item.price ?? item.value ?? 0;
      let amountCents = 0;
      if (typeof amountRaw === "number") {
        amountCents = Math.round(amountRaw * 100);
      } else if (typeof amountRaw === "string") {
        amountCents = Math.round(parseFloat(amountRaw) * 100);
      }

      /* Confere o valor contra o preço mínimo cadastrado no admin. Antes o
       * sistema gravava o que viesse no payload, sem questionar.
       *
       * Só alerta quando vem ABAIXO do esperado, que é o caso que custa
       * dinheiro. Vir acima é normal e legítimo: parcelamento com juros
       * (o anual à vista é R$ 164,59 e em 12x passa de R$ 200).
       *
       * É aviso, não bloqueio — cupom de lançamento baixa o valor de
       * propósito, e quem julga isso é você, com o alerta na mão. */
      const esperado = primaryMapping?.expected_amount_cents;
      if (esperado && amountCents > 0 && amountCents < esperado - 100) {
        await alertaAdmin(
          `Valor ABAIXO do esperado na compra de ${email}: recebi ` +
            `R$ ${(amountCents / 100).toFixed(2)} mas o produto ` +
            `"${primaryMapping?.label ?? primaryMapping?.entitlement}" custa ` +
            `R$ ${(esperado / 100).toFixed(2)}. ` +
            `Se não foi cupom seu, confira antes de contabilizar.`,
          { severidade: "aviso", chave: `valor:${eventId}` }
        );
      }

      const paymentMethod = String(
        item.paymentMethod ?? item.payment_method ?? item.payment_type ?? "cakto"
      ).toLowerCase();
      const caktoSaleId = String(item.id ?? item.purchase_id ?? payload.id ?? "");

      // Taxa: a informada pela Cakto sempre vence. Sem ela, estimamos pela
      // tabela real do plano, que muda conforme o método de pagamento.
      const feeRaw = item.fee ?? item.fees ?? item.gateway_fee ?? null;
      const feeCents =
        typeof feeRaw === "number"
          ? Math.round(feeRaw * 100)
          : estimarTaxaCakto(amountCents, paymentMethod, gateway);

      /* O client do Supabase NÃO lança exceção em erro de banco: devolve
       * { error }. O catch abaixo, sozinho, nunca via falha de constraint. */
      const { error: vendaErro } = await admin.from("sales").insert({
        user_id: userId,
        email,
        name: name || existingProfile?.name || "Aluno",
        amount_cents: amountCents,
        gateway_fee_cents: Math.max(0, Math.min(feeCents, amountCents)),
        status: "approved",
        payment_method: paymentMethod,
        cakto_id: caktoSaleId || null,
        entitlement: primaryMapping?.entitlement ?? null,
        offer_name: primaryMapping?.label ?? primaryMapping?.entitlement ?? null,
        created_at: new Date().toISOString()
      });

      if (vendaErro && vendaErro.code !== "23505") {
        console.error("[cakto] venda não registrada", {
          eventId,
          cakto_id: caktoSaleId,
          erro: vendaErro.message,
        });
        await alertaAdmin(
          `Acesso liberado para ${email}, mas a VENDA de ` +
            `R$ ${(amountCents / 100).toFixed(2)} não entrou no faturamento: ` +
            `${vendaErro.message}. Lance à mão em /admin/receita/transacoes.`,
          { severidade: "critico" }
        );
      }
    } catch (err) {
      // Nunca quebra a liberação do aluno por causa do registro contábil,
      // mas o erro precisa aparecer em algum lugar.
      console.error("[cakto] exceção ao registrar venda", err);
      await alertaAdmin(
        `Exceção ao registrar a venda de ${email}: ` +
          `${err instanceof Error ? err.message : String(err)}. ` +
          `O acesso foi liberado; confira o faturamento.`,
        { severidade: "critico" }
      );
    }
  }

  /* ---------- Automações de WhatsApp ----------
   * Compra aprovada fecha o carrinho da pessoa, derruba a recuperação e
   * mantém a assinatura em dia. É o freio que impede uma cobrança sair
   * para quem acabou de pagar.
   *
   * Roda depois da liberação de acesso e nunca a derruba: qualquer erro
   * aqui vira alerta, não 500. */
  try {
    const mapaBase = mappings.find((m) => m.validity_days === 30 || m.validity_days === 365);
    const grantBase = grants.find((g) => g.entitlement === BASE_ENTITLEMENT);
    await tratarCompraAprovada(admin, {
      evento: event,
      item: firstItem,
      customer,
      caktoIds: [...candidateIds],
      checkoutId: String(firstItem.checkout_id ?? firstItem.id ?? eventId),
      userId: userId ?? null,
      validityDays: mapaBase?.validity_days ?? null,
      expiresAt: grantBase?.expires_at ? new Date(grantBase.expires_at) : null,
    });
  } catch (err) {
    console.error("[cakto] automação de WhatsApp falhou na compra aprovada", err);
    await alertaAdmin(
      `Acesso de ${email} liberado normalmente, mas a automação de WhatsApp falhou: ` +
        `${err instanceof Error ? err.message : String(err)}. Confira em /admin/whatsapp.`,
      { severidade: "aviso", chave: `wa-aprovada:${eventId}` }
    );
  }

  // E-mail (pacotes de tokens não contam como bônus permanente)
  const bonusLabels = mappings
    .filter((m) => m.entitlement !== BASE_ENTITLEMENT && parseTokenGrant(m.entitlement) === null)
    .map((m) => m.label ?? m.entitlement);

  /* O envio só acontece aqui, no fim: pagamento aprovado, conta criada e
   * acesso liberado. O link de criar senha nasce junto com o e-mail — vale
   * 30 dias e não depende mais do OTP do Supabase, que morria em 24h. Tudo
   * passa pelo registro em `email_sends`, que impede uma segunda entrega do
   * mesmo evento de mandar uma segunda cópia — e permite nova tentativa se
   * este envio falhar. */
  let emailResult: { enviado: boolean; motivo?: string; duplicado?: boolean };
  if (createdNow) {
    emailResult = await enviarEmailDeAcesso(admin, {
      userId: userId!,
      email,
      nome: name,
      chave: chaveAcesso(userId!),
    });
  } else if (bonusLabels.length > 0) {
    const msg = emailBonusLiberado({
      nome: existingProfile?.name ?? name,
      bonus: bonusLabels.join(", "),
      siteUrl,
    });
    emailResult = await enviarEmailRegistrado(
      admin,
      { chave: chaveBonus(eventId), tipo: "bonus", userId },
      { para: email, assunto: msg.assunto, html: msg.html, texto: msg.texto }
    );
  } else {
    emailResult = { enviado: false, motivo: "usuário já existia; sem bônus novo" };
  }

  /* O acesso foi liberado. Se o e-mail não saiu, o cliente pagou e não sabe
   * como entrar — isso precisa chegar em você antes de virar reclamação. */
  if (createdNow && !emailResult.enviado) {
    await alertaAdmin(
      `${email} (${name}) comprou e o acesso foi liberado, mas o E-MAIL NÃO SAIU: ` +
        `${emailResult.motivo ?? "motivo desconhecido"}. ` +
        `Mande o link de acesso à mão — a pessoa não consegue entrar sem ele. ` +
        `Você pode reenviar em /admin/alunos.`,
      { severidade: "critico" }
    );
  }

  // Só agora o evento vira 'processed'. Se tivesse sido marcado antes, uma
  // falha no meio bloquearia a retentativa da Cakto pela idempotência.
  await admin
    .from("webhook_events")
    .update({ status: "processed", error_message: null })
    .eq("provider", "cakto")
    .eq("event_id", eventId);

  return NextResponse.json({
    ok: true,
    user: userId,
    created: createdNow,
    granted: grants.map((g) => g.entitlement),
    email: emailResult,
  });
}
