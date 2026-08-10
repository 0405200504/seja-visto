import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { configWhatsApp, podeEnviarPara } from "./config";
import { enviarTexto, logEnvio, statusInstancia, type CategoriaErro } from "./uazapi";
import { continuaInativo } from "./inatividade";
import type { TipoMensagem } from "./templates";

/**
 * Fila de mensagens.
 *
 * Nada é enviado no momento do evento: tudo é AGENDADO e um cron processa.
 * Isso dá três coisas que o disparo direto não dava:
 *
 *  · idempotência — a chave única impede a mesma mensagem duas vezes,
 *    mesmo com webhook repetido;
 *  · reavaliação — no instante do envio o estado é conferido DE NOVO.
 *    Uma mensagem de carrinho abandonado agendada às 10h não sai às 10h30
 *    se o cliente pagou às 10h15;
 *  · ritmo — intervalo técnico fixo entre envios e uma mensagem por vez
 *    por contato.
 */

type Db = ReturnType<typeof createAdminClient>;

export type Contato = {
  id: number;
  phone: string;
  name: string | null;
  opted_out_at: string | null;
  consent_granted_at: string | null;
};

export type MensagemFila = {
  id: number;
  dedupe_key: string;
  message_type: TipoMensagem;
  contact_id: number;
  cart_id: number | null;
  subscription_id: number | null;
  plan: string | null;
  body: string;
  scheduled_for: string;
  status: string;
  attempts: number;
};

/** Chave de idempotência: contato + origem + tipo + dia agendado. */
export function chaveMensagem(entrada: {
  contactId: number;
  cartId?: number | null;
  subscriptionId?: number | null;
  tipo: TipoMensagem;
  quando: Date;
}): string {
  const origem = entrada.cartId
    ? `cart:${entrada.cartId}`
    : entrada.subscriptionId
      ? `sub:${entrada.subscriptionId}`
      : "sem-origem";
  const dia = entrada.quando.toISOString().slice(0, 10);
  return `${entrada.contactId}:${origem}:${entrada.tipo}:${dia}`;
}

export type ResultadoAgendamento =
  | { agendada: true; id: number }
  | { agendada: false; motivo: string };

/**
 * Coloca uma mensagem na fila.
 *
 * Não envia nada agora. Se a chave já existir, não faz nada — é o que
 * torna o reprocessamento de webhook inofensivo.
 */
export async function agendarMensagem(
  db: Db,
  entrada: {
    contato: Contato;
    tipo: TipoMensagem;
    corpo: string;
    quando: Date;
    cartId?: number | null;
    subscriptionId?: number | null;
    plano?: string | null;
  }
): Promise<ResultadoAgendamento> {
  const cfg = configWhatsApp();

  // Consentimento e opt-out são conferidos aqui E de novo no envio.
  if (entrada.contato.opted_out_at) return { agendada: false, motivo: "contato pediu para parar" };
  if (!entrada.contato.consent_granted_at) return { agendada: false, motivo: "sem consentimento registrado" };
  if (!cfg.filaAtiva) return { agendada: false, motivo: "fila desligada" };

  const chave = chaveMensagem({
    contactId: entrada.contato.id,
    cartId: entrada.cartId,
    subscriptionId: entrada.subscriptionId,
    tipo: entrada.tipo,
    quando: entrada.quando,
  });

  const { data, error } = await db
    .from("whatsapp_messages")
    .insert({
      dedupe_key: chave,
      message_type: entrada.tipo,
      contact_id: entrada.contato.id,
      cart_id: entrada.cartId ?? null,
      subscription_id: entrada.subscriptionId ?? null,
      plan: entrada.plano ?? null,
      body: entrada.corpo,
      scheduled_for: entrada.quando.toISOString(),
      status: "scheduled",
    })
    .select("id")
    .single<{ id: number }>();

  if (error) {
    if (error.code === "23505") return { agendada: false, motivo: "já agendada (chave repetida)" };
    console.error("[whatsapp] falha ao agendar", { tipo: entrada.tipo, code: error.code });
    return { agendada: false, motivo: `erro ao agendar: ${error.code}` };
  }
  return { agendada: true, id: data.id };
}

/**
 * Cancela mensagens ainda não enviadas.
 *
 * É o que interrompe a sequência quando o pagamento entra, a assinatura
 * é ativada, o cliente responde PARAR ou o pedido é cancelado.
 */
export async function cancelarPendentes(
  db: Db,
  filtro: { cartId?: number; subscriptionId?: number; contactId?: number; tipos?: TipoMensagem[] },
  motivo: string
): Promise<number> {
  let q = db
    .from("whatsapp_messages")
    .update({ status: "cancelled", skip_reason: motivo.slice(0, 200), updated_at: new Date().toISOString() })
    .in("status", ["scheduled", "failed"]);

  if (filtro.cartId !== undefined) q = q.eq("cart_id", filtro.cartId);
  if (filtro.subscriptionId !== undefined) q = q.eq("subscription_id", filtro.subscriptionId);
  if (filtro.contactId !== undefined) q = q.eq("contact_id", filtro.contactId);
  if (filtro.tipos?.length) q = q.in("message_type", filtro.tipos);

  const { data, error } = await q.select("id");
  if (error) {
    console.error("[whatsapp] falha ao cancelar pendentes", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

/* ------------------------------------------------------------------
 * Verificações no momento do envio
 * ------------------------------------------------------------------ */

export type Veredito = { enviar: true } | { enviar: false; motivo: string };

/**
 * Confere o estado ATUAL antes de mandar. Nunca confia no que era verdade
 * quando a mensagem foi agendada.
 */
export async function conferirAntesDeEnviar(db: Db, msg: MensagemFila): Promise<Veredito> {
  const { data: contato } = await db
    .from("whatsapp_contacts")
    .select("id, phone, opted_out_at, consent_granted_at, user_id, email")
    .eq("id", msg.contact_id)
    .maybeSingle<
      Pick<Contato, "id" | "phone" | "opted_out_at" | "consent_granted_at"> & {
        user_id: string | null;
        email: string | null;
      }
    >();

  if (!contato) return { enviar: false, motivo: "contato não existe mais" };
  if (contato.opted_out_at) return { enviar: false, motivo: "contato pediu para parar" };
  if (!contato.consent_granted_at) return { enviar: false, motivo: "consentimento revogado" };

  const permissao = podeEnviarPara(contato.phone);
  if (!permissao.ok) return { enviar: false, motivo: permissao.motivo! };

  /* Inatividade: o lembrete só continua verdadeiro enquanto a pessoa
   * seguir sem acessar. Quem abriu o app depois do agendamento não recebe. */
  if (msg.message_type === "inactivity_nudge") {
    const veredito = await continuaInativo(db, { user_id: contato.user_id, email: contato.email });
    if (!veredito.enviar) return veredito;
  }

  // Carrinho: só continua se ainda estiver aberto e abandonado.
  if (msg.cart_id) {
    const { data: carrinho } = await db
      .from("whatsapp_carts")
      .select("status, expires_at")
      .eq("id", msg.cart_id)
      .maybeSingle<{ status: string; expires_at: string | null }>();

    if (!carrinho) return { enviar: false, motivo: "carrinho não existe mais" };
    if (carrinho.status !== "aberto") {
      return { enviar: false, motivo: `carrinho está "${carrinho.status}"` };
    }
    // PIX/boleto ainda no prazo não é abandono.
    if (carrinho.expires_at && new Date(carrinho.expires_at) > new Date()) {
      return { enviar: false, motivo: "pagamento ainda dentro do prazo (PIX/boleto)" };
    }
  }

  // Assinatura: o estado precisa continuar coerente com a mensagem.
  if (msg.subscription_id) {
    const { data: assinatura } = await db
      .from("subscriptions")
      .select("status, plan")
      .eq("id", msg.subscription_id)
      .maybeSingle<{ status: string; plan: string }>();

    if (!assinatura) return { enviar: false, motivo: "assinatura não existe mais" };
    if (assinatura.status === "cancelada") return { enviar: false, motivo: "assinatura cancelada" };
    if (msg.plan && assinatura.plan !== msg.plan) {
      return { enviar: false, motivo: `plano mudou de ${msg.plan} para ${assinatura.plan}` };
    }

    const esperado = ESTADO_ESPERADO[msg.message_type];
    if (esperado && !esperado.includes(assinatura.status)) {
      return { enviar: false, motivo: `assinatura está "${assinatura.status}", mensagem não faz mais sentido` };
    }
  }

  return { enviar: true };
}

/**
 * Em que estado a assinatura precisa estar para cada mensagem ainda ser
 * verdadeira. É o que impede dizer "seu acesso foi suspenso" para quem
 * pagou ontem.
 */
const ESTADO_ESPERADO: Partial<Record<TipoMensagem, string[]>> = {
  monthly_renewal_reminder: ["ativa"],
  annual_renewal_15_days: ["ativa"],
  annual_renewal_3_days: ["ativa"],
  monthly_payment_failed: ["pendente"],
  annual_payment_failed: ["pendente"],
  monthly_payment_pending: ["pendente"],
  annual_payment_pending: ["pendente"],
  monthly_access_suspended: ["suspensa", "expirada"],
  annual_access_suspended: ["suspensa", "expirada"],
  renewal_payment_confirmed: ["ativa"],
};

/* ------------------------------------------------------------------
 * Processamento
 * ------------------------------------------------------------------ */

export type ResumoRodada = {
  reservadas: number;
  enviadas: number;
  ignoradas: number;
  falhas: number;
  parouPor?: string;
};

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera da próxima tentativa: 30s, 2min, 10min. */
export function proximaTentativaMs(tentativa: number, inicialMs: number): number {
  const escala = [1, 4, 20];
  return inicialMs * (escala[Math.min(tentativa, escala.length) - 1] ?? 20);
}

/**
 * Processa uma rodada da fila.
 *
 * A reserva acontece no banco (`reservar_mensagens_whatsapp`), com
 * `for update skip locked`: duas execuções simultâneas do cron nunca
 * pegam a mesma mensagem, e cada contato recebe no máximo uma por rodada.
 */
export async function processarFila(db: Db): Promise<ResumoRodada> {
  const cfg = configWhatsApp();
  const resumo: ResumoRodada = { reservadas: 0, enviadas: 0, ignoradas: 0, falhas: 0 };

  if (!cfg.filaAtiva) {
    resumo.parouPor = "fila desligada (WHATSAPP_QUEUE_ENABLED)";
    return resumo;
  }

  /* Instância fora do ar: não adianta tentar, e insistir é justamente o
   * comportamento que o WhatsApp pune. Sai sem consumir tentativa. */
  const instancia = await statusInstancia();
  if (!instancia.conectada) {
    resumo.parouPor = `instância ${instancia.estado}${instancia.motivo ? ` — ${instancia.motivo}` : ""}`;
    return resumo;
  }

  const { data: reservadas, error } = await db.rpc("reservar_mensagens_whatsapp", {
    p_limite: cfg.maxPorRodada,
  });

  if (error) {
    console.error("[whatsapp] falha ao reservar mensagens", error.message);
    resumo.parouPor = `erro ao reservar: ${error.message}`;
    return resumo;
  }

  const lista = (reservadas ?? []) as MensagemFila[];
  resumo.reservadas = lista.length;

  for (const [indice, msg] of lista.entries()) {
    // Ritmo fixo entre envios — técnico, não aleatório.
    if (indice > 0) await espera(cfg.intervaloEnvioMs);

    const veredito = await conferirAntesDeEnviar(db, msg);
    if (!veredito.enviar) {
      await db
        .from("whatsapp_messages")
        .update({
          status: "skipped",
          skip_reason: veredito.motivo.slice(0, 200),
          updated_at: new Date().toISOString(),
        })
        .eq("id", msg.id);
      resumo.ignoradas++;
      continue;
    }

    const { data: contato } = await db
      .from("whatsapp_contacts")
      .select("phone")
      .eq("id", msg.contact_id)
      .maybeSingle<{ phone: string }>();

    if (!contato) {
      await marcarFalha(db, msg, "permanente", "contato sem telefone", null, cfg.maxTentativas, cfg.retryInicialMs);
      resumo.falhas++;
      continue;
    }

    const envio = await enviarTexto(contato.phone, msg.body);
    logEnvio(msg.message_type, contato.phone, envio);

    if (envio.ok) {
      const agora = new Date().toISOString();
      await db
        .from("whatsapp_messages")
        .update({
          status: "sent",
          provider_message_id: envio.providerMessageId,
          response_code: envio.codigo,
          sent_at: agora,
          updated_at: agora,
          error_message: null,
          error_category: null,
        })
        .eq("id", msg.id);
      resumo.enviadas++;
      continue;
    }

    await marcarFalha(db, msg, envio.categoria, envio.motivo, envio.codigo, cfg.maxTentativas, cfg.retryInicialMs);
    resumo.falhas++;

    // Instância caiu no meio da rodada: para tudo em vez de queimar tentativas.
    if (envio.categoria === "desconectado") {
      resumo.parouPor = "instância desconectada durante a rodada";
      break;
    }
  }

  return resumo;
}

/**
 * Grava o desfecho de uma falha.
 *
 * Erro permanente (número inválido, credencial) não gera retentativa:
 * repetir não muda o resultado e só polui a fila.
 */
async function marcarFalha(
  db: Db,
  msg: MensagemFila,
  categoria: CategoriaErro,
  motivo: string,
  codigo: number | null,
  maxTentativas: number,
  retryInicialMs: number
): Promise<void> {
  const agora = new Date();
  const podeRepetir = categoria === "temporario" && msg.attempts < maxTentativas;

  await db
    .from("whatsapp_messages")
    .update({
      status: "failed",
      error_category: categoria,
      error_message: motivo.slice(0, 300),
      response_code: codigo,
      /* next_attempt_at NULO significa "não tente de novo" — é assim que a
       * função de reserva no banco distingue a falha temporária (volta para
       * a fila) da definitiva (fica parada para você ver no painel). */
      next_attempt_at: podeRepetir
        ? new Date(agora.getTime() + proximaTentativaMs(msg.attempts, retryInicialMs)).toISOString()
        : null,
      updated_at: agora.toISOString(),
    })
    .eq("id", msg.id);
}
