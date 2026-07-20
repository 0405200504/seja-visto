"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import nodemailer from "nodemailer";
import { requireAdmin } from "@/lib/auth";
import { ALL_ENTITLEMENT_KEYS } from "@/lib/bonuses";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  OCCASIONS,
  STYLES,
  CLIMATES,
  LEVELS,
  BASE_COLORS,
  WARDROBE_CATEGORIES,
  PRIORITIES,
} from "@/lib/constants";

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function text(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v || null;
}

/* ---------- Looks ---------- */

export async function upsertLook(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    description: text(formData.get("description")),
    occasion: String(formData.get("occasion") ?? ""),
    style: String(formData.get("style") ?? ""),
    climate: String(formData.get("climate") ?? ""),
    level: String(formData.get("level") ?? ""),
    base_color: String(formData.get("base_color") ?? ""),
    image_url: text(formData.get("image_url")),
    pieces: lines(formData.get("pieces")),
    why_it_works: text(formData.get("why_it_works")),
    adaptations: lines(formData.get("adaptations")),
  };

  if (
    !payload.title ||
    !(payload.occasion in OCCASIONS) ||
    !(payload.style in STYLES) ||
    !(payload.climate in CLIMATES) ||
    !(payload.level in LEVELS) ||
    !(payload.base_color in BASE_COLORS)
  ) {
    throw new Error("Preencha todos os campos obrigatórios do look.");
  }

  const { error } = id
    ? await supabase.from("looks").update(payload).eq("id", id)
    : await supabase.from("looks").insert(payload);

  if (error) throw new Error(`Erro ao salvar look: ${error.message}`);

  revalidatePath("/combinacoes");
  revalidatePath("/admin/looks");
  redirect("/admin/looks");
}

export async function deleteLook(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("looks").delete().eq("id", String(formData.get("id")));
  revalidatePath("/combinacoes");
  revalidatePath("/admin/looks");
}

/* ---------- Módulos ---------- */

export async function upsertModule(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    description: text(formData.get("description")),
    order_index: Number(formData.get("order_index") ?? 0),
    cover_image_url: text(formData.get("cover_image_url")),
  };

  if (!payload.title) throw new Error("O módulo precisa de um título.");

  const { data, error } = id
    ? await supabase.from("modules").update(payload).eq("id", id).select("id").single()
    : await supabase.from("modules").insert(payload).select("id").single();

  if (error) throw new Error(`Erro ao salvar módulo: ${error.message}`);

  revalidatePath("/metodo");
  revalidatePath("/admin/modulos");
  redirect(`/admin/modulos/${data.id}`);
}

export async function deleteModule(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("modules").delete().eq("id", String(formData.get("id")));
  revalidatePath("/metodo");
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos");
}

/* ---------- Aulas ---------- */

export async function upsertLesson(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const moduleId = String(formData.get("module_id") ?? "");
  const payload = {
    module_id: moduleId,
    title: String(formData.get("title") ?? "").trim(),
    content: text(formData.get("content")),
    order_index: Number(formData.get("order_index") ?? 0),
  };

  if (!payload.title || !moduleId) throw new Error("A aula precisa de título e módulo.");

  const { error } = id
    ? await supabase.from("lessons").update(payload).eq("id", id)
    : await supabase.from("lessons").insert(payload);

  if (error) throw new Error(`Erro ao salvar aula: ${error.message}`);

  revalidatePath("/metodo");
  revalidatePath(`/admin/modulos/${moduleId}`);
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const moduleId = String(formData.get("module_id") ?? "");
  await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
  revalidatePath("/metodo");
  revalidatePath(`/admin/modulos/${moduleId}`);
}

/* ---------- Peças do guarda-roupa ---------- */

export async function upsertWardrobeItem(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = text(formData.get("id"));
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    description: text(formData.get("description")),
    how_to_use: text(formData.get("how_to_use")),
    image_url: text(formData.get("image_url")),
  };

  if (
    !payload.name ||
    !(payload.category in WARDROBE_CATEGORIES) ||
    !(payload.priority in PRIORITIES)
  ) {
    throw new Error("Preencha nome, categoria e prioridade da peça.");
  }

  const { error } = id
    ? await supabase.from("wardrobe_items").update(payload).eq("id", id)
    : await supabase.from("wardrobe_items").insert(payload);

  if (error) throw new Error(`Erro ao salvar peça: ${error.message}`);

  revalidatePath("/guarda-roupa");
  revalidatePath("/admin/pecas");
  redirect("/admin/pecas");
}

export async function deleteWardrobeItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("wardrobe_items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/guarda-roupa");
  revalidatePath("/admin/pecas");
}

/* ---------- Vendas (Cakto) ---------- */

export async function upsertCaktoMapping(formData: FormData) {
  const { supabase } = await requireAdmin();

  const caktoId = String(formData.get("cakto_id") ?? "").trim();
  const entitlement = String(formData.get("entitlement") ?? "").trim();
  const label = text(formData.get("label"));

  if (!caktoId || !ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Informe o ID do produto na Cakto e escolha um produto/bônus válido.");
  }

  const { error } = await supabase
    .from("cakto_product_map")
    .upsert({ cakto_id: caktoId, entitlement, label });

  if (error) throw new Error(`Erro ao salvar mapeamento: ${error.message}`);
  revalidatePath("/admin/vendas");
}

export async function deleteCaktoMapping(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("cakto_product_map")
    .delete()
    .eq("cakto_id", String(formData.get("cakto_id")));
  revalidatePath("/admin/vendas");
}

export async function grantEntitlementManually(formData: FormData) {
  const { supabase } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const entitlement = String(formData.get("entitlement") ?? "").trim();

  if (!email || !ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Informe o e-mail do aluno e escolha um produto/bônus válido.");
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) {
    throw new Error(`Nenhum aluno encontrado com o e-mail ${email}.`);
  }

  const { error } = await supabase
    .from("user_entitlements")
    .upsert(
      { user_id: profile.user_id, entitlement, source: "admin:manual" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );

  if (error) throw new Error(`Erro ao liberar acesso: ${error.message}`);
  revalidatePath("/admin/vendas");
}

/* ---------- Gerenciamento de Alunos ---------- */

export async function deleteStudentAction(userId: string) {
  await requireAdmin();
  
  // Como o usuário está em auth.users, precisamos usar a service_role
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Erro ao excluir aluno do sistema: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function grantStudentEntitlementAction(userId: string, entitlement: string) {
  const { supabase } = await requireAdmin();

  if (!ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Produto ou bônus inválido.");
  }

  const { error } = await supabase
    .from("user_entitlements")
    .upsert(
      { user_id: userId, entitlement, source: "admin:manual" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(`Erro ao liberar acesso: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function revokeStudentEntitlementAction(userId: string, entitlement: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("user_entitlements")
    .delete()
    .eq("user_id", userId)
    .eq("entitlement", entitlement);

  if (error) {
    throw new Error(`Erro ao revogar acesso: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

export async function toggleAdminStatusAction(userId: string, isAdmin: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("users_profile")
    .update({ is_admin: isAdmin })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Erro ao atualizar privilégios do usuário: ${error.message}`);
  }

  revalidatePath("/admin/alunos");
}

/* ---------- Rastreamento de Links ---------- */

export async function createTrackingLinkAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, ""); // limpa caracteres especiais
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();
  const description = text(formData.get("description"));

  if (!slug || !destinationUrl) {
    throw new Error("Slug e URL de destino são obrigatórios.");
  }

  // Verifica se o slug já existe
  const { data: existing } = await supabase
    .from("tracking_links")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    throw new Error(`O link com o slug "${slug}" já está cadastrado.`);
  }

  const { error } = await supabase
    .from("tracking_links")
    .insert({
      slug,
      destination_url: destinationUrl,
      description,
      clicks_count: 0
    });

  if (error) {
    throw new Error(`Erro ao criar link de rastreamento: ${error.message}`);
  }

  revalidatePath("/admin/links");
}

export async function deleteTrackingLinkAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) throw new Error("ID do link inválido.");

  const { error } = await supabase
    .from("tracking_links")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir link de rastreamento: ${error.message}`);
  }

  revalidatePath("/admin/links");
}

/* ---------- Lançamento Manual de Vendas (CRM) ---------- */

export async function createManualSaleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const adminClient = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "").replace(",", ".");
  const paymentMethod = String(formData.get("payment_method") ?? "manual").toLowerCase();
  const entitlement = String(formData.get("entitlement") ?? "base").trim();

  const amountCents = Math.round(parseFloat(rawAmount) * 100);

  if (!email || isNaN(amountCents) || amountCents <= 0) {
    throw new Error("Preencha o e-mail do aluno e um valor de venda válido.");
  }

  if (!ALL_ENTITLEMENT_KEYS.includes(entitlement)) {
    throw new Error("Bônus ou produto selecionado é inválido.");
  }

  // 1. Busca se o usuário já existe
  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("user_id, name")
    .ilike("email", email)
    .maybeSingle();

  let userId = existingProfile?.user_id;

  // 2. Se não existir, cria o usuário no Auth
  if (!userId) {
    const passwordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "estilo-";
    for (let i = 0; i < 8; i++) {
      password += passwordAlphabet[Math.floor(Math.random() * passwordAlphabet.length)];
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || "Aluno" }
    });

    if (createError || !created.user) {
      throw new Error(`Erro ao criar conta para novo aluno: ${createError?.message}`);
    }

    userId = created.user.id;

    // Enviar e-mail de acesso via Nodemailer se possível
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass }
        });
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app";
        await transporter.sendMail({
          from: process.env.EMAIL_FROM ?? `Manual Prático do Outfit <${gmailUser}>`,
          to: email,
          subject: "Bem-vindo ao Manual Prático do Outfit! 🎉",
          html: `
            <div style="background:#06080c;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
              <div style="max-width:520px;margin:0 auto;background:#0c111a;border:1px solid #1e2938;border-radius:16px;padding:32px">
                <h1 style="color:#f4f6f9;font-size:22px;margin:0 0 12px">Bem-vindo, ${name || "aluno"}! 🎉</h1>
                <p style="color:#8b96a8;font-size:14px;line-height:1.6;margin:0 0 20px">
                  Sua inscrição foi confirmada manualmente pelo administrador e seu acesso já está liberado.
                  Guarde seus dados de login:
                </p>
                <div style="background:#121924;border:1px solid #1e2938;border-radius:12px;padding:16px 20px;margin-bottom:20px">
                  <p style="color:#8b96a8;font-size:12px;margin:0 0 4px">E-mail</p>
                  <p style="color:#f4f6f9;font-size:15px;font-weight:bold;margin:0 0 12px">${email}</p>
                  <p style="color:#8b96a8;font-size:12px;margin:0 0 4px">Senha Provisória</p>
                  <p style="color:#f4f6f9;font-size:15px;font-weight:bold;margin:0">${password}</p>
                </div>
                <a href="${siteUrl}/login" style="display:block;background:#2f6bff;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;border-radius:12px;padding:14px">
                  Acessar a plataforma
                </a>
              </div>
            </div>`
        });
      } catch (err) {
        // ignora erro de envio do email
      }
    }
  }

  // 3. Registra a venda na tabela sales
  const { error: saleError } = await supabase
    .from("sales")
    .insert({
      user_id: userId,
      email,
      name: name || existingProfile?.name || "Aluno",
      amount_cents: amountCents,
      status: "approved",
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    });

  if (saleError) {
    throw new Error(`Erro ao salvar venda no CRM: ${saleError.message}`);
  }

  // 4. Concede o entitlement (acesso) correspondente
  const { error: entitlementError } = await supabase
    .from("user_entitlements")
    .upsert(
      { user_id: userId, entitlement, source: "admin:manual_sale" },
      { onConflict: "user_id,entitlement", ignoreDuplicates: true }
    );

  if (entitlementError) {
    throw new Error(`Erro ao liberar acesso do bônus/plano: ${entitlementError.message}`);
  }

  revalidatePath("/admin/vendas");
  revalidatePath("/admin/alunos");
  revalidatePath("/admin");
}

export async function getStudentConversationsAction(studentUserId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Busca conversas do aluno ordenadas pela atualização mais recente
  const { data: conversations, error: convError } = await admin
    .from("fit_check_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", studentUserId)
    .order("updated_at", { ascending: false });

  if (convError) {
    throw new Error(`Erro ao carregar conversas do aluno: ${convError.message}`);
  }

  // Busca as mensagens associadas a cada conversa
  const conversationsWithMessages = await Promise.all(
    (conversations ?? []).map(async (c) => {
      const { data: messages, error: msgError } = await admin
        .from("fit_check_messages")
        .select("id, role, content, thumb, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error(`Erro ao carregar mensagens da conversa ${c.id}:`, msgError);
      }

      return {
        ...c,
        messages: messages ?? [],
      };
    })
  );

  return conversationsWithMessages;
}

