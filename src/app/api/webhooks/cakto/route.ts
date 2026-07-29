import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { BASE_ENTITLEMENT, BONUSES } from "@/lib/bonuses";
import { getSetting, GATEWAY_DEFAULTS, type GatewaySettings } from "@/lib/admin/settings";
import { alertaAdmin } from "@/lib/alerts";
import { checarRateLimit, ipDaRequisicao } from "@/lib/rate-limit";

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

const GRANT_EVENTS = new Set(["purchase_approved", "subscription_renewed"]);
const REVOKE_EVENTS = new Set(["refund", "chargeback", "purchase_refunded", "subscription_canceled"]);

/**
 * Pacotes de tokens do Fit Check: mapeie o produto da Cakto (em /admin/vendas)
 * para um entitlement no formato "tokens-200" ou "tokens-50" e o webhook credita
 * essa quantidade de imagens em vez de liberar um bônus permanente.
 */
function parseTokenGrant(entitlement: string): number | null {
  const m = /^tokens[-:_]?(\d+)$/i.exec(entitlement.trim());
  return m ? parseInt(m[1], 10) : null;
}

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

/** Comparação em tempo constante — `!==` vaza informação por tempo. */
function segredoConfere(recebido: string | null | undefined, esperado: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  // Caminho principal: SMTP do Gmail (sem depender de domínio verificado)
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? `Manual Prático do Outfit <${gmailUser}>`,
        to,
        subject,
        html,
      });
      return { sent: true, via: "gmail" };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const fallback = await sendViaResend(to, subject, html);
      return fallback.sent ? { ...fallback, gmailError: reason } : { sent: false, reason };
    }
  }

  return sendViaResend(to, subject, html);
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "GMAIL_APP_PASSWORD e RESEND_API_KEY ausentes" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Manual Prático do Outfit <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  });

  if (!res.ok) {
    return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  }
  return { sent: true, via: "resend" };
}

async function sendWhatsApp(number: string, text: string) {
  const apiUrl = process.env.UAZAPI_URL;
  const token = process.env.UAZAPI_TOKEN;

  if (!apiUrl || !token) {
    console.warn("Disparo de WhatsApp ignorado: UAZAPI_URL ou UAZAPI_TOKEN ausentes.");
    return { sent: false, reason: "credenciais ausentes" };
  }

  // Limpa o número para conter apenas dígitos
  let cleaned = number.replace(/\D/g, "");
  if (!cleaned) return { sent: false, reason: "número inválido" };

  // Garante DDI do Brasil se começar sem
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }

  try {
    const res = await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: token,
      },
      body: JSON.stringify({
        number: cleaned,
        text: text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, reason: `UAZAPI error ${res.status}: ${errText.slice(0, 150)}` };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

function emailLayout(content: string, siteUrl: string): string {
  return `
  <div style="background:#06080c;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#0c111a;border:1px solid #1e2938;border-radius:16px;padding:32px">
      <div style="margin-bottom:24px">
        <img src="${siteUrl}/logo-mpo-192.png" alt="MPO" width="34" height="34" style="border-radius:8px;vertical-align:middle" />
        <span style="color:#f4f6f9;font-size:15px;font-weight:bold;margin-left:8px;vertical-align:middle">Manual Prático do Outfit</span>
      </div>
      ${content}
      <p style="color:#5c677a;font-size:12px;margin-top:28px;border-top:1px solid #1e2938;padding-top:16px">
        Você recebeu este e-mail porque realizou uma compra do Manual Prático do Outfit.
      </p>
    </div>
  </div>`;
}

function welcomeEmail(name: string, email: string, linkAcesso: string, siteUrl: string): string {
  const firstName = name.split(" ")[0] || "aluno";
  return emailLayout(
    `
    <h1 style="color:#f4f6f9;font-size:22px;margin:0 0 12px">Bem-vindo, ${firstName}! 🎉</h1>
    <p style="color:#8b96a8;font-size:14px;line-height:1.6;margin:0 0 20px">
      Sua compra foi aprovada e seu acesso já está liberado. Clique no botão
      abaixo para criar sua senha e entrar na plataforma.
    </p>
    <div style="background:#121924;border:1px solid #1e2938;border-radius:12px;padding:16px 20px;margin-bottom:20px">
      <p style="color:#8b96a8;font-size:12px;margin:0 0 4px">Seu e-mail de acesso</p>
      <p style="color:#f4f6f9;font-size:15px;font-weight:bold;margin:0">${email}</p>
    </div>
    <a href="${linkAcesso}" style="display:block;background:#2f6bff;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;border-radius:12px;padding:14px">
      Criar minha senha e entrar
    </a>
    <p style="color:#5c677a;font-size:12px;line-height:1.6;margin:14px 0 0">
      Este link é pessoal e vale por 24 horas. Se expirar, use "Esqueci minha senha"
      na tela de login com o e-mail acima.
    </p>
    <p style="color:#8b96a8;font-size:13px;line-height:1.6;margin:20px 0 0">
      No primeiro acesso, responda o quiz de estilo — ele personaliza toda a sua experiência.
    </p>
  `,
    siteUrl
  );
}

function bonusEmail(name: string, bonusLabel: string, siteUrl: string): string {
  const firstName = name.split(" ")[0] || "aluno";
  return emailLayout(
    `
    <h1 style="color:#f4f6f9;font-size:22px;margin:0 0 12px">Bônus liberado, ${firstName}! 🔓</h1>
    <p style="color:#8b96a8;font-size:14px;line-height:1.6;margin:0 0 20px">
      Sua compra foi aprovada e o bônus <strong style="color:#f4f6f9">${bonusLabel}</strong>
      já está desbloqueado na sua conta.
    </p>
    <a href="${siteUrl}/bonus" style="display:block;background:#2f6bff;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;border-radius:12px;padding:14px">
      Ver meus bônus
    </a>
  `,
    siteUrl
  );
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

  if (!GRANT_EVENTS.has(event) && !REVOKE_EVENTS.has(event)) {
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

  if (!email) {
    return NextResponse.json({ error: "E-mail do cliente ausente" }, { status: 400 });
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app";

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

  // Coleta todos os IDs de produto/oferta presentes no payload de todas as transações
  const candidateIds = new Set<string>();
  const collect = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      for (const key of ["id", "short_id", "product_id", "offer_id"]) {
        if (typeof rec[key] === "string" && rec[key]) candidateIds.add(rec[key] as string);
      }
    }
  };

  for (const item of dataList) {
    collect(item.product);
    collect(item.offer);
    for (const field of ["products", "offers", "items", "order_bumps", "orderBumps"]) {
      collect(item[field]);
    }
  }

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

    await admin
      .from("webhook_events")
      .update({ status: "processed" })
      .eq("provider", "cakto")
      .eq("event_id", eventId);

    return NextResponse.json({ ok: true, revoked: entitlements, user: Boolean(profile) });
  }

  /* ---------- Compra aprovada ---------- */

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

  /* Link de acesso de uso único. Substitui a senha em texto puro, que antes
   * ia por e-mail e por WhatsApp (passando por um terceiro) e ficava para
   * sempre no histórico das duas caixas. Se o processo falhar mais adiante,
   * basta reenviar o link — não existe mais senha perdida em memória. */
  let linkAcesso: string | null = null;
  if (createdNow) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/nova-senha` },
    });
    linkAcesso = link?.properties?.action_link ?? null;
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
  const grants = Array.from(new Set(entitlements)).map((key) => {
    const mapItem = mappings.find((m) => m.entitlement === key);
    const validityDays = mapItem?.validity_days;
    let expiresAt: string | null = null;

    if (validityDays) {
      const existing = currentEntitlements?.find((c) => c.entitlement === key);
      const existingExpiry = existing?.expires_at ? new Date(existing.expires_at) : null;
      // Se a assinatura ainda estiver ativa no futuro, somamos a validade nela. Se não, começa de hoje.
      const baseDate = (existingExpiry && existingExpiry > new Date()) ? existingExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + validityDays);
      expiresAt = baseDate.toISOString();
    }

    return {
      user_id: userId,
      entitlement: key,
      source: `cakto:${[...candidateIds][0] ?? event}`,
      expires_at: expiresAt,
    };
  });

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

      /* Confere o valor contra o preço cadastrado no admin. Antes o sistema
       * gravava o que viesse no payload, sem questionar. Só avisa: não
       * bloqueia a liberação, porque cupom e promoção mudam o valor
       * legitimamente — quem julga é você, com o alerta na mão. */
      const esperado = primaryMapping?.expected_amount_cents;
      if (esperado && amountCents > 0 && Math.abs(amountCents - esperado) > 100) {
        await alertaAdmin(
          `Valor divergente na compra de ${email}: recebi ` +
            `R$ ${(amountCents / 100).toFixed(2)} mas o cadastro do produto ` +
            `"${primaryMapping?.label ?? primaryMapping?.entitlement}" diz ` +
            `R$ ${(esperado / 100).toFixed(2)}. Confira antes de contabilizar.`,
          { severidade: "aviso", chave: `valor:${eventId}` }
        );
      }

      const paymentMethod = String(
        item.paymentMethod ?? item.payment_method ?? item.payment_type ?? "cakto"
      ).toLowerCase();
      const caktoSaleId = String(item.id ?? item.purchase_id ?? payload.id ?? "");

      // Taxa: usa a informada pela Cakto quando vier; senão estima pela config do admin
      const feeRaw = item.fee ?? item.fees ?? item.gateway_fee ?? null;
      const feeCents =
        typeof feeRaw === "number"
          ? Math.round(feeRaw * 100)
          : Math.round((amountCents * gateway.fee_percent) / 100) + gateway.fee_fixed_cents;

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

  // E-mail (pacotes de tokens não contam como bônus permanente)
  const bonusLabels = mappings
    .filter((m) => m.entitlement !== BASE_ENTITLEMENT && parseTokenGrant(m.entitlement) === null)
    .map((m) => m.label ?? m.entitlement);

  let emailResult: { sent: boolean; reason?: string };
  if (createdNow && linkAcesso) {
    emailResult = await sendEmail(
      email,
      "Seu acesso ao Manual Prático do Outfit chegou 🎉",
      welcomeEmail(name, email, linkAcesso, siteUrl)
    );
  } else if (bonusLabels.length > 0) {
    emailResult = await sendEmail(
      email,
      "Bônus liberado na sua conta 🔓",
      bonusEmail(existingProfile?.name ?? name, bonusLabels.join(", "), siteUrl)
    );
  } else {
    emailResult = { sent: false, reason: "usuário já existia; sem bônus novo" };
  }

  // Disparo do WhatsApp se houver telefone do cliente
  const phone = customer.phone ?? customer.telephone ?? customer.mobile ?? "";
  let whatsResult: { sent: boolean; reason?: string } | undefined = undefined;

  if (phone) {
    if (createdNow && linkAcesso) {
      // Sem senha na mensagem: só o link, que expira. O WhatsApp passa por um
      // terceiro (UAZAPI) e fica para sempre no histórico dos dois lados.
      const whatsMsg = `Olá, *${name}*! Seu acesso ao *Manual Prático do Outfit* chegou! 🎉\n\nSua compra foi aprovada. Clique no link abaixo para criar sua senha e entrar:\n${linkAcesso}\n\n📧 Seu e-mail de acesso: ${email}\n\nO link é pessoal e vale por 24 horas. Se expirar, use "Esqueci minha senha" em ${siteUrl}/login.\n\nNo primeiro acesso, responda o quiz de estilo — ele personaliza toda a sua experiência.`;
      whatsResult = await sendWhatsApp(phone, whatsMsg);
    } else if (bonusLabels.length > 0) {
      const whatsMsg = `Olá, *${existingProfile?.name ?? name}*! Bônus liberado na sua conta! 🔓\n\nSua compra foi aprovada e os bônus abaixo já estão desbloqueados na sua conta:\n*${bonusLabels.join(", ")}*\n\nVer meus bônus em:\n${siteUrl}/bonus`;
      whatsResult = await sendWhatsApp(phone, whatsMsg);
    }
  }

  /* O acesso foi liberado. Se o e-mail não saiu, o cliente pagou e não sabe
   * como entrar — isso precisa chegar em você antes de virar reclamação. */
  if (createdNow && !emailResult.sent) {
    await alertaAdmin(
      `${email} (${name}) comprou e o acesso foi liberado, mas o E-MAIL NÃO SAIU: ` +
        `${emailResult.reason ?? "motivo desconhecido"}. ` +
        `Mande o link de acesso à mão — a pessoa não consegue entrar sem ele.`,
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
    whatsapp: whatsResult,
  });
}
