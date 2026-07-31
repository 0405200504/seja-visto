"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/audit";
import { chaveAcesso, enviarEmailRegistrado } from "@/lib/email/envio";
import { emailAcessoLiberado } from "@/lib/email/templates";
import { paramsFromQueryString, toCsv } from "@/lib/admin/list";
import { fetchSales } from "@/lib/admin/queries/sales";
import { ALL_ENTITLEMENT_KEYS } from "@/lib/bonuses";

type Result = { ok: boolean; message: string };

/* ---------- edição de transações ---------- */

export async function updateSaleFieldAction(saleId: string, field: string, value: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (field === "gateway_fee") {
    const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) return { ok: false, message: "Taxa inválida." };
    patch.gateway_fee_cents = cents;
  } else if (field === "offer_name") {
    patch.offer_name = value || null;
  } else {
    return { ok: false, message: "Campo não editável." };
  }

  const { data: before } = await db.from("sales").select("email, gateway_fee_cents, offer_name").eq("id", saleId).maybeSingle();
  const { error } = await db.from("sales").update(patch).eq("id", saleId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: `venda.editar_${field}`, entityType: "venda", entityId: saleId,
    entityLabel: before?.email, before, after: patch,
  });
  revalidatePath("/admin/receita/transacoes");
  return { ok: true, message: "Salvo." };
}

export async function markRefundAction(saleId: string, refunded: boolean): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { data: sale } = await db.from("sales").select("email, status").eq("id", saleId).maybeSingle();
  if (!sale) return { ok: false, message: "Transação não encontrada." };

  const { error } = await db
    .from("sales")
    .update({
      status: refunded ? "refunded" : "approved",
      refunded_at: refunded ? new Date().toISOString() : null,
    })
    .eq("id", saleId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: refunded ? "venda.marcar_reembolso" : "venda.desfazer_reembolso",
    entityType: "venda", entityId: saleId, entityLabel: sale.email,
    before: { status: sale.status },
    after: { status: refunded ? "refunded" : "approved" },
  });
  revalidatePath("/admin/receita/transacoes");
  revalidatePath("/admin/receita/reembolsos");
  return { ok: true, message: refunded ? "Marcada como reembolsada. Lembre de revogar o acesso, se for o caso." : "Reembolso desfeito — de volta para aprovada." };
}

/* ---------- ações em massa ---------- */

export async function bulkSalesAction(
  actionId: string,
  payload: { ids: string[]; allFiltered: boolean; queryString: string }
): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const ids = payload.ids.slice(0, 1000);
  if (!ids.length) return { ok: false, message: "Nada selecionado." };

  if (actionId === "marcar_teste" || actionId === "desmarcar_teste") {
    const isTest = actionId === "marcar_teste";
    const { error } = await db.from("sales").update({ is_test: isTest }).in("id", ids);
    if (error) return { ok: false, message: error.message };
    await logAudit({
      actorId: profile.user_id, actorEmail: profile.email ?? null,
      action: `venda.bulk_${actionId}`, entityType: "venda",
      entityLabel: `${ids.length} transações`, after: { ids, is_test: isTest },
    });
    return {
      ok: true,
      message: isTest
        ? `${ids.length} transações marcadas como TESTE — fora de todas as métricas.`
        : `${ids.length} transações voltaram a contar nas métricas.`,
    };
  }

  return { ok: false, message: "Ação desconhecida." };
}

/* ---------- export CSV ---------- */

export async function csvSalesAction(queryString: string) {
  await requireAdmin();
  const params = paramsFromQueryString(queryString, { sort: "created_at.desc" });
  const { rows } = await fetchSales(params);

  const content = toCsv(
    ["Data", "Nome", "E-mail", "Valor (R$)", "Taxa (R$)", "Líquido (R$)", "Status", "Método", "Produto/Oferta", "Origem", "Teste"],
    rows.map((r) => [
      new Date(r.created_at).toLocaleString("pt-BR"),
      r.name, r.email,
      (r.amount_cents / 100).toFixed(2).replace(".", ","),
      (r.gateway_fee_cents / 100).toFixed(2).replace(".", ","),
      ((r.amount_cents - r.gateway_fee_cents) / 100).toFixed(2).replace(".", ","),
      r.status, r.payment_method, r.offer_name,
      r.cakto_id ? `cakto:${r.cakto_id}` : "manual",
      r.is_test ? "sim" : "não",
    ])
  );
  return { filename: `transacoes-${new Date().toISOString().slice(0, 10)}.csv`, content };
}

/* ---------- venda manual ---------- */

export async function createManualSaleAction2(input: {
  email: string;
  name: string;
  amount: string;
  paymentMethod: string;
  entitlement: string;
  feePercent?: number;
}): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();

  const email = input.email.trim().toLowerCase();
  const amountCents = Math.round(parseFloat(input.amount.replace(",", ".")) * 100);
  if (!email || !email.includes("@")) return { ok: false, message: "Informe um e-mail válido." };
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { ok: false, message: "Informe um valor de venda válido." };
  if (!ALL_ENTITLEMENT_KEYS.includes(input.entitlement)) return { ok: false, message: "Produto inválido." };

  const { data: existing } = await db.from("users_profile").select("user_id, name").ilike("email", email).maybeSingle();
  let userId = existing?.user_id;
  let createdAccount = false;

  if (!userId) {
    /* Senha interna aleatória: a conta não nasce sem senha, mas ninguém
     * conhece esta — nem ela sai daqui. O aluno define a dele pelo link do
     * e-mail de acesso, igual ao fluxo do webhook da Cakto. */
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "estilo-";
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    for (const b of bytes) password += alphabet[b % alphabet.length];

    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: input.name || "Aluno" },
    });
    if (createError || !created.user) {
      return { ok: false, message: `Erro ao criar a conta: ${createError?.message}` };
    }
    userId = created.user.id;
    createdAccount = true;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.com.br").replace(/\/$/, "");
    const { data: link } = await db.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/nova-senha` },
    });
    const linkAcesso = link?.properties?.action_link;

    if (linkAcesso) {
      const msg = emailAcessoLiberado({ nome: input.name || "aluno", email, linkAcesso, siteUrl });
      // Mesmo registro de idempotência do webhook: se a mesma pessoa entrar
      // por uma venda manual e por uma venda da Cakto, sai um e-mail só.
      const envio = await enviarEmailRegistrado(
        db,
        { chave: chaveAcesso(userId), tipo: "acesso", userId },
        { para: email, assunto: msg.assunto, html: msg.html, texto: msg.texto }
      );
      if (!envio.enviado) {
        console.error("[venda manual] e-mail de acesso não saiu:", envio.motivo);
      }
    }
  }

  const feeCents = input.feePercent ? Math.round((amountCents * input.feePercent) / 100) : 0;

  const { data: sale, error: saleError } = await db
    .from("sales")
    .insert({
      user_id: userId,
      email,
      name: input.name || existing?.name || "Aluno",
      amount_cents: amountCents,
      gateway_fee_cents: feeCents,
      status: "approved",
      payment_method: input.paymentMethod || "manual",
      entitlement: input.entitlement,
      offer_name: input.entitlement === "base" ? "MPO (venda manual)" : `Venda manual: ${input.entitlement}`,
    })
    .select("id")
    .single();
  if (saleError) return { ok: false, message: `Erro ao registrar a venda: ${saleError.message}` };

  const { error: entError } = await db
    .from("user_entitlements")
    .upsert(
      { user_id: userId, entitlement: input.entitlement, source: "admin:manual_sale" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );
  if (entError) return { ok: false, message: `Venda registrada, mas houve erro ao liberar o acesso: ${entError.message}` };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "venda.manual", entityType: "venda", entityId: sale.id, entityLabel: email,
    after: { email, amountCents, entitlement: input.entitlement, createdAccount },
  });

  revalidatePath("/admin/receita/transacoes");
  revalidatePath("/admin/alunos");
  revalidatePath("/admin");
  return {
    ok: true,
    message: createdAccount
      ? "Venda lançada, conta criada e e-mail de acesso enviado."
      : "Venda lançada e acesso liberado.",
  };
}

/* ---------- mapa de produtos Cakto ---------- */

export async function upsertProductMapAction(input: {
  caktoId: string;
  entitlement: string;
  label: string;
  validityDays: string;
  precoReais?: string;
}): Promise<Result> {
  const { profile } = await requireAdmin();
  // Aceita a URL inteira do painel da Cakto colada por engano — o ID é a
  // última parte dela, e é isso que a maioria das pessoas copia.
  const caktoId = input.caktoId.trim().replace(/^.*\/dashboard\/products\//, "").replace(/[/?#].*$/, "");
  const entitlement = input.entitlement.trim();
  const isTokens = /^tokens[-:_]?\d+$/i.test(entitlement);
  if (!caktoId) return { ok: false, message: "Informe o ID do produto na Cakto." };
  if (!ALL_ENTITLEMENT_KEYS.includes(entitlement) && !isTokens) {
    return { ok: false, message: "Escolha um produto/bônus válido (ou tokens-N)." };
  }
  const validityDays = input.validityDays ? parseInt(input.validityDays, 10) : null;

  // "197", "197,00" e "197.00" viram 19700 centavos.
  const precoLimpo = (input.precoReais ?? "").trim().replace(/\./g, "").replace(",", ".");
  const precoCents = precoLimpo ? Math.round(parseFloat(precoLimpo) * 100) : null;

  const db = createAdminClient();
  const { error } = await db.from("cakto_product_map").upsert({
    cakto_id: caktoId,
    entitlement,
    label: input.label.trim() || null,
    validity_days: Number.isFinite(validityDays) ? validityDays : null,
    expected_amount_cents: Number.isFinite(precoCents) ? precoCents : null,
  });
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "produto.mapear", entityType: "produto", entityId: caktoId,
    entityLabel: input.label || entitlement, after: input,
  });
  revalidatePath("/admin/receita/produtos");
  return { ok: true, message: "Mapeamento salvo." };
}

export async function deleteProductMapAction(caktoId: string): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { data: before } = await db.from("cakto_product_map").select("*").eq("cakto_id", caktoId).maybeSingle();
  const { error } = await db.from("cakto_product_map").delete().eq("cakto_id", caktoId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "produto.remover_mapa", entityType: "produto", entityId: caktoId,
    entityLabel: before?.label ?? caktoId, before,
  });
  revalidatePath("/admin/receita/produtos");
  return { ok: true, message: "Mapeamento removido." };
}

/* ---------- acessos (entitlements) ---------- */

export async function extendEntitlementAction(entId: string, days: number): Promise<Result> {
  const { profile } = await requireAdmin();
  const db = createAdminClient();
  const { data: ent } = await db.from("user_entitlements").select("id, user_id, entitlement, expires_at").eq("id", entId).maybeSingle();
  if (!ent) return { ok: false, message: "Acesso não encontrado." };

  const base = ent.expires_at && new Date(ent.expires_at) > new Date() ? new Date(ent.expires_at) : new Date();
  base.setDate(base.getDate() + days);

  const { error } = await db.from("user_entitlements").update({ expires_at: base.toISOString() }).eq("id", entId);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: profile.user_id, actorEmail: profile.email ?? null,
    action: "acesso.estender", entityType: "acesso", entityId: entId,
    entityLabel: ent.entitlement, before: { expires_at: ent.expires_at },
    after: { expires_at: base.toISOString(), days },
  });
  revalidatePath("/admin/receita/acessos");
  return { ok: true, message: `Acesso estendido por ${days} dias (até ${base.toLocaleDateString("pt-BR")}).` };
}
