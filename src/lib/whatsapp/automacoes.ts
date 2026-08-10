import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefone, mascararTelefone } from "./phone";
import { configWhatsApp } from "./config";
import { agendarMensagem, cancelarPendentes, type Contato } from "./fila";
import {
  textoCarrinho,
  textoInatividade,
  textoRenovacao,
  type Plano,
  type TipoMensagem,
} from "./templates";
import { buscarAlunosInativos } from "./inatividade";

/**
 * Regras de negócio das duas automações.
 *
 * Este módulo NÃO envia nada: ele traduz eventos da Cakto em contatos,
 * carrinhos, assinaturas e mensagens agendadas. Quem envia é a fila.
 */

type Db = ReturnType<typeof createAdminClient>;

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

/* ------------------------------------------------------------------
 * Contato e consentimento
 * ------------------------------------------------------------------ */

/**
 * Registra (ou atualiza) o contato a partir de um checkout da Cakto.
 *
 * O consentimento vem do checkout: quem preenche o telefone no checkout
 * do MPO e aceita a autorização está pedindo contato sobre AQUELA compra.
 * Guardamos data, origem e categorias — é o registro que sustenta o envio.
 *
 * Um contato que já pediu PARAR não volta a ter consentimento por uma
 * compra nova: opt-out é decisão da pessoa e só ela desfaz.
 */
export async function registrarContato(
  db: Db,
  dados: {
    telefoneBruto: string | null | undefined;
    nome?: string | null;
    email?: string | null;
    userId?: string | null;
    origem: string;
  }
): Promise<{ contato: Contato | null; motivo?: string }> {
  const tel = normalizarTelefone(dados.telefoneBruto);
  if (!tel.ok) return { contato: null, motivo: tel.motivo };

  const { data: existente } = await db
    .from("whatsapp_contacts")
    .select("id, phone, name, opted_out_at, consent_granted_at")
    .eq("phone", tel.numero)
    .maybeSingle<Contato>();

  const agora = new Date().toISOString();

  if (existente) {
    const patch: Record<string, unknown> = { updated_at: agora };
    if (dados.nome) patch.name = dados.nome;
    if (dados.email) patch.email = dados.email.toLowerCase();
    if (dados.userId) patch.user_id = dados.userId;
    // Só concede consentimento se nunca houve opt-out.
    if (!existente.opted_out_at && !existente.consent_granted_at) {
      patch.consent_granted_at = agora;
      patch.consent_source = dados.origem;
    }
    await db.from("whatsapp_contacts").update(patch).eq("id", existente.id);
    return {
      contato: {
        ...existente,
        name: (patch.name as string) ?? existente.name,
        consent_granted_at: (patch.consent_granted_at as string) ?? existente.consent_granted_at,
      },
    };
  }

  const { data: novo, error } = await db
    .from("whatsapp_contacts")
    .insert({
      phone: tel.numero,
      name: dados.nome ?? null,
      email: dados.email?.toLowerCase() ?? null,
      user_id: dados.userId ?? null,
      consent_granted_at: agora,
      consent_source: dados.origem,
    })
    .select("id, phone, name, opted_out_at, consent_granted_at")
    .single<Contato>();

  if (error) {
    console.error("[whatsapp] falha ao registrar contato", { code: error.code, alvo: mascararTelefone(tel.numero) });
    return { contato: null, motivo: `erro ao registrar contato: ${error.code}` };
  }
  return { contato: novo };
}

/** Marca o opt-out. A partir daqui, nada promocional sai para o número. */
export async function registrarOptOut(db: Db, contactId: number, motivo: string): Promise<number> {
  const agora = new Date().toISOString();
  await db
    .from("whatsapp_contacts")
    .update({ opted_out_at: agora, opt_out_reason: motivo.slice(0, 200), updated_at: agora })
    .eq("id", contactId);
  return cancelarPendentes(db, { contactId }, "opt-out do cliente");
}

/* ------------------------------------------------------------------
 * Plano
 * ------------------------------------------------------------------ */

/**
 * Descobre se o produto comprado é mensal, anual ou avulso.
 *
 * A fonte é o cakto_product_map, que já existia: validity_days 30 é o
 * mensal (R$ 27) e 365 é o anual (R$ 164,59). Bônus e pacotes de token
 * não têm validade e não geram assinatura.
 */
export function planoPorValidade(validityDays: number | null | undefined): Plano {
  if (validityDays === 30) return "mensal";
  if (validityDays === 365) return "anual";
  return "outro";
}

export async function planoDoProduto(db: Db, caktoIds: string[]): Promise<{
  plano: Plano;
  entitlement: string | null;
  amountCents: number;
  validityDays: number | null;
}> {
  if (caktoIds.length === 0) return { plano: "outro", entitlement: null, amountCents: 0, validityDays: null };

  const { data } = await db
    .from("cakto_product_map")
    .select("entitlement, validity_days, expected_amount_cents")
    .in("cakto_id", caktoIds);

  const assinatura = (data ?? []).find((m) => m.validity_days === 30 || m.validity_days === 365);
  if (!assinatura) {
    return { plano: "outro", entitlement: data?.[0]?.entitlement ?? null, amountCents: data?.[0]?.expected_amount_cents ?? 0, validityDays: null };
  }
  return {
    plano: planoPorValidade(assinatura.validity_days),
    entitlement: assinatura.entitlement,
    amountCents: assinatura.expected_amount_cents ?? 0,
    validityDays: assinatura.validity_days,
  };
}

/* ------------------------------------------------------------------
 * AUTOMAÇÃO 1 — carrinho abandonado
 * ------------------------------------------------------------------ */

export type DadosCheckout = {
  checkoutId: string;
  contato: Contato;
  plano: Plano;
  entitlement: string | null;
  amountCents: number;
  parcelas?: number | null;
  paymentMethod?: string | null;
  /** Prazo do PIX/boleto. Enquanto estiver no futuro, não é abandono. */
  expiraEm?: Date | null;
};

/** Cria/atualiza o carrinho no `initiate_checkout` e no `pix_gerado`. */
export async function registrarCarrinho(db: Db, d: DadosCheckout): Promise<number | null> {
  const cfg = configWhatsApp();
  const checkoutUrl = d.plano === "anual" ? cfg.checkoutAnual : cfg.checkoutMensal;

  const { data, error } = await db
    .from("whatsapp_carts")
    .upsert(
      {
        checkout_id: d.checkoutId,
        contact_id: d.contato.id,
        plan: d.plano,
        entitlement: d.entitlement,
        amount_cents: d.amountCents,
        installments: d.parcelas ?? null,
        checkout_url: checkoutUrl,
        payment_method: d.paymentMethod ?? null,
        expires_at: d.expiraEm?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "checkout_id" }
    )
    .select("id")
    .single<{ id: number }>();

  if (error) {
    console.error("[whatsapp] falha ao registrar carrinho", error.code);
    return null;
  }
  return data.id;
}

/**
 * Agenda as três mensagens de recuperação.
 *
 * Chamado no `checkout_abandonment`. As três entram de uma vez, com
 * horários diferentes — cada uma é reavaliada no instante do envio, então
 * agendar cedo não corre o risco de mandar algo que deixou de ser verdade.
 */
export async function agendarRecuperacaoCarrinho(
  db: Db,
  entrada: { cartId: number; contato: Contato; plano: Plano; amountCents: number; parcelas?: number | null }
): Promise<{ agendadas: number; motivos: string[] }> {
  const cfg = configWhatsApp();
  const motivos: string[] = [];

  if (!cfg.carrinhoAtivo) return { agendadas: 0, motivos: ["automação de carrinho desligada"] };

  const agora = Date.now();
  const checkoutUrl = entrada.plano === "anual" ? cfg.checkoutAnual : cfg.checkoutMensal;
  const base = {
    nome: entrada.contato.name,
    plano: entrada.plano,
    amountCents: entrada.amountCents,
    parcelas: entrada.parcelas,
    checkoutUrl,
  };

  const etapas: { tipo: TipoMensagem; quando: Date }[] = [
    { tipo: "cart_recovery_1", quando: new Date(agora + cfg.carrinhoPrimeiraEmMin * MIN) },
    { tipo: "cart_recovery_2", quando: new Date(agora + cfg.carrinhoSegundaEmHoras * HORA) },
    { tipo: "cart_recovery_3", quando: new Date(agora + cfg.carrinhoTerceiraEmHoras * HORA) },
  ];

  let agendadas = 0;
  for (const etapa of etapas) {
    const r = await agendarMensagem(db, {
      contato: entrada.contato,
      tipo: etapa.tipo,
      corpo: textoCarrinho(etapa.tipo as "cart_recovery_1", base),
      quando: etapa.quando,
      cartId: entrada.cartId,
      plano: entrada.plano,
    });
    if (r.agendada) agendadas++;
    else motivos.push(`${etapa.tipo}: ${r.motivo}`);
  }
  return { agendadas, motivos };
}

/** Fecha o carrinho e derruba as mensagens pendentes dele. */
export async function encerrarCarrinho(
  db: Db,
  filtro: { cartId?: number; checkoutId?: string; contactId?: number },
  status: "pago" | "cancelado" | "expirado" | "desistiu",
  motivo: string
): Promise<void> {
  const agora = new Date().toISOString();
  let q = db
    .from("whatsapp_carts")
    .update({ status, resolved_at: agora, resolved_reason: motivo.slice(0, 200), updated_at: agora })
    .eq("status", "aberto");

  if (filtro.cartId) q = q.eq("id", filtro.cartId);
  if (filtro.checkoutId) q = q.eq("checkout_id", filtro.checkoutId);
  if (filtro.contactId) q = q.eq("contact_id", filtro.contactId);

  const { data } = await q.select("id");
  for (const linha of data ?? []) {
    await cancelarPendentes(db, { cartId: (linha as { id: number }).id }, motivo);
  }
}

/* ------------------------------------------------------------------
 * AUTOMAÇÃO 2 — renovação
 * ------------------------------------------------------------------ */

export type DadosAssinatura = {
  caktoSubscriptionId: string | null;
  contato: Contato | null;
  userId: string | null;
  email: string;
  plano: "mensal" | "anual";
  amountCents: number;
  proximaCobranca: Date | null;
};

/** Cria ou atualiza a assinatura. */
export async function salvarAssinatura(db: Db, d: DadosAssinatura, status: string): Promise<number | null> {
  const agora = new Date().toISOString();
  const linha = {
    cakto_subscription_id: d.caktoSubscriptionId,
    contact_id: d.contato?.id ?? null,
    user_id: d.userId,
    email: d.email.toLowerCase(),
    plan: d.plano,
    amount_cents: d.amountCents,
    status,
    next_charge_at: d.proximaCobranca?.toISOString() ?? null,
    updated_at: agora,
  };

  if (d.caktoSubscriptionId) {
    const { data, error } = await db
      .from("subscriptions")
      .upsert(linha, { onConflict: "cakto_subscription_id" })
      .select("id")
      .single<{ id: number }>();
    if (error) {
      console.error("[whatsapp] falha ao salvar assinatura", error.code);
      return null;
    }
    return data.id;
  }

  /* Sem id de assinatura da Cakto (compra avulsa que renova), a chave é
   * e-mail + plano: é o suficiente para não duplicar a mesma pessoa. */
  const { data: existente } = await db
    .from("subscriptions")
    .select("id")
    .eq("email", d.email.toLowerCase())
    .eq("plan", d.plano)
    .maybeSingle<{ id: number }>();

  if (existente) {
    await db.from("subscriptions").update(linha).eq("id", existente.id);
    return existente.id;
  }
  const { data, error } = await db.from("subscriptions").insert(linha).select("id").single<{ id: number }>();
  if (error) {
    console.error("[whatsapp] falha ao criar assinatura", error.code);
    return null;
  }
  return data.id;
}

/** Agenda os lembretes que antecedem a cobrança (mensal e anual). */
export async function agendarLembretesRenovacao(
  db: Db,
  entrada: { subscriptionId: number; contato: Contato; plano: "mensal" | "anual"; amountCents: number; proximaCobranca: Date }
): Promise<number> {
  const cfg = configWhatsApp();
  if (!cfg.renovacaoAtiva) return 0;

  const alvo = entrada.proximaCobranca.getTime();
  const etapas: { tipo: TipoMensagem; quando: Date }[] =
    entrada.plano === "mensal"
      ? [{ tipo: "monthly_renewal_reminder", quando: new Date(alvo - cfg.lembreteMensalDias * DIA) }]
      : [
          { tipo: "annual_renewal_15_days", quando: new Date(alvo - cfg.lembreteAnualPrimeiroDias * DIA) },
          { tipo: "annual_renewal_3_days", quando: new Date(alvo - cfg.lembreteAnualSegundoDias * DIA) },
        ];

  let n = 0;
  for (const etapa of etapas) {
    // Lembrete cuja data já passou não é agendado: mandar "renova em 15
    // dias" no dia da cobrança seria mentira.
    if (etapa.quando.getTime() <= Date.now()) continue;
    const r = await agendarMensagem(db, {
      contato: entrada.contato,
      tipo: etapa.tipo,
      corpo: textoRenovacao(etapa.tipo, {
        nome: entrada.contato.name,
        plano: entrada.plano,
        amountCents: entrada.amountCents,
        proximaCobranca: entrada.proximaCobranca,
      }),
      quando: etapa.quando,
      subscriptionId: entrada.subscriptionId,
      plano: entrada.plano,
    });
    if (r.agendada) n++;
  }
  return n;
}

/**
 * Renovação recusada: manda o aviso agora e agenda a cobrança de
 * pendência (3 dias no mensal, 5 no anual).
 */
export async function agendarFalhaRenovacao(
  db: Db,
  entrada: { subscriptionId: number; contato: Contato; plano: "mensal" | "anual"; amountCents: number }
): Promise<number> {
  const cfg = configWhatsApp();
  if (!cfg.renovacaoAtiva) return 0;

  const agora = Date.now();
  const diasPendencia = entrada.plano === "mensal" ? cfg.cobrancaMensalPendenteDias : cfg.cobrancaAnualPendenteDias;

  const etapas: { tipo: TipoMensagem; quando: Date }[] = [
    {
      tipo: entrada.plano === "mensal" ? "monthly_payment_failed" : "annual_payment_failed",
      quando: new Date(agora + 5 * MIN),
    },
    {
      tipo: entrada.plano === "mensal" ? "monthly_payment_pending" : "annual_payment_pending",
      quando: new Date(agora + diasPendencia * DIA),
    },
  ];

  let n = 0;
  for (const etapa of etapas) {
    const r = await agendarMensagem(db, {
      contato: entrada.contato,
      tipo: etapa.tipo,
      corpo: textoRenovacao(etapa.tipo, {
        nome: entrada.contato.name,
        plano: entrada.plano,
        amountCents: entrada.amountCents,
      }),
      quando: etapa.quando,
      subscriptionId: entrada.subscriptionId,
      plano: entrada.plano,
    });
    if (r.agendada) n++;
  }
  return n;
}

/**
 * Aviso de suspensão. Só é chamado DEPOIS que o acesso caiu de verdade
 * — nunca antes, para a mensagem não afirmar algo que não aconteceu.
 */
export async function agendarSuspensao(
  db: Db,
  entrada: { subscriptionId: number; contato: Contato; plano: "mensal" | "anual"; amountCents: number }
): Promise<boolean> {
  const cfg = configWhatsApp();
  if (!cfg.renovacaoAtiva) return false;

  const tipo: TipoMensagem = entrada.plano === "mensal" ? "monthly_access_suspended" : "annual_access_suspended";
  const r = await agendarMensagem(db, {
    contato: entrada.contato,
    tipo,
    corpo: textoRenovacao(tipo, {
      nome: entrada.contato.name,
      plano: entrada.plano,
      amountCents: entrada.amountCents,
    }),
    quando: new Date(),
    subscriptionId: entrada.subscriptionId,
    plano: entrada.plano,
  });
  return r.agendada;
}

/* ------------------------------------------------------------------
 * AUTOMAÇÃO 3 — aluno inativo
 * ------------------------------------------------------------------ */

export type ResumoInatividade = {
  candidatos: number;
  agendadas: number;
  motivos: string[];
};

/**
 * Lembra quem parou de abrir o app.
 *
 * Diferente das outras duas, esta não nasce de um evento da Cakto: é uma
 * varredura, chamada pelo cron. Por isso o cuidado extra com volume —
 * teto por rodada — e com repetição — descanso entre lembretes, dentro de
 * buscarAlunosInativos.
 *
 * A mensagem entra na fila para AGORA e, como toda mensagem, é
 * reconferida no instante do envio: quem voltar a acessar no meio do
 * caminho não recebe.
 */
export async function agendarLembretesInatividade(db: Db): Promise<ResumoInatividade> {
  const cfg = configWhatsApp();
  const resumo: ResumoInatividade = { candidatos: 0, agendadas: 0, motivos: [] };

  if (!cfg.inatividadeAtiva) {
    resumo.motivos.push("automação de inatividade desligada");
    return resumo;
  }

  const inativos = await buscarAlunosInativos(db, cfg);
  resumo.candidatos = inativos.length;

  for (const aluno of inativos.slice(0, cfg.inatividadeMaxPorRodada)) {
    const r = await agendarMensagem(db, {
      contato: aluno.contato,
      tipo: "inactivity_nudge",
      corpo: textoInatividade({ nome: aluno.contato.name }),
      quando: new Date(),
    });
    if (r.agendada) resumo.agendadas++;
    else resumo.motivos.push(`contato ${aluno.contato.id}: ${r.motivo}`);
  }
  return resumo;
}

/**
 * Renovação aprovada: derruba tudo que estava pendente de cobrança e,
 * opcionalmente, confirma.
 */
export async function renovacaoAprovada(
  db: Db,
  entrada: {
    subscriptionId: number;
    contato: Contato | null;
    plano: "mensal" | "anual";
    amountCents: number;
    proximaCobranca: Date | null;
  }
): Promise<{ canceladas: number; confirmou: boolean }> {
  const cfg = configWhatsApp();

  const canceladas = await cancelarPendentes(
    db,
    {
      subscriptionId: entrada.subscriptionId,
      tipos: [
        "monthly_payment_failed",
        "monthly_payment_pending",
        "monthly_access_suspended",
        "annual_payment_failed",
        "annual_payment_pending",
        "annual_access_suspended",
      ],
    },
    "renovação aprovada"
  );

  let confirmou = false;
  if (cfg.renovacaoAtiva && entrada.contato) {
    const r = await agendarMensagem(db, {
      contato: entrada.contato,
      tipo: "renewal_payment_confirmed",
      corpo: textoRenovacao("renewal_payment_confirmed", {
        nome: entrada.contato.name,
        plano: entrada.plano,
        amountCents: entrada.amountCents,
        proximaCobranca: entrada.proximaCobranca,
      }),
      quando: new Date(),
      subscriptionId: entrada.subscriptionId,
      plano: entrada.plano,
    });
    confirmou = r.agendada;
  }
  return { canceladas, confirmou };
}
