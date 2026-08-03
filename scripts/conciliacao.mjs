/**
 * Conciliação do funil: compara o que a Cakto vendeu com o que o MPO liberou.
 *
 *   node scripts/conciliacao.mjs                 # relatório na tela
 *   node scripts/conciliacao.mjs --json          # saída para máquina
 *   node scripts/conciliacao.mjs --incluir-teste # inclui linhas is_test
 *
 * SÓ LÊ. Nunca corrige nada sozinho — uma correção automática errada aqui
 * ou tira o acesso de quem pagou, ou libera de graça. O relatório aponta o
 * problema e você decide em /admin/alunos.
 *
 * Rode antes de cada lançamento e depois, uma vez por semana.
 */
import fs from "node:fs";
import path from "node:path";

const JSON_OUT = process.argv.includes("--json");
const INCLUIR_TESTE = process.argv.includes("--incluir-teste");

const raiz = path.resolve(import.meta.dirname, "..");
const arquivoEnv = [".env.local", ".env"].map((f) => path.join(raiz, f)).find((f) => fs.existsSync(f));

const env = { ...process.env };
if (arquivoEnv) {
  for (const linha of fs.readFileSync(arquivoEnv, "utf8").split("\n")) {
    if (!linha.includes("=") || linha.trimStart().startsWith("#")) continue;
    const i = linha.indexOf("=");
    const chave = linha.slice(0, i).trim();
    if (!env[chave]) env[chave] = linha.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).");
  process.exit(1);
}

async function ler(caminho) {
  const res = await fetch(`${URL_}/rest/v1/${caminho}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${caminho}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** E-mail mascarado — o relatório pode ser colado num chat sem vazar base. */
const masc = (e) => (e ? String(e).replace(/^(.{1,3})[^@]*(@.*)$/, "$1***$2") : "—");
const reais = (c) => `R$ ${((c ?? 0) / 100).toFixed(2)}`;
const agora = new Date();

const filtroTeste = INCLUIR_TESTE ? "" : "&is_test=eq.false";

const [vendas, perfis, acessos, eventos, assinaturas, emails] = await Promise.all([
  ler(`sales?select=id,email,user_id,status,amount_cents,entitlement,cakto_id,created_at,refunded_at,is_test${filtroTeste}&order=created_at.desc`),
  ler(`users_profile?select=user_id,email,name,is_admin,created_at`),
  ler(`user_entitlements?select=user_id,entitlement,expires_at,source`),
  ler(`webhook_events?select=event_id,event_type,status,user_email,error_message,created_at&order=created_at.desc&limit=500`),
  ler(`subscriptions?select=id,email,user_id,plan,status,next_charge_at,canceled_at`),
  ler(`email_sends?select=chave,tipo,email,status,tentativas,error_message`),
]);

const porUsuario = new Map();
for (const a of acessos) {
  if (!porUsuario.has(a.user_id)) porUsuario.set(a.user_id, []);
  porUsuario.get(a.user_id).push(a);
}
const perfilPorId = new Map(perfis.map((p) => [p.user_id, p]));
const perfilPorEmail = new Map(perfis.map((p) => [String(p.email ?? "").toLowerCase(), p]));

const temBaseAtivo = (userId) =>
  (porUsuario.get(userId) ?? []).some(
    (e) => e.entitlement === "base" && (!e.expires_at || new Date(e.expires_at) > agora)
  );

const achados = [];
const anotar = (gravidade, tipo, detalhe, acao) => achados.push({ gravidade, tipo, detalhe, acao });

// ── 1. pagou e não tem conta ───────────────────────────────────────
for (const v of vendas.filter((v) => v.status === "approved")) {
  const perfil = v.user_id ? perfilPorId.get(v.user_id) : perfilPorEmail.get(String(v.email).toLowerCase());
  if (!perfil) {
    anotar("CRITICO", "pagamento aprovado sem conta",
      `${masc(v.email)} · ${reais(v.amount_cents)} · ${v.created_at?.slice(0, 10)} · cakto ${v.cakto_id ?? "—"}`,
      "crie a conta em /admin/alunos e libere o acesso");
  }
}

// ── 2. pagou, tem conta, mas está sem acesso ───────────────────────
for (const v of vendas.filter((v) => v.status === "approved" && v.user_id)) {
  // Compra de bônus avulso não obriga acesso base.
  if (v.entitlement && v.entitlement !== "base") continue;
  const quinzeMin = new Date(v.created_at).getTime() < agora.getTime() - 15 * 60_000;
  if (quinzeMin && !temBaseAtivo(v.user_id)) {
    anotar("CRITICO", "pagamento aprovado sem acesso liberado",
      `${masc(v.email)} · ${reais(v.amount_cents)} · ${v.created_at?.slice(0, 10)}`,
      "libere em /admin/alunos ou reprocesse o evento em /admin/sistema/webhooks");
  }
}

// ── 3. reembolsado que continua com acesso ─────────────────────────
for (const v of vendas.filter((v) => v.status === "refunded" && v.user_id)) {
  if (temBaseAtivo(v.user_id)) {
    // Só é problema se não houver OUTRA compra aprovada sustentando o acesso.
    const outraAprovada = vendas.some(
      (o) => o.user_id === v.user_id && o.status === "approved" && new Date(o.created_at) > new Date(v.refunded_at ?? v.created_at)
    );
    if (!outraAprovada) {
      anotar("CRITICO", "usuário ativo APÓS reembolso",
        `${masc(v.email)} · reembolsado em ${String(v.refunded_at).slice(0, 10)} · ainda com acesso`,
        "revogue em /admin/alunos — é produto entregue sem pagamento");
    }
  }
}

// ── 4. acesso sem pagamento correspondente ─────────────────────────
const emailsComVenda = new Set(vendas.filter((v) => v.status === "approved").map((v) => String(v.email).toLowerCase()));
for (const [userId, lista] of porUsuario) {
  const perfil = perfilPorId.get(userId);
  if (!perfil || perfil.is_admin) continue; // admin é acesso interno, não venda
  const base = lista.find((e) => e.entitlement === "base");
  if (!base) continue;
  const ativo = !base.expires_at || new Date(base.expires_at) > agora;
  if (!ativo) continue;
  if (!emailsComVenda.has(String(perfil.email ?? "").toLowerCase())) {
    anotar("ATENCAO", "conta ativa sem pagamento correspondente",
      `${masc(perfil.email)} · origem "${base.source ?? "não informada"}" · vence ${base.expires_at?.slice(0, 10) ?? "nunca"}`,
      "confira se foi liberação manual sua (cortesia, suporte) — se não foi, investigue");
  }
}

// ── 5. usuário sem perfil / perfil sem usuário ─────────────────────
for (const [userId] of porUsuario) {
  if (!perfilPorId.get(userId)) {
    anotar("ATENCAO", "acesso liberado para usuário sem perfil",
      `user_id ${userId}`, "o perfil deveria nascer com a conta — confira o trigger em users_profile");
  }
}

// ── 6. e-mails duplicados (cliente duplicado) ──────────────────────
const contagem = new Map();
for (const p of perfis) {
  const e = String(p.email ?? "").toLowerCase();
  contagem.set(e, (contagem.get(e) ?? 0) + 1);
}
for (const [e, n] of contagem) {
  if (n > 1) anotar("CRITICO", "cliente duplicado", `${masc(e)} · ${n} contas`, "unifique em /admin/alunos");
}

// ── 7. webhooks não processados ────────────────────────────────────
for (const ev of eventos.filter((e) => e.status === "failed" || e.status === "pending")) {
  anotar(ev.status === "failed" ? "CRITICO" : "ATENCAO", `webhook ${ev.status}`,
    `${ev.event_type} · ${masc(ev.user_email)} · ${ev.created_at?.slice(0, 16)} · ${ev.error_message ?? "sem motivo"}`,
    "reprocesse em /admin/sistema/webhooks");
}

// ── 8. e-mail de acesso que não saiu ───────────────────────────────
for (const em of emails.filter((e) => e.status !== "enviado")) {
  anotar("CRITICO", "e-mail de acesso não entregue",
    `${masc(em.email)} · ${em.tipo} · ${em.tentativas}x · ${em.error_message ?? "sem motivo"}`,
    "reenvie em /admin/alunos — sem o link a pessoa não entra");
}

// ── 9. assinatura sem usuário / cancelada com acesso além do prazo ─
for (const s of assinaturas) {
  if (!s.user_id && !perfilPorEmail.get(String(s.email).toLowerCase())) {
    anotar("ATENCAO", "assinatura sem usuário", `${masc(s.email)} · ${s.plan}/${s.status}`,
      "confira se o e-mail da Cakto bate com o do cadastro");
  }
  /* Cancelada com acesso ainda de pé é o comportamento CORRETO (regra da
   * seção 6 de /reembolso). Só vira problema se o acesso não tiver prazo. */
  if (s.status === "cancelada" && s.user_id) {
    const base = (porUsuario.get(s.user_id) ?? []).find((e) => e.entitlement === "base");
    if (base && !base.expires_at) {
      anotar("CRITICO", "assinatura cancelada com acesso VITALÍCIO",
        `${masc(s.email)} · sem data de vencimento`,
        "defina a data de fim em /admin/alunos, senão o acesso nunca cai");
    }
  }
}

// ── 10. acesso vencendo ────────────────────────────────────────────
const vencendo = [...porUsuario.values()].flat().filter(
  (e) => e.entitlement === "base" && e.expires_at &&
    new Date(e.expires_at) > agora && new Date(e.expires_at) < new Date(agora.getTime() + 7 * 86400000)
);
if (vencendo.length) {
  anotar("INFO", "acessos vencendo em 7 dias", `${vencendo.length} aluno(s)`, "boa hora para mandar a renovação");
}

// ── saída ──────────────────────────────────────────────────────────
const ordem = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
achados.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);

const resumo = {
  em: agora.toISOString(),
  incluiTeste: INCLUIR_TESTE,
  base: {
    vendasAprovadas: vendas.filter((v) => v.status === "approved").length,
    vendasReembolsadas: vendas.filter((v) => v.status === "refunded").length,
    contas: perfis.length,
    acessosBaseAtivos: [...porUsuario.keys()].filter(temBaseAtivo).length,
    assinaturas: assinaturas.length,
    eventosRegistrados: eventos.length,
  },
  achados: {
    criticos: achados.filter((a) => a.gravidade === "CRITICO").length,
    atencao: achados.filter((a) => a.gravidade === "ATENCAO").length,
    info: achados.filter((a) => a.gravidade === "INFO").length,
  },
};

if (JSON_OUT) {
  console.log(JSON.stringify({ resumo, achados }, null, 2));
} else {
  console.log(`\n╔══ CONCILIAÇÃO CAKTO ↔ MPO · ${agora.toISOString().slice(0, 16).replace("T", " ")} ══╗\n`);
  console.log(`  vendas aprovadas ......... ${resumo.base.vendasAprovadas}`);
  console.log(`  vendas reembolsadas ...... ${resumo.base.vendasReembolsadas}`);
  console.log(`  contas ................... ${resumo.base.contas}`);
  console.log(`  acessos ativos ao MPO .... ${resumo.base.acessosBaseAtivos}`);
  console.log(`  assinaturas .............. ${resumo.base.assinaturas}`);
  console.log(`  eventos registrados ...... ${resumo.base.eventosRegistrados}`);
  if (!INCLUIR_TESTE) console.log(`  (linhas is_test estão fora — use --incluir-teste para vê-las)`);

  if (!achados.length) {
    console.log(`\n  ✅ nenhuma divergência encontrada.\n`);
  } else {
    let atual = null;
    for (const a of achados) {
      if (a.gravidade !== atual) {
        atual = a.gravidade;
        const icone = { CRITICO: "🔴", ATENCAO: "🟠", INFO: "🔵" }[atual];
        console.log(`\n  ${icone} ${atual}\n`);
      }
      console.log(`  · ${a.tipo}`);
      console.log(`    ${a.detalhe}`);
      console.log(`    → ${a.acao}\n`);
    }
  }
  console.log(`  ${resumo.achados.criticos} crítico(s) · ${resumo.achados.atencao} atenção · ${resumo.achados.info} informativo(s)\n`);
}

// Sai com código 1 quando existe algo crítico — dá para usar em cron/CI.
process.exit(resumo.achados.criticos > 0 ? 1 : 0);
