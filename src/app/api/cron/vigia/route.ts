import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { alertaAdmin } from "@/lib/alerts";

/**
 * Vigia: roda de 15 em 15 minutos (agendado em vercel.json) e avisa quando
 * algo que custa dinheiro ou cliente deu errado.
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

  if (problemas.length) {
    await alertaAdmin(problemas.join("\n\n"), {
      severidade: "aviso",
      chave: "vigia",
    });
  }

  return NextResponse.json({
    ok: true,
    verificadoEm: agora.toISOString(),
    problemas: problemas.length,
  });
}
