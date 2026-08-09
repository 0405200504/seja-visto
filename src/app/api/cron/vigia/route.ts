import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { alertaAdmin } from "@/lib/alerts";
import { baseDoSite } from "@/lib/site-url";

/**
 * Vigia: agendado em vercel.json e avisa quando algo que custa dinheiro ou
 * cliente deu errado.
 *
 * Hoje roda 1x por dia — o plano Hobby da Vercel não aceita intervalo menor.
 * No plano Pro, troque o schedule no vercel.json para rodar a cada 15 minutos.
 * Os alertas urgentes (webhook falhou, IA fora do ar, venda sem acesso) já
 * disparam na hora, direto do código; este cron é a rede de segurança para o
 * que ninguém acionou.
 *
 * Cobre 4 dos 8 alertas do plano de monitoramento:
 *   1. webhook da Cakto que falhou
 *   2. compra aprovada sem acesso liberado
 *   3. fit da comunidade parado na moderação
 *   4. acesso vencendo nos próximos 7 dias
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function autorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const recebido = header.replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recebido);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const db = createAdminClient();
  const agora = new Date();
  const problemas: string[] = [];

  /* 1. Webhooks que falharam nas últimas 24h ------------------------- */
  const { data: falhos } = await db
    .from("webhook_events")
    .select("event_id, event_type, user_email, error_message, created_at")
    .eq("status", "failed")
    .gte("created_at", new Date(agora.getTime() - 24 * 3600_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (falhos?.length) {
    problemas.push(
      `${falhos.length} webhook(s) da Cakto com falha:\n` +
        falhos
          .map((f) => `· ${f.user_email ?? "?"} — ${f.error_message ?? f.event_type}`)
          .join("\n")
    );
  }

  /* 2. Compra aprovada há mais de 15 min sem acesso liberado ---------- */
  const corte = new Date(agora.getTime() - 15 * 60_000).toISOString();
  const { data: vendasRecentes } = await db
    .from("sales")
    .select("id, email, user_id, amount_cents, created_at")
    .eq("status", "approved")
    .eq("is_test", false)
    .not("user_id", "is", null)
    .lt("created_at", corte)
    .gte("created_at", new Date(agora.getTime() - 24 * 3600_000).toISOString())
    .limit(100);

  if (vendasRecentes?.length) {
    const userIds = [...new Set(vendasRecentes.map((v) => v.user_id!))];
    const { data: acessos } = await db
      .from("user_entitlements")
      .select("user_id")
      .eq("entitlement", "base")
      .in("user_id", userIds);

    const comAcesso = new Set((acessos ?? []).map((a) => a.user_id));
    const semAcesso = vendasRecentes.filter((v) => !comAcesso.has(v.user_id!));

    if (semAcesso.length) {
      problemas.push(
        `${semAcesso.length} compra(s) aprovada(s) SEM acesso liberado:\n` +
          semAcesso
            .map((v) => `· ${v.email} — R$ ${(v.amount_cents / 100).toFixed(2)}`)
            .join("\n") +
          `\nLibere em /admin/alunos.`
      );
    }
  }

  /* 3. Fits parados na moderação há mais de 24h ---------------------- */
  const { count: pendentes } = await db
    .from("community_fits")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", new Date(agora.getTime() - 24 * 3600_000).toISOString());

  if (pendentes && pendentes > 0) {
    problemas.push(
      `${pendentes} fit(s) esperando moderação há mais de 24h. Veja em /admin/comunidade.`
    );
  }

  /* 4. Acessos vencendo nos próximos 7 dias -------------------------- */
  const { count: vencendo } = await db
    .from("user_entitlements")
    .select("*", { count: "exact", head: true })
    .eq("entitlement", "base")
    .not("expires_at", "is", null)
    .gt("expires_at", agora.toISOString())
    .lt("expires_at", new Date(agora.getTime() + 7 * 24 * 3600_000).toISOString());

  if (vencendo && vencendo > 0) {
    problemas.push(
      `${vencendo} aluno(s) com acesso vencendo em 7 dias. Boa hora para mandar renovação.`
    );
  }

  /* 5. SILÊNCIO da Cakto -------------------------------------------------
   * As checagens 1 e 2 só enxergam problema quando existe LINHA no banco:
   * um webhook que falhou, uma venda registrada. Elas são cegas para o pior
   * caso — a Cakto parar de chamar. Foi o que aconteceu em 08/08/2026: o
   * cliente pagou, nenhum evento chegou, e como não havia linha nenhuma
   * ninguém foi avisado. O acesso só saiu no dia seguinte, na mão.
   *
   * O sinal usado é o evento MAIS RECENTE de qualquer tipo — não só compra.
   * Checkout iniciado e abandono disparam muito mais que venda, então
   * silêncio total por um dia inteiro significa que a Cakto não está mais
   * conseguindo falar com a gente (URL trocada, domínio morto, segredo
   * mudado), e não simplesmente que ninguém comprou. */
  const horasSilencio = Number(process.env.VIGIA_SILENCIO_HORAS ?? 24);
  let semNoticias = false;

  if (horasSilencio > 0) {
    const { data: ultimo } = await db
      .from("webhook_events")
      .select("created_at")
      .eq("provider", "cakto")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>();

    const limite = new Date(agora.getTime() - horasSilencio * 3600_000);
    const desde = ultimo ? new Date(ultimo.created_at) : null;

    if (!desde || desde < limite) {
      semNoticias = true;
      problemas.push(
        `NENHUM evento da Cakto há ${
          desde
            ? `${Math.floor((agora.getTime() - desde.getTime()) / 3600_000)}h`
            : "tempo nenhum registrado"
        }.\n` +
          `Se alguém comprou nesse período, o acesso NÃO foi liberado e o e-mail NÃO saiu.\n` +
          `Confira no painel da Cakto se a URL do webhook ainda é ${baseDoSite()}/api/webhooks/cakto ` +
          `e veja o histórico de entregas — resposta 404 quer dizer endereço errado, 401 quer dizer segredo errado.`
      );
    }
  }

  if (problemas.length) {
    await alertaAdmin(problemas.join("\n\n"), {
      // Silêncio da Cakto é dinheiro entrando sem produto sair: sobe o tom.
      severidade: semNoticias ? "critico" : "aviso",
      chave: "vigia",
    });
  }

  return NextResponse.json({
    ok: true,
    verificadoEm: agora.toISOString(),
    problemas: problemas.length,
    silencioCakto: semNoticias,
  });
}
