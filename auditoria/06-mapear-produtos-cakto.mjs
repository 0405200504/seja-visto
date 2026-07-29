#!/usr/bin/env node
/**
 * 06 — DESCOBRIR OS IDs DOS PRODUTOS NA CAKTO E MAPEAR NA PLATAFORMA
 *
 * O webhook precisa traduzir "ID do produto na Cakto" → "acesso na plataforma".
 * Sem esse mapa, a compra chega e o sistema não sabe o que liberar.
 *
 * COMO USAR
 *
 * 1. Gere as credenciais de API em:
 *      https://app.cakto.com.br/dashboard/cakto-api
 *    Guarde o client_secret — a Cakto mostra ele UMA vez só.
 *
 * 2. Rode listando o que existe (não escreve nada em lugar nenhum):
 *      CAKTO_CLIENT_ID=xxx CAKTO_CLIENT_SECRET=yyy \
 *      node auditoria/06-mapear-produtos-cakto.mjs
 *
 * 3. Edite o bloco MAPA lá embaixo, ligando cada ID ao acesso certo.
 *
 * 4. Rode de novo com --aplicar para gravar no banco:
 *      CAKTO_CLIENT_ID=xxx CAKTO_CLIENT_SECRET=yyy \
 *      SUPABASE_URL=https://xxx.supabase.co \
 *      SUPABASE_SERVICE_ROLE_KEY=yyy \
 *      node auditoria/06-mapear-produtos-cakto.mjs --aplicar
 *
 * ⚠️  NÃO passe as credenciais como texto em chat nem as comite. Elas dão
 *     acesso à sua conta de pagamentos.
 */

const APLICAR = process.argv.includes("--aplicar");

const CAKTO_API = "https://api.cakto.com.br/public_api";

/* ------------------------------------------------------------------ *
 * MAPA — preencha depois de ver a lista que o script imprime.
 *
 * A chave é o ID do produto na Cakto (o UUID que aparece na listagem).
 * O valor é o acesso que aquele produto libera na plataforma.
 *
 * Chaves válidas de acesso:
 *   base                     → o produto principal (MPO)
 *   economize-58             → pacote "compre tudo", libera base + todos os bônus
 *   guarda-roupa-funcional   corte-ideal-rosto      mala-10x-mais-rapido
 *   vista-se-como-artista    bonito-nas-fotos       circulo-cromatico
 *   grupo-whatsapp           comprar-pela-internet  tendencias-do-ano
 *   tokens-50 / tokens-200   → pacotes de imagem do Fit Check
 * ------------------------------------------------------------------ */
const MAPA = {
  // "cd287b31-d4b7-4e94-858a-66e05ce2f4a2": {
  //   entitlement: "base",
  //   label: "Manual Prático do Outfit",
  //   validity_days: null,        // null = vitalício · 30 · 365
  //   expected_amount_cents: 19700, // preço esperado, para conferência
  // },
};

/* ------------------------------------------------------------------ */

const cor = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  aviso: (s) => `\x1b[33m${s}\x1b[0m`,
  erro: (s) => `\x1b[31m${s}\x1b[0m`,
  fraco: (s) => `\x1b[90m${s}\x1b[0m`,
  forte: (s) => `\x1b[1m${s}\x1b[0m`,
};

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.error(cor.erro(`\nFalta a variável ${nome}.`));
    console.error(cor.fraco("Veja as instruções no topo deste arquivo.\n"));
    process.exit(1);
  }
  return v;
}

async function pegarToken() {
  const corpo = new URLSearchParams({
    client_id: exigir("CAKTO_CLIENT_ID"),
    client_secret: exigir("CAKTO_CLIENT_SECRET"),
  });

  const res = await fetch(`${CAKTO_API}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo,
  });

  if (!res.ok) {
    const detalhe = await res.text();
    throw new Error(
      `A Cakto recusou as credenciais (HTTP ${res.status}).\n` +
        `Confira o client_id e o client_secret em app.cakto.com.br/dashboard/cakto-api\n` +
        detalhe.slice(0, 300)
    );
  }

  const json = await res.json();
  const token = json.access_token ?? json.token;
  if (!token) throw new Error(`Resposta sem token: ${JSON.stringify(json).slice(0, 200)}`);
  return token;
}

async function listarProdutos(token) {
  const produtos = [];
  let url = `${CAKTO_API}/products/`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Falha ao listar produtos (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const json = await res.json();
    produtos.push(...(json.results ?? (Array.isArray(json) ? json : [])));
    url = json.next ?? null;
  }
  return produtos;
}

/** Detalhe de um produto: é aqui que costumam vir as ofertas / order bumps. */
async function detalharProduto(token, id) {
  try {
    const res = await fetch(`${CAKTO_API}/products/${id}/`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function mapaAtual() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/cakto_product_map?select=cakto_id,entitlement,label`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return res.ok ? await res.json() : null;
}

async function gravarMapa(linhas) {
  const url = exigir("SUPABASE_URL");
  const key = exigir("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(`${url}/rest/v1/cakto_product_map?on_conflict=cakto_id`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(linhas),
  });

  if (!res.ok) throw new Error(`Falha ao gravar (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log(cor.forte("\n  Conectando na Cakto…"));
  const token = await pegarToken();
  console.log(cor.ok("  ✓ autenticado"));

  const produtos = await listarProdutos(token);
  console.log(cor.ok(`  ✓ ${produtos.length} produto(s) encontrado(s)\n`));

  const existente = await mapaAtual();
  const jaMapeado = new Map((existente ?? []).map((r) => [r.cakto_id, r.entitlement]));

  console.log(cor.forte("  ─────────────────────────────────────────────────────────"));
  console.log(cor.forte("  SEUS PRODUTOS NA CAKTO"));
  console.log(cor.forte("  ─────────────────────────────────────────────────────────\n"));

  const ofertasVistas = [];

  for (const p of produtos) {
    const estado = jaMapeado.has(p.id)
      ? cor.ok(`já mapeado → ${jaMapeado.get(p.id)}`)
      : MAPA[p.id]
        ? cor.aviso(`no MAPA deste arquivo → ${MAPA[p.id].entitlement}`)
        : cor.erro("SEM MAPEAMENTO");

    console.log(`  ${cor.forte(p.name ?? "(sem nome)")}`);
    console.log(`    id:     ${cor.forte(p.id)}`);
    console.log(`    preço:  R$ ${Number(p.price ?? 0).toFixed(2)}   tipo: ${p.type ?? "?"}   status: ${p.status ?? "?"}`);
    console.log(`    estado: ${estado}`);

    const det = await detalharProduto(token, p.id);
    const ofertas = det?.offers ?? det?.ofertas ?? [];
    if (Array.isArray(ofertas) && ofertas.length) {
      console.log(cor.fraco(`    ofertas (order bumps) — cada uma pode chegar com id próprio:`));
      for (const o of ofertas) {
        console.log(cor.fraco(`      · ${o.id ?? "?"}  ${o.name ?? ""}  R$ ${Number(o.price ?? 0).toFixed(2)}`));
        ofertasVistas.push({ ...o, produto: p.name });
      }
    }
    console.log("");
  }

  const semMapa = produtos.filter((p) => !jaMapeado.has(p.id) && !MAPA[p.id]);

  if (semMapa.length) {
    console.log(cor.aviso("  ─────────────────────────────────────────────────────────"));
    console.log(cor.aviso(`  ${semMapa.length} produto(s) sem mapeamento`));
    console.log(cor.aviso("  ─────────────────────────────────────────────────────────\n"));
    console.log("  Cole isto no bloco MAPA deste arquivo e preencha o entitlement:\n");
    for (const p of semMapa) {
      console.log(`  "${p.id}": {`);
      console.log(`    entitlement: "",  // ← ${p.name}`);
      console.log(`    label: ${JSON.stringify(p.name ?? "")},`);
      console.log(`    validity_days: null,`);
      console.log(`    expected_amount_cents: ${Math.round(Number(p.price ?? 0) * 100)},`);
      console.log(`  },`);
    }
    console.log("");
  }

  if (!APLICAR) {
    console.log(cor.fraco("  Nada foi gravado. Rode com --aplicar depois de preencher o MAPA.\n"));
    return;
  }

  const linhas = Object.entries(MAPA)
    .filter(([, v]) => v.entitlement)
    .map(([cakto_id, v]) => ({
      cakto_id,
      entitlement: v.entitlement,
      label: v.label ?? null,
      validity_days: v.validity_days ?? null,
      expected_amount_cents: v.expected_amount_cents ?? null,
    }));

  if (!linhas.length) {
    console.log(cor.aviso("  O bloco MAPA está vazio — nada a gravar.\n"));
    return;
  }

  const gravadas = await gravarMapa(linhas);
  console.log(cor.ok(`  ✓ ${gravadas.length} mapeamento(s) gravado(s):\n`));
  for (const l of gravadas) {
    console.log(`    ${l.cakto_id} → ${cor.forte(l.entitlement)}  (${l.label ?? "sem rótulo"})`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(cor.erro(`\n  ${e.message}\n`));
  process.exit(1);
});
