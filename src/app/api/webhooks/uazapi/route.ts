import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { checarRateLimit, ipDaRequisicao } from "@/lib/rate-limit";
import { alertaAdmin } from "@/lib/alerts";
import { normalizarTelefone, mascararTelefone } from "@/lib/whatsapp/phone";
import { interpretarResposta } from "@/lib/whatsapp/respostas";
import { registrarOptOut } from "@/lib/whatsapp/automacoes";
import { cancelarPendentes } from "@/lib/whatsapp/fila";
import { enviarTexto } from "@/lib/whatsapp/uazapi";
import {
  RESPOSTA_JA_PAGUEI,
  RESPOSTA_PARAR,
  respostaQueroCancelar,
} from "@/lib/whatsapp/templates";

/**
 * Respostas do cliente no WhatsApp.
 *
 * Configure na uazapi apontando para:
 *   {SITE}/api/webhooks/uazapi?secret=<UAZAPI_WEBHOOK_SECRET>
 *
 * O que este endpoint faz e o que NÃO faz:
 *  · "PARAR" → registra o opt-out na hora e derruba tudo que estava
 *    agendado para o número. É a única ação destrutiva automática.
 *  · "JÁ PAGUEI" → responde e PAUSA a recuperação por 72h, sem afirmar
 *    que o pagamento foi encontrado (não consultamos a Cakto aqui: a
 *    confirmação chega pelo webhook de pagamento, que é a fonte real).
 *  · "QUERO CANCELAR" → responde com o link. NUNCA cancela sozinho.
 *  · Qualquer outra coisa → só registra, para você ler no painel.
 */

export const dynamic = "force-dynamic";

function segredoConfere(recebido: string | null, esperado: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Extrai telefone e texto do payload da uazapi, aceitando as variações. */
function lerMensagem(payload: Record<string, unknown>): { telefone?: string; texto?: string; deMim: boolean } {
  const msg = (payload.message ?? payload.data ?? payload) as Record<string, unknown>;

  const chat = String(msg.chatid ?? msg.chatId ?? msg.from ?? msg.sender ?? "");
  const telefone = chat.split("@")[0] || undefined;

  const texto =
    (typeof msg.text === "string" && msg.text) ||
    (typeof msg.content === "string" && msg.content) ||
    (typeof msg.body === "string" && msg.body) ||
    undefined;

  // fromMe = mensagem que NÓS mandamos ecoando de volta. Ignorar.
  const deMim = msg.fromMe === true || msg.fromme === true;

  return { telefone, texto: texto || undefined, deMim };
}

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (!(await checarRateLimit(`uazapi:${ip}`, 120, 60))) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  const esperado = process.env.UAZAPI_WEBHOOK_SECRET;
  if (!esperado) {
    // Sem segredo configurado o endpoint fica fechado: aberto, qualquer um
    // poderia forjar um "PARAR" e silenciar a comunicação com um cliente.
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }

  const url = new URL(request.url);
  const recebido = url.searchParams.get("secret") ?? request.headers.get("x-webhook-secret");
  if (!segredoConfere(recebido, esperado)) {
    if (!(await checarRateLimit(`uazapi-invalido:${ip}`, 5, 300))) {
      await alertaAdmin(`Tentativas com segredo inválido no webhook da uazapi, vindas de ${ip}.`, {
        severidade: "critico",
        chave: `uazapi-segredo:${ip}`,
      });
    }
    return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { telefone, texto, deMim } = lerMensagem(payload);
  if (deMim) return NextResponse.json({ ok: true, ignorado: "mensagem própria" });
  if (!telefone || !texto) return NextResponse.json({ ok: true, ignorado: "sem telefone ou sem texto" });

  const tel = normalizarTelefone(telefone);
  if (!tel.ok) return NextResponse.json({ ok: true, ignorado: `telefone inválido: ${tel.motivo}` });

  const db = createAdminClient();
  const { data: contato } = await db
    .from("whatsapp_contacts")
    .select("id, phone, name, opted_out_at")
    .eq("phone", tel.numero)
    .maybeSingle<{ id: number; phone: string; name: string | null; opted_out_at: string | null }>();

  if (!contato) {
    // Alguém que nunca entrou no funil escreveu. Não criamos contato nem
    // respondemos: seria iniciar conversa com quem não pediu.
    return NextResponse.json({ ok: true, ignorado: "número não está na base" });
  }

  const agora = new Date().toISOString();
  await db
    .from("whatsapp_contacts")
    .update({ last_inbound_at: agora, last_inbound_text: texto.slice(0, 500), updated_at: agora })
    .eq("id", contato.id);

  const intencao = interpretarResposta(texto);
  let resposta: string | null = null;
  let acao = "registrado";

  if (intencao === "parar") {
    const canceladas = await registrarOptOut(db, contato.id, "cliente respondeu PARAR");
    resposta = RESPOSTA_PARAR;
    acao = `opt-out (${canceladas} mensagens canceladas)`;
  } else if (intencao === "ja_paguei") {
    /* Não afirmamos que achamos o pagamento — só pausamos a cobrança por
     * 72h. Se o pagamento entrar, o webhook da Cakto cancela de vez; se
     * não entrar, a sequência volta sozinha. */
    const daqui72h = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const { data: adiadas } = await db
      .from("whatsapp_messages")
      .update({ scheduled_for: daqui72h, updated_at: agora })
      .eq("contact_id", contato.id)
      .in("status", ["scheduled", "failed"])
      .lt("scheduled_for", daqui72h)
      .select("id");
    resposta = RESPOSTA_JA_PAGUEI;
    acao = `pagamento em verificação (${adiadas?.length ?? 0} mensagens adiadas 72h)`;

    await alertaAdmin(
      `Cliente ${mascararTelefone(tel.numero)} (${contato.name ?? "sem nome"}) respondeu que já pagou. ` +
        `Confira na Cakto se a compra entrou; a cobrança automática está pausada por 72h.`,
      { severidade: "aviso", chave: `ja-paguei:${contato.id}` }
    );
  } else if (intencao === "quero_cancelar") {
    // Só responde com o caminho seguro. Cancelamento é ação humana.
    resposta = respostaQueroCancelar();
    acao = "pedido de cancelamento encaminhado";
    await cancelarPendentes(db, { contactId: contato.id }, "cliente pediu cancelamento");
    await alertaAdmin(
      `Cliente ${mascararTelefone(tel.numero)} (${contato.name ?? "sem nome"}) pediu cancelamento pelo WhatsApp. ` +
        `Nada foi cancelado automaticamente.`,
      { severidade: "aviso", chave: `cancelar:${contato.id}` }
    );
  }

  if (resposta) {
    const envio = await enviarTexto(tel.numero, resposta);
    if (!envio.ok) {
      console.warn(`[uazapi] resposta automática não saiu: ${envio.motivo}`);
    }
  }

  return NextResponse.json({ ok: true, intencao, acao });
}
