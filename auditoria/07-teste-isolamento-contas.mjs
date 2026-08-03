#!/usr/bin/env node
/**
 * Teste de isolamento entre contas (Fase 5 da auditoria de segurança).
 *
 * Cria DUAS contas descartáveis (e-mails @exemplo-auditoria.invalid, nunca
 * entregáveis de verdade), dá acesso pago só para a Conta A, e tenta usar a
 * Conta B (sem assinatura) para ler, alterar ou apagar dado da Conta A —
 * por SELECT direto, UPDATE, DELETE, tentativa de auto-promoção a admin e
 * acesso a conteúdo pago sem ter pago.
 *
 * Roda contra o projeto Supabase configurado no .env.local. Não usa nem
 * toca em nenhuma conta ou dado real de cliente — cria e apaga tudo que usa.
 *
 * Uso: node auditoria/07-teste-isolamento-contas.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function carregarEnvLocal() {
  const extra = {};
  if (!existsSync(".env.local")) return extra;
  for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) extra[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return extra;
}
const env = { ...carregarEnvLocal(), ...process.env };

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltam variáveis do Supabase no .env.local. Abortando.");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

const sufixo = Math.random().toString(36).slice(2, 10);
const emailA = `auditoria-conta-a-${sufixo}@exemplo-auditoria.invalid`;
const emailB = `auditoria-conta-b-${sufixo}@exemplo-auditoria.invalid`;
const senha = `Aud1t0r!a-${sufixo}-${Date.now()}`;

const resultados = [];
function registrar(nome, ok, detalhe = "") {
  resultados.push({ nome, ok, detalhe });
  console.log(`  ${ok ? "✓ BLOQUEADO" : "✗ FALHOU (vazou!)"} — ${nome}${detalhe ? " — " + detalhe : ""}`);
}

let userA, userB, clientB;
const idsParaLimpar = { looks: [], wardrobe: [] };

async function main() {
  console.log(`Criando contas de teste descartáveis (sufixo ${sufixo})...`);

  const { data: createdA, error: errA } = await admin.auth.admin.createUser({
    email: emailA,
    password: senha,
    email_confirm: true,
    user_metadata: { name: "Auditoria Conta A" },
  });
  if (errA) throw new Error(`Falha ao criar Conta A: ${errA.message}`);
  userA = createdA.user;

  const { data: createdB, error: errB } = await admin.auth.admin.createUser({
    email: emailB,
    password: senha,
    email_confirm: true,
    user_metadata: { name: "Auditoria Conta B" },
  });
  if (errB) throw new Error(`Falha ao criar Conta B: ${errB.message}`);
  userB = createdB.user;

  console.log(`Conta A: ${userA.id.slice(0, 8)}… (terá acesso pago)`);
  console.log(`Conta B: ${userB.id.slice(0, 8)}… (SEM assinatura — a atacante)`);

  // Conta A recebe acesso pago (base).
  await admin.from("user_entitlements").insert({
    user_id: userA.id,
    entitlement: "base",
    source: "auditoria-teste",
    expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });

  // Dados privados da Conta A, um em cada tabela sensível.
  const lookId = "3bc90e60-4d1c-4074-badf-34a139601dfb";
  const wardrobeItemId = "d69b083f-dbee-40de-8be9-a74f764f38eb";
  const moduleId = "10000000-0000-4000-8000-000000000001";
  const lessonId = "f3b9103e-841f-4f53-b048-cef562ba70de";

  await admin.from("users_profile").update({ name: "Conta A (auditoria)" }).eq("user_id", userA.id);
  await admin.from("user_favorites").insert({ user_id: userA.id, look_id: lookId, kind: "favorite" });
  await admin.from("user_wardrobe").insert({ user_id: userA.id, wardrobe_item_id: wardrobeItemId, status: "tenho" });
  await admin.from("user_progress").insert({ user_id: userA.id, module_id: moduleId, lesson_id: lessonId, completed: true });
  await admin.from("action_plan_progress").insert({ user_id: userA.id, day: 1, completed: true, notes: "nota privada da conta A" });
  await admin.from("user_capsule").insert({ user_id: userA.id, tops: ["camiseta privada A", "", ""] });

  const { data: conv } = await admin
    .from("fit_check_conversations")
    .insert({ user_id: userA.id, title: "Conversa privada da Conta A" })
    .select("id")
    .single();
  await admin.from("fit_check_messages").insert({
    conversation_id: conv.id,
    user_id: userA.id,
    role: "user",
    content: "Mensagem privada de IA da Conta A",
  });

  const { data: fit, error: fitErr } = await admin
    .from("community_fits")
    .insert({ user_id: userA.id, image_path: `${userA.id}/teste-auditoria.jpg`, status: "pending", caption: "fit pendente da Conta A" })
    .select("id, image_path")
    .single();
  if (fitErr) throw new Error(`Falha ao criar fit de teste: ${fitErr.message}`);

  // Login como Conta B (sem assinatura) com um client que respeita RLS.
  clientB = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: loginErr } = await clientB.auth.signInWithPassword({ email: emailB, password: senha });
  if (loginErr) throw new Error(`Falha ao logar como Conta B: ${loginErr.message}`);

  console.log("\n--- Conta B (sem assinatura) tentando acessar dado da Conta A ---");

  // 1. Ler perfil da Conta A
  {
    const { data } = await clientB.from("users_profile").select("*").eq("user_id", userA.id);
    registrar("ler perfil da Conta A", (data ?? []).length === 0);
  }
  // 2. Ler favoritos da Conta A
  {
    const { data } = await clientB.from("user_favorites").select("*").eq("user_id", userA.id);
    registrar("ler favoritos da Conta A", (data ?? []).length === 0);
  }
  // 3. Ler guarda-roupa da Conta A
  {
    const { data } = await clientB.from("user_wardrobe").select("*").eq("user_id", userA.id);
    registrar("ler guarda-roupa da Conta A", (data ?? []).length === 0);
  }
  // 4. Ler progresso da Conta A
  {
    const { data } = await clientB.from("user_progress").select("*").eq("user_id", userA.id);
    registrar("ler progresso do Método da Conta A", (data ?? []).length === 0);
  }
  // 5. Ler plano de ação da Conta A
  {
    const { data } = await clientB.from("action_plan_progress").select("*").eq("user_id", userA.id);
    registrar("ler plano de ação da Conta A", (data ?? []).length === 0);
  }
  // 6. Ler cápsula da Conta A
  {
    const { data } = await clientB.from("user_capsule").select("*").eq("user_id", userA.id);
    registrar("ler cápsula de guarda-roupa da Conta A", (data ?? []).length === 0);
  }
  // 7. Ler conversas de IA da Conta A
  {
    const { data } = await clientB.from("fit_check_conversations").select("*").eq("user_id", userA.id);
    registrar("ler conversas de IA da Conta A", (data ?? []).length === 0);
  }
  // 8. Ler mensagens de IA da Conta A
  {
    const { data } = await clientB.from("fit_check_messages").select("*").eq("user_id", userA.id);
    registrar("ler mensagens de IA da Conta A", (data ?? []).length === 0);
  }
  // 9. Ler assinatura/entitlements da Conta A
  {
    const { data } = await clientB.from("user_entitlements").select("*").eq("user_id", userA.id);
    registrar("ler assinatura da Conta A", (data ?? []).length === 0);
  }
  // 10. Ler o fit PENDENTE (não aprovado) da Conta A
  {
    const { data } = await clientB.from("community_fits").select("*").eq("id", fit.id);
    registrar("ler fit ainda pendente de moderação da Conta A", (data ?? []).length === 0);
  }
  // 11. Alterar (UPDATE) dado da Conta A
  {
    const { data } = await clientB
      .from("user_wardrobe")
      .update({ status: "quero_comprar" })
      .eq("user_id", userA.id)
      .select();
    registrar("ALTERAR guarda-roupa da Conta A", (data ?? []).length === 0);
  }
  // 12. Apagar (DELETE) dado da Conta A
  {
    const { data } = await clientB.from("user_favorites").delete().eq("user_id", userA.id).select();
    registrar("APAGAR favoritos da Conta A", (data ?? []).length === 0);
  }
  // 13. Mass assignment: inserir um fit se passando pela Conta A
  {
    const { error } = await clientB
      .from("community_fits")
      .insert({ user_id: userA.id, image_path: `${userA.id}/forjado.jpg`, status: "approved" });
    registrar("criar registro se passando pela Conta A (mass assignment)", Boolean(error));
  }
  // 14. Auto-promoção a admin
  {
    const { error } = await clientB.from("users_profile").update({ is_admin: true }).eq("user_id", userB.id);
    registrar("auto-promoção a admin", Boolean(error));
  }
  // 15. Acessar tabela administrativa (vendas)
  {
    const { data } = await clientB.from("sales").select("*").limit(1);
    registrar("ler tabela de vendas (admin-only)", (data ?? []).length === 0);
  }
  // 16. Acessar configurações administrativas
  {
    const { data } = await clientB.from("app_settings").select("*").limit(1);
    registrar("ler configurações administrativas (admin-only)", (data ?? []).length === 0);
  }
  // 17. Acessar log de auditoria
  {
    const { data } = await clientB.from("audit_log").select("*").limit(1);
    registrar("ler log de auditoria (admin-only)", (data ?? []).length === 0);
  }
  // 18. Conteúdo pago SEM assinatura: looks
  {
    const { data } = await clientB.from("looks").select("*").limit(1);
    registrar("ver combinações pagas sem assinatura", (data ?? []).length === 0);
  }
  // 19. Conteúdo pago sem assinatura: lessons
  {
    const { data } = await clientB.from("lessons").select("*").limit(1);
    registrar("ver aulas do Método sem assinatura", (data ?? []).length === 0);
  }
  // 20. Conteúdo pago sem assinatura: wardrobe_items
  {
    const { data } = await clientB.from("wardrobe_items").select("*").limit(1);
    registrar("ver peças do guarda-roupa sem assinatura", (data ?? []).length === 0);
  }
  // 21. Comentários/reações da comunidade sem assinatura (regressão da correção desta auditoria)
  {
    const { data } = await clientB.from("fit_comments").select("*").limit(1);
    registrar("ler comentários da comunidade sem assinatura", (data ?? []).length === 0);
  }
  {
    const { data } = await clientB.from("fit_reactions").select("*").limit(1);
    registrar("ler curtidas/salvamentos da comunidade sem assinatura", (data ?? []).length === 0);
  }
  // 22. Storage: ler a foto (pendente) da Conta A
  {
    const { data, error } = await clientB.storage.from("fits").createSignedUrl(fit.image_path, 60);
    registrar("gerar URL da foto pendente da Conta A no storage", !data?.signedUrl || Boolean(error));
  }
  // 23. Alterar entitlement próprio (fraude de assinatura)
  {
    const { error } = await clientB
      .from("user_entitlements")
      .insert({ user_id: userB.id, entitlement: "base", source: "auto-concedido" });
    registrar("conceder a si mesmo acesso pago sem pagar", Boolean(error));
  }

  const falhas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length} testes rodados, ${falhas.length} vazamento(s) encontrado(s).`);
  if (falhas.length > 0) {
    console.error("\n✗ VAZAMENTOS DE ISOLAMENTO ENTRE CONTAS:");
    for (const f of falhas) console.error(`   - ${f.nome}`);
  } else {
    console.log(`✓ Nenhum vazamento entre contas encontrado nos ${resultados.length} testes.`);
  }
}

async function limpar() {
  console.log("\nLimpando contas e dados de teste...");
  try {
    if (userA) {
      await admin.from("community_fits").delete().eq("user_id", userA.id);
      await admin.from("fit_check_conversations").delete().eq("user_id", userA.id);
      await admin.from("user_entitlements").delete().eq("user_id", userA.id);
      await admin.from("user_favorites").delete().eq("user_id", userA.id);
      await admin.from("user_wardrobe").delete().eq("user_id", userA.id);
      await admin.from("user_progress").delete().eq("user_id", userA.id);
      await admin.from("action_plan_progress").delete().eq("user_id", userA.id);
      await admin.from("user_capsule").delete().eq("user_id", userA.id);
      await admin.auth.admin.deleteUser(userA.id);
    }
    if (userB) {
      await admin.from("user_entitlements").delete().eq("user_id", userB.id);
      await admin.auth.admin.deleteUser(userB.id);
    }
    console.log("✓ Limpeza concluída — nenhum vestígio das contas de teste ficou no banco.");
  } catch (err) {
    console.error("⚠ Falha na limpeza automática — confira manualmente as contas com sufixo", sufixo, err);
  }
}

main()
  .catch((err) => {
    console.error("Erro no teste:", err);
    process.exitCode = 1;
  })
  .finally(limpar);
