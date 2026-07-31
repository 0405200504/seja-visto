import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { alertaAdmin } from "@/lib/alerts";
import { configWhatsApp } from "@/lib/whatsapp/config";
import { processarFila } from "@/lib/whatsapp/fila";
import { suspenderAssinaturasVencidas } from "@/lib/whatsapp/cakto-eventos";
import { statusInstancia } from "@/lib/whatsapp/uazapi";

/**
 * Motor das automações de WhatsApp.
 *
 * Faz três coisas, nesta ordem:
 *  1. suspende assinaturas cujo prazo venceu e o acesso realmente caiu
 *     (é o que autoriza a mensagem de "acesso suspenso");
 *  2. processa a fila, respeitando o intervalo técnico entre envios;
 *  3. avisa você se a instância estiver desconectada ou houver falha
 *     definitiva acumulada.
 *
 * Agendado no vercel.json. Também pode ser chamado à mão com o
 * CRON_SECRET, que é como os testes rodam sem esperar o horário.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recebido = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recebido);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cfg = configWhatsApp();
  const db = createAdminClient();

  if (!cfg.filaAtiva) {
    return NextResponse.json({
      ok: true,
      parado: "WHATSAPP_QUEUE_ENABLED está desligado",
      modoTeste: cfg.modoTeste,
    });
  }

  // 1) Suspensões — só depois que o acesso caiu de verdade.
  let suspensas = 0;
  if (cfg.renovacaoAtiva) {
    try {
      suspensas = await suspenderAssinaturasVencidas(db);
    } catch (err) {
      console.error("[cron/whatsapp] falha ao suspender assinaturas", err);
    }
  }

  // 2) Fila.
  const resumo = await processarFila(db);

  // 3) Alertas operacionais.
  if (resumo.parouPor?.includes("instância")) {
    const status = await statusInstancia();
    await alertaAdmin(
      `A fila de WhatsApp parou: ${resumo.parouPor}. ` +
        `Reconecte a instância na uazapi — enquanto isso, nenhuma recuperação ` +
        `de carrinho ou aviso de renovação sai. Estado atual: ${status.estado}.`,
      { severidade: "critico", chave: "uazapi-desconectada" }
    );
  }

  /* Falha definitiva é a que não vai se resolver sozinha: número inválido,
   * credencial errada, tentativas esgotadas. Precisa de olho humano. */
  const { count: definitivas } = await db
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .is("next_attempt_at", null);

  if ((definitivas ?? 0) > 0) {
    await alertaAdmin(
      `${definitivas} mensagem(ns) de WhatsApp falharam em definitivo e não serão repetidas. ` +
        `Veja o motivo em /admin/whatsapp.`,
      { severidade: "aviso", chave: "wa-falhas-definitivas" }
    );
  }

  return NextResponse.json({
    ok: true,
    modoTeste: cfg.modoTeste,
    suspensas,
    fila: resumo,
    falhasDefinitivas: definitivas ?? 0,
  });
}
