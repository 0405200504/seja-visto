import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { BASE_ENTITLEMENT } from "@/lib/bonuses";

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

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let chars = "";
  for (const b of bytes) chars += PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length];
  return `estilo-${chars.slice(0, 4)}-${chars.slice(4)}`;
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

function welcomeEmail(name: string, email: string, password: string, siteUrl: string): string {
  const firstName = name.split(" ")[0] || "aluno";
  return emailLayout(
    `
    <h1 style="color:#f4f6f9;font-size:22px;margin:0 0 12px">Bem-vindo, ${firstName}! 🎉</h1>
    <p style="color:#8b96a8;font-size:14px;line-height:1.6;margin:0 0 20px">
      Sua compra foi aprovada e seu acesso à plataforma já está liberado.
      Guarde seus dados de login:
    </p>
    <div style="background:#121924;border:1px solid #1e2938;border-radius:12px;padding:16px 20px;margin-bottom:20px">
      <p style="color:#8b96a8;font-size:12px;margin:0 0 4px">E-mail</p>
      <p style="color:#f4f6f9;font-size:15px;font-weight:bold;margin:0 0 12px">${email}</p>
      <p style="color:#8b96a8;font-size:12px;margin:0 0 4px">Senha</p>
      <p style="color:#f4f6f9;font-size:15px;font-weight:bold;margin:0">${password}</p>
    </div>
    <a href="${siteUrl}/login" style="display:block;background:#2f6bff;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;border-radius:12px;padding:14px">
      Acessar a plataforma
    </a>
    <p style="color:#8b96a8;font-size:13px;line-height:1.6;margin:20px 0 0">
      Dica: você pode trocar sua senha a qualquer momento em Perfil → depois de entrar.
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
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação do secret (payload.secret, header ou query string)
  const url = new URL(request.url);
  const provided =
    (payload.secret as string) ??
    request.headers.get("x-cakto-secret") ??
    url.searchParams.get("secret");
  const expected = process.env.CAKTO_WEBHOOK_SECRET;

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
  }

  const event = String(payload.event ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const customer = (data.customer ?? {}) as Record<string, string>;

  const email = customer.email?.trim().toLowerCase();
  const name = customer.name?.trim() || "Aluno";

  if (!GRANT_EVENTS.has(event) && !REVOKE_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: event });
  }
  if (!email) {
    return NextResponse.json({ error: "E-mail do cliente ausente" }, { status: 400 });
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app";

  // Coleta todos os IDs de produto/oferta presentes no payload — cobre tanto
  // um evento por produto quanto a compra inteira (produto + order bumps) num
  // evento só, independente do nome do campo que a Cakto usar.
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
  for (const field of ["product", "offer", "products", "offers", "items", "order_bumps", "orderBumps"]) {
    collect(data[field]);
  }

  const { data: mappingRows } = await admin
    .from("cakto_product_map")
    .select("entitlement, label")
    .in("cakto_id", candidateIds.size ? [...candidateIds] : ["__none__"]);

  const mappings = mappingRows ?? [];
  const entitlements = mappings.length
    ? [...new Set(mappings.map((m) => m.entitlement))]
    : [BASE_ENTITLEMENT];

  /* ---------- Revogação (reembolso/chargeback) ---------- */
  if (REVOKE_EVENTS.has(event)) {
    const { data: profile } = await admin
      .from("users_profile")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();

    if (profile) {
      await admin
        .from("user_entitlements")
        .delete()
        .eq("user_id", profile.user_id)
        .in("entitlement", entitlements);
    }
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
  let password: string | null = null;

  if (!userId) {
    password = generatePassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: `Falha ao criar usuário: ${createError?.message}` },
        { status: 500 }
      );
    }
    userId = created.user.id;
    createdNow = true;
  }

  // Libera acesso base + tudo que foi comprado (produto e order bumps)
  const grants = Array.from(new Set([BASE_ENTITLEMENT, ...entitlements])).map((key) => ({
    user_id: userId,
    entitlement: key,
    source: `cakto:${[...candidateIds][0] ?? event}`,
  }));

  const { error: grantError } = await admin
    .from("user_entitlements")
    .upsert(grants, { onConflict: "user_id,entitlement", ignoreDuplicates: true });

  if (grantError) {
    return NextResponse.json(
      { error: `Falha ao liberar acesso: ${grantError.message}` },
      { status: 500 }
    );
  }

  // E-mail
  const bonusLabels = mappings
    .filter((m) => m.entitlement !== BASE_ENTITLEMENT)
    .map((m) => m.label ?? m.entitlement);

  let emailResult: { sent: boolean; reason?: string };
  if (createdNow && password) {
    emailResult = await sendEmail(
      email,
      "Seu acesso ao Manual Prático do Outfit chegou 🎉",
      welcomeEmail(name, email, password, siteUrl)
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

  return NextResponse.json({
    ok: true,
    user: userId,
    created: createdNow,
    granted: grants.map((g) => g.entitlement),
    email: emailResult,
  });
}
