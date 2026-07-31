#!/usr/bin/env node
/**
 * Falha se algum segredo aparecer no bundle que vai para o navegador.
 *
 * Roda em duas camadas:
 *
 *  1. PADRÕES — procura formatos conhecidos de chave (sk-proj-, sb_secret_,
 *     re_, JWT...). Pega segredo de terceiro que ninguém cadastrou aqui.
 *  2. VALORES REAIS — quando as variáveis estão presentes no ambiente,
 *     procura o próprio valor do segredo dentro dos arquivos. Esta é a prova
 *     forte: não depende de adivinhar o formato da chave.
 *
 * Uso:  node scripts/check-secrets.mjs [diretório]
 * O padrão é .next — cobre /static (bundle do navegador) e o resto do output.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.argv[2] ?? ".next";

/* Diretórios do build que NÃO vão para o navegador. O código do servidor
 * legitimamente contém referências a segredos; alertar sobre eles seria só
 * ruído. O que importa é /static e qualquer coisa servida ao cliente. */
const IGNORAR = new Set([
  "cache",
  "server",
  "trace",
  "trace-build",
  "types",
  "diagnostics",
  /* Saída do `next dev`. Nunca é publicada, e em desenvolvimento o Next
   * empacota bibliotecas inteiras (o @supabase/auth-js tem a string
   * "service_role" no código dele) — o que gerava dezenas de alarmes falsos
   * sempre que o servidor de desenvolvimento estava aberto. */
  "dev",
]);

/** Segredos: se o NOME bater, o VALOR não pode aparecer no bundle. */
const NOMES_SECRETOS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CAKTO_WEBHOOK_SECRET",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "GMAIL_APP_PASSWORD",
  "UAZAPI_TOKEN",
  "CRON_SECRET",
  "SMTP_PASS",
  "SMTP_PASSWORD",
  "UAZAPI_WEBHOOK_SECRET",
];

const PADROES = [
  { nome: "service role / secret key do Supabase (novo formato)", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { nome: "chave da OpenAI", re: /sk-proj-[A-Za-z0-9_-]{20,}/ },
  { nome: "chave da Anthropic", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { nome: "chave do Resend", re: /\bre_[A-Za-z0-9]{20,}/ },
  { nome: "JWT (service_role antigo do Supabase)", re: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}/ },
  { nome: "nome de variável secreta embutido", re: /SUPABASE_SERVICE_ROLE_KEY|CAKTO_WEBHOOK_SECRET|GMAIL_APP_PASSWORD|UAZAPI_TOKEN|CRON_SECRET|SMTP_PASS(WORD)?|UAZAPI_WEBHOOK_SECRET/ },
  { nome: "menção a service_role", re: /service_role/ },
];

/** Carrega .env.local se existir, para o scan por valor rodar na máquina. */
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

/* Valores a procurar. Trechos curtos dão falso positivo, então só entram
 * segredos com 16+ caracteres, e procuramos um prefixo de 24 — o bastante
 * para ser único e o bastante para achar mesmo se o bundle quebrar a string. */
const valores = [];
for (const nome of NOMES_SECRETOS) {
  const v = env[nome];
  if (typeof v === "string" && v.length >= 16) {
    valores.push({ nome, agulha: v.slice(0, 24) });
  }
}

function arquivos(dir, base = dir) {
  const saida = [];
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return saida;
  }
  for (const e of entradas) {
    const caminho = join(dir, e);
    if (dir === base && IGNORAR.has(e)) continue;
    let st;
    try {
      st = statSync(caminho);
    } catch {
      continue;
    }
    if (st.isDirectory()) saida.push(...arquivos(caminho, base));
    else if (/\.(js|mjs|cjs|json|css|map|html|txt)$/.test(e)) saida.push(caminho);
  }
  return saida;
}

if (!existsSync(RAIZ)) {
  console.error(`✗ ${RAIZ} não existe. Rode o build antes (npm run build).`);
  process.exit(1);
}

const lista = arquivos(RAIZ);
const achados = [];

for (const arq of lista) {
  let texto;
  try {
    texto = readFileSync(arq, "utf8");
  } catch {
    continue;
  }

  for (const { nome, re } of PADROES) {
    const m = texto.match(re);
    if (m) {
      achados.push({
        arquivo: relative(process.cwd(), arq),
        tipo: `PADRÃO: ${nome}`,
        // Só um trecho mascarado vai para o log do CI.
        amostra: `${m[0].slice(0, 8)}…(${m[0].length} chars)`,
      });
    }
  }

  for (const { nome, agulha } of valores) {
    if (texto.includes(agulha)) {
      achados.push({
        arquivo: relative(process.cwd(), arq),
        tipo: `VALOR REAL de ${nome}`,
        amostra: "<não exibido>",
      });
    }
  }
}

console.log(`check:secrets — ${lista.length} arquivo(s) analisado(s) em ${RAIZ}/`);
console.log(
  `  scan por padrão: ${PADROES.length} regras · scan por valor real: ${valores.length} segredo(s) carregado(s)` +
    (valores.length === 0
      ? "\n  ⚠ nenhum segredo no ambiente — só o scan por padrão rodou (em CI, exporte os segredos para o scan forte)"
      : "")
);

if (achados.length === 0) {
  console.log("✓ nenhum segredo encontrado no bundle do navegador.");
  process.exit(0);
}

console.error(`\n✗ ${achados.length} ocorrência(s) de segredo no bundle:\n`);
for (const a of achados) {
  console.error(`  ${a.arquivo}\n    ${a.tipo} — ${a.amostra}`);
}
console.error(
  "\nUm segredo aqui está exposto a qualquer visitante do site.\n" +
    "Rotacione a chave envolvida e remova o import que a levou para o cliente.\n" +
    "Módulos com segredo devem começar com: import \"server-only\";"
);
process.exit(1);
