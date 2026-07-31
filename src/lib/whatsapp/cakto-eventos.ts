import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { alertaAdmin } from "@/lib/alerts";
import {
  agendarFalhaRenovacao,
  agendarLembretesRenovacao,
  agendarRecuperacaoCarrinho,
  agendarSuspensao,
  encerrarCarrinho,
  planoDoProduto,
  registrarCarrinho,
  registrarContato,
  renovacaoAprovada,
  salvarAssinatura,
} from "./automacoes";
import type { Plano } from "./templates";

/**
 * Tradução dos eventos da Cakto para as automações de WhatsApp.
 *
 * Eventos que a Cakto emite (confirmados na documentação da API em
 * 2026-07-31, endpoint de webhooks):
 *
 *   initiate_checkout · checkout_abandonment · purchase_approved ·
 *   purchase_refused  · pix_gerado · boleto_gerado · picpay_gerado ·
 *   openfinance_nubank_gerado · chargeback · refund ·
 *   subscription_created · subscription_canceled · subscription_renewed ·
 *   subscription_renewal_refused
 *
 * O formato do payload NÃO é público. Por isso a leitura dos campos é
 * defensiva: aceita os vários nomes que a Cakto usa (phone/telephone/
 * celular, amount/price/value) e, quando não encontra o essencial, alerta
 * você em vez de adivinhar.
 */

type Db = ReturnType<typeof createAdminClient>;
type Registro = Record<string, unknown>;

export const EVENTOS_CARRINHO = new Set(["initiate_checkout", "pix_gerado", "boleto_gerado", "picpay_gerado", "openfinance_nubank_gerado"]);
export const EVENTOS_ABANDONO = new Set(["checkout_abandonment"]);
export const EVENTOS_RECUSA = new Set(["purchase_refused"]);
export const EVENTOS_ASSINATURA = new Set(["subscription_created", "subscription_renewed", "subscription_renewal_refused", "subscription_canceled"]);

/** Primeiro valor não vazio entre vários nomes possíveis de campo. */
function campo(obj: Registro, ...nomes: string[]): string | undefined {
  for (const n of nomes) {
    const v = obj[n];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function centavos(obj: Registro, ...nomes: string[]): number {
  for (const n of nomes) {
    const v = obj[n];
    if (typeof v === "number") return Math.round(v * 100);
    if (typeof v === "string" && v.trim()) {
      const f = parseFloat(v.replace(",", "."));
      if (Number.isFinite(f)) return Math.round(f * 100);
    }
  }
  return 0;
}

function data(obj: Registro, ...nomes: string[]): Date | null {
  for (const n of nomes) {
    const v = obj[n];
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

export type ContextoEvento = {
  evento: string;
  item: Registro;
  customer: Registro;
  caktoIds: string[];
  checkoutId: string;
  userId?: string | null;
};

/**
 * Trata os eventos que criam ou atualizam um carrinho.
 * Ainda não agenda nada: só registra que existe um checkout em aberto.
 */
export async function tratarCheckoutIniciado(db: Db, ctx: ContextoEvento): Promise<void> {
  const email = campo(ctx.customer, "email");
  const { contato, motivo } = await registrarContato(db, {
    telefoneBruto: campo(ctx.customer, "phone", "telephone", "mobile", "celular", "whatsapp"),
    nome: campo(ctx.customer, "name", "nome"),
    email,
    userId: ctx.userId,
    origem: `cakto:${ctx.evento}`,
  });

  if (!contato) {
    console.info(`[whatsapp] checkout ${ctx.checkoutId} sem contato utilizável: ${motivo}`);
    return;
  }

  const produto = await planoDoProduto(db, ctx.caktoIds);
  const valor = centavos(ctx.item, "amount", "price", "value") || produto.amountCents;

  /* Prazo do meio de pagamento. Enquanto ele não vence, o checkout NÃO é
   * abandono — é pagamento em andamento. */
  const expira =
    data(ctx.item, "expires_at", "expiresAt", "expiration_date", "due_date", "dueDate") ??
    prazoPadrao(campo(ctx.item, "paymentMethod", "payment_method", "payment_type"));

  await registrarCarrinho(db, {
    checkoutId: ctx.checkoutId,
    contato,
    plano: produto.plano,
    entitlement: produto.entitlement,
    amountCents: valor,
    parcelas: Number(campo(ctx.item, "installments", "parcelas")) || null,
    paymentMethod: campo(ctx.item, "paymentMethod", "payment_method", "payment_type"),
    expiraEm: expira,
  });
}

/** PIX costuma valer 30 min; boleto, 3 dias. Sem método conhecido, sem prazo. */
function prazoPadrao(metodo: string | undefined): Date | null {
  const m = (metodo ?? "").toLowerCase();
  if (m.includes("pix")) return new Date(Date.now() + 30 * 60_000);
  if (m.includes("boleto")) return new Date(Date.now() + 3 * 24 * 60 * 60_000);
  return null;
}

/**
 * Abandono confirmado pela Cakto: agenda a sequência de recuperação.
 *
 * Se o carrinho ainda não existia (o `initiate_checkout` não chegou),
 * ele é criado aqui — a Cakto nem sempre manda os dois eventos.
 */
export async function tratarAbandono(db: Db, ctx: ContextoEvento): Promise<{ agendadas: number; motivos: string[] }> {
  const email = campo(ctx.customer, "email");
  const { contato, motivo } = await registrarContato(db, {
    telefoneBruto: campo(ctx.customer, "phone", "telephone", "mobile", "celular", "whatsapp"),
    nome: campo(ctx.customer, "name", "nome"),
    email,
    userId: ctx.userId,
    origem: `cakto:${ctx.evento}`,
  });

  if (!contato) return { agendadas: 0, motivos: [`sem contato: ${motivo}`] };

  /* Quem já tem assinatura ativa não recebe recuperação de carrinho:
   * seria cobrar de novo quem já é cliente. */
  if (email) {
    const { data: assinatura } = await db
      .from("subscriptions")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("status", "ativa")
      .maybeSingle();
    if (assinatura) return { agendadas: 0, motivos: ["cliente já tem assinatura ativa"] };
  }

  const produto = await planoDoProduto(db, ctx.caktoIds);
  const valor = centavos(ctx.item, "amount", "price", "value") || produto.amountCents;
  const parcelas = Number(campo(ctx.item, "installments", "parcelas")) || null;

  const cartId = await registrarCarrinho(db, {
    checkoutId: ctx.checkoutId,
    contato,
    plano: produto.plano,
    entitlement: produto.entitlement,
    amountCents: valor,
    parcelas,
    paymentMethod: campo(ctx.item, "paymentMethod", "payment_method", "payment_type"),
    expiraEm: data(ctx.item, "expires_at", "expiresAt", "due_date"),
  });
  if (!cartId) return { agendadas: 0, motivos: ["falha ao registrar carrinho"] };

  await db
    .from("whatsapp_carts")
    .update({ abandoned_at: new Date().toISOString() })
    .eq("id", cartId)
    .is("abandoned_at", null);

  /* Produto avulso (bônus, pacote de token) não é assinatura: a sequência
   * fala em "assinatura iniciada", então não se aplica. */
  if (produto.plano === "outro") {
    return { agendadas: 0, motivos: ["checkout não é de assinatura (mensal/anual)"] };
  }

  return agendarRecuperacaoCarrinho(db, {
    cartId,
    contato,
    plano: produto.plano,
    amountCents: valor,
    parcelas,
  });
}

/**
 * Compra aprovada: fecha o carrinho, derruba a recuperação e mantém a
 * assinatura em dia. É o freio principal contra mandar cobrança para
 * quem já pagou.
 */
export async function tratarCompraAprovada(
  db: Db,
  ctx: ContextoEvento & { validityDays: number | null; expiresAt: Date | null }
): Promise<void> {
  const email = campo(ctx.customer, "email");
  const { contato } = await registrarContato(db, {
    telefoneBruto: campo(ctx.customer, "phone", "telephone", "mobile", "celular", "whatsapp"),
    nome: campo(ctx.customer, "name", "nome"),
    email,
    userId: ctx.userId,
    origem: `cakto:${ctx.evento}`,
  });

  // Fecha qualquer carrinho aberto desta pessoa, não só o deste checkout:
  // é comum a pessoa abandonar um link e pagar por outro.
  await encerrarCarrinho(db, { checkoutId: ctx.checkoutId }, "pago", "compra aprovada");
  if (contato) await encerrarCarrinho(db, { contactId: contato.id }, "pago", "compra aprovada");

  const plano: Plano = ctx.validityDays === 30 ? "mensal" : ctx.validityDays === 365 ? "anual" : "outro";
  if (plano === "outro" || !email) return;

  const valor = centavos(ctx.item, "amount", "price", "value");
  const subscriptionId = await salvarAssinatura(
    db,
    {
      caktoSubscriptionId: campo(ctx.item, "subscription_id", "subscriptionId") ?? null,
      contato,
      userId: ctx.userId ?? null,
      email,
      plano,
      amountCents: valor,
      proximaCobranca: ctx.expiresAt,
    },
    "ativa"
  );
  if (!subscriptionId) return;

  await db
    .from("subscriptions")
    .update({ last_payment_at: new Date().toISOString(), payment_failed_at: null, suspended_at: null })
    .eq("id", subscriptionId);

  const ehRenovacao = ctx.evento === "subscription_renewed";
  if (ehRenovacao) {
    await renovacaoAprovada(db, {
      subscriptionId,
      contato,
      plano,
      amountCents: valor,
      proximaCobranca: ctx.expiresAt,
    });
  }

  if (contato && ctx.expiresAt) {
    await agendarLembretesRenovacao(db, {
      subscriptionId,
      contato,
      plano,
      amountCents: valor,
      proximaCobranca: ctx.expiresAt,
    });
  }
}

/** Renovação recusada pela Cakto. */
export async function tratarRenovacaoRecusada(db: Db, ctx: ContextoEvento): Promise<void> {
  const email = campo(ctx.customer, "email");
  if (!email) {
    await alertaAdmin("Renovação recusada chegou sem e-mail do cliente. Confira na Cakto.", {
      severidade: "critico",
      chave: "renovacao-sem-email",
    });
    return;
  }

  const { contato } = await registrarContato(db, {
    telefoneBruto: campo(ctx.customer, "phone", "telephone", "mobile", "celular", "whatsapp"),
    nome: campo(ctx.customer, "name", "nome"),
    email,
    userId: ctx.userId,
    origem: `cakto:${ctx.evento}`,
  });

  const { data: assinatura } = await db
    .from("subscriptions")
    .select("id, plan, amount_cents")
    .eq("email", email.toLowerCase())
    .in("status", ["ativa", "pendente"])
    .order("next_charge_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: number; plan: "mensal" | "anual"; amount_cents: number }>();

  if (!assinatura) {
    await alertaAdmin(
      `Renovação recusada de ${email}, mas não achei a assinatura no banco. ` +
        `Confira em /admin/whatsapp e na Cakto.`,
      { severidade: "aviso", chave: `renov-sem-assinatura:${email}` }
    );
    return;
  }

  const agora = new Date().toISOString();
  await db
    .from("subscriptions")
    .update({ status: "pendente", payment_failed_at: agora, updated_at: agora })
    .eq("id", assinatura.id);

  // Lembrete de "vai renovar" perdeu o sentido: a cobrança já falhou.
  await db
    .from("whatsapp_messages")
    .update({ status: "cancelled", skip_reason: "cobrança recusada", updated_at: agora })
    .eq("subscription_id", assinatura.id)
    .in("status", ["scheduled", "failed"])
    .in("message_type", ["monthly_renewal_reminder", "annual_renewal_15_days", "annual_renewal_3_days"]);

  if (contato) {
    await agendarFalhaRenovacao(db, {
      subscriptionId: assinatura.id,
      contato,
      plano: assinatura.plan,
      amountCents: assinatura.amount_cents,
    });
  }
}

/** Assinatura cancelada: para tudo. Nenhuma cobrança para quem cancelou. */
export async function tratarAssinaturaCancelada(db: Db, ctx: ContextoEvento): Promise<void> {
  const email = campo(ctx.customer, "email");
  if (!email) return;

  const agora = new Date().toISOString();
  const { data: assinaturas } = await db
    .from("subscriptions")
    .select("id")
    .eq("email", email.toLowerCase())
    .neq("status", "cancelada")
    .select("id");

  for (const a of (assinaturas ?? []) as { id: number }[]) {
    await db
      .from("subscriptions")
      .update({ status: "cancelada", canceled_at: agora, updated_at: agora })
      .eq("id", a.id);
    const { cancelarPendentes } = await import("./fila");
    await cancelarPendentes(db, { subscriptionId: a.id }, "assinatura cancelada");
  }
}

/**
 * Marca a assinatura como suspensa e avisa — só depois que o acesso
 * realmente caiu. Chamado pelo cron, não pelo webhook.
 */
export async function suspenderAssinaturasVencidas(db: Db): Promise<number> {
  const agora = new Date();
  const { data: vencidas } = await db
    .from("subscriptions")
    .select("id, contact_id, plan, amount_cents, next_charge_at")
    .eq("status", "pendente")
    .lt("next_charge_at", agora.toISOString())
    .limit(50);

  let n = 0;
  for (const s of (vencidas ?? []) as {
    id: number;
    contact_id: number | null;
    plan: "mensal" | "anual";
    amount_cents: number;
  }[]) {
    /* A suspensão só é anunciada se o acesso caiu DE VERDADE: sem
     * entitlement 'base' válido. Sem esta conferência, a mensagem poderia
     * dizer "acesso suspenso" para quem ainda está usando a plataforma. */
    const { data: assinatura } = await db
      .from("subscriptions")
      .select("user_id")
      .eq("id", s.id)
      .maybeSingle<{ user_id: string | null }>();

    if (assinatura?.user_id) {
      const { data: acesso } = await db
        .from("user_entitlements")
        .select("expires_at")
        .eq("user_id", assinatura.user_id)
        .eq("entitlement", "base")
        .maybeSingle<{ expires_at: string | null }>();

      const aindaTemAcesso = acesso && (!acesso.expires_at || new Date(acesso.expires_at) > agora);
      if (aindaTemAcesso) continue;
    }

    await db
      .from("subscriptions")
      .update({ status: "suspensa", suspended_at: agora.toISOString(), updated_at: agora.toISOString() })
      .eq("id", s.id);

    if (s.contact_id) {
      const { data: contato } = await db
        .from("whatsapp_contacts")
        .select("id, phone, name, opted_out_at, consent_granted_at")
        .eq("id", s.contact_id)
        .maybeSingle();
      if (contato) {
        await agendarSuspensao(db, {
          subscriptionId: s.id,
          contato,
          plano: s.plan,
          amountCents: s.amount_cents,
        });
      }
    }
    n++;
  }
  return n;
}
