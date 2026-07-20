import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STYLES, OCCASIONS } from "@/lib/constants";
import { GUIDES } from "@/lib/guides";

/**
 * Fit Check — análise de outfit por IA (OpenAI, gpt-4o-mini).
 *
 * Recebe uma foto (data URL, já redimensionada no navegador) e/ou uma
 * mensagem de texto + histórico curto da conversa. O prompt do sistema
 * carrega um resumo compacto das combinações do lookbook para a IA
 * citar looks reais da plataforma nas sugestões.
 */

const MODEL = "gpt-5.5";
// gpt-5.x usa parte do orçamento de saída para "raciocínio" interno — dar folga
const MAX_OUTPUT_TOKENS = 1500;
const DAILY_PHOTO_LIMIT = 10;
const DAILY_MESSAGE_LIMIT = 40;
// ~2,8 MB de data URL ≈ foto de 1024px em JPEG com folga
const MAX_IMAGE_CHARS = 2_800_000;

type HistoryItem = { role: "user" | "assistant"; content: string };

type LookRow = {
  title: string;
  style: string;
  occasion: string;
  pieces: { name?: string }[] | string[];
};

// Cache do resumo da plataforma por instância do servidor (renova a cada hora)
let digestCache: { text: string; at: number } | null = null;

async function getPlatformDigest(): Promise<string> {
  if (digestCache && Date.now() - digestCache.at < 60 * 60 * 1000) {
    return digestCache.text;
  }

  const admin = createAdminClient();
  const [{ data: looks }, { data: modules }] = await Promise.all([
    admin.from("looks").select("title, style, occasion, pieces").returns<LookRow[]>(),
    admin
      .from("modules")
      .select("title, lessons(title)")
      .order("order_index")
      .returns<{ title: string; lessons: { title: string }[] }[]>(),
  ]);

  const lookLines = (looks ?? []).map((look) => {
    const pieces = (look.pieces ?? [])
      .map((p) => (typeof p === "string" ? p : p?.name ?? ""))
      .filter(Boolean)
      .join(", ");
    const style = STYLES[look.style] ?? look.style;
    const occasion = OCCASIONS[look.occasion] ?? look.occasion;
    return `- "${look.title}" (${style}, ${occasion}): ${pieces}`;
  });

  const moduleLines = (modules ?? []).map(
    (m) => `- Módulo "${m.title}": ${(m.lessons ?? []).map((l) => l.title).join("; ")}`
  );

  const guideLines = GUIDES.map((g) => `- Guia "${g.title}": ${g.short}`);

  const text = [
    "COMBINAÇÕES DA PLATAFORMA (aba Combinações):",
    lookLines.join("\n"),
    "",
    "AULAS DO MÉTODO (aba Método):",
    moduleLines.join("\n"),
    "",
    "GUIAS (aba Guias):",
    guideLines.join("\n"),
  ].join("\n");

  digestCache = { text, at: Date.now() };
  return text;
}

function buildSystemPrompt(digest: string): string {
  return `Você é o Fit Check da plataforma vista-se — consultor de moda masculina que entende de street culture. Analisa fotos de outfits dos alunos e dá feedback direto.

TOM DE VOZ:
- Papo reto de quem entende, como se estivesse falando com o aluno pessoalmente. Português falado ("tá", "pra", "né"), frases curtas.
- NADA de cara de relatório corporativo ou laudo técnico: sem numeração "1. 2. 3.", sem "considere a possibilidade de", sem "recomenda-se". Fala "troca por", "tira o", "segura essa".
- Também NADA de tom bobo ou animação forçada: sem "arrasou", sem chuva de exclamação, sem forçar gíria de rua. O meio-termo é conversa direta e natural.
- Elogio específico vale mais que empolgação genérica.

VOCABULÁRIO:
- PROIBIDO usar a palavra "look" nas suas respostas — diga sempre "outfit" (ou "combinação"). Isso vale em qualquer contexto.
- Nomeie a peça pelo tecido que você VÊ na foto: jorts = shorts de tecido JEANS (denim), em geral mais longo e largo. Se a peça curta NÃO é jeans (cargo, moletom, nylon, alfaiataria, esportivo), chame de shorts ou bermuda — nunca de jorts. Olhe o tecido antes de nomear.
- Mesmo rigor com o resto: jeans reto ≠ baggy ≠ skinny; jaqueta ≠ blusão; tênis ≠ bota. Errar o nome da peça quebra a credibilidade.

QUANDO RECEBER UMA FOTO DE OUTFIT, primeiro DECIDA em silêncio: esse outfit precisa de algum ajuste REAL?

- Se NÃO precisa (peças conversam, proporção certa, paleta coerente): elogie os acertos específicos, diga claramente que não mexeria em nada e dê **Nota: 10/10**. É PROIBIDO inventar ponto de melhoria só pra preencher estrutura — outfit redondo recebe elogio e 10, ponto final.
- Se precisa, organize a resposta em três blocos, com esses títulos em negrito e texto corrido embaixo (sem numerar):
**O que tá funcionando** — os acertos, específicos (peça, cor, caimento, proporção).
**O que eu mudaria** — 1 a 3 sugestões concretas (o que trocar, adicionar ou tirar), faladas de forma natural. Só melhorias que mudariam o outfit de verdade.
**Nota: X/10** — generoso: faixa 7–10 na maioria dos casos, nunca abaixo de 6. Quase perfeito = 9.

USE A PLATAFORMA NAS RESPOSTAS (índice abaixo): quando fizer sentido, indique onde a pessoa aprofunda — uma combinação da aba Combinações (cite pelo título), uma aula do Método, um guia da aba Guias, ou as abas Estilos e Guarda-Roupa. Uma indicação por resposta basta; não force.

Se a foto não mostrar um outfit, peça uma foto do outfit (de preferência corpo inteiro, boa luz), sem enrolação.

Se for só pergunta de texto (sem foto), responda como consultor de estilo: curto e direto, baseado no conteúdo da plataforma quando aplicável.

Responda sempre em português do Brasil. Máximo ~200 palavras.

ÍNDICE DA PLATAFORMA:
${digest}`;
}

async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  kind: "photo" | "text"
): Promise<{ ok: boolean; message?: string }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("fit_check_logs")
    .select("kind")
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  // Tabela ainda não criada (migração pendente) — segue sem limite
  if (error) return { ok: true };

  const photos = data.filter((r) => r.kind === "photo").length;
  const total = data.length;

  if (kind === "photo" && photos >= DAILY_PHOTO_LIMIT) {
    return {
      ok: false,
      message: `Você já mandou ${DAILY_PHOTO_LIMIT} fits hoje. Volta amanhã que a gente analisa mais!`,
    };
  }
  if (total >= DAILY_MESSAGE_LIMIT) {
    return {
      ok: false,
      message: "Limite de mensagens de hoje atingido. Amanhã tem mais!",
    };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: {
    image?: string;
    thumb?: string;
    message?: string;
    history?: HistoryItem[];
    conversationId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : undefined;
  const thumb =
    typeof body.thumb === "string" && body.thumb.startsWith("data:image/") && body.thumb.length < 60_000
      ? body.thumb
      : undefined;
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "";
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  let conversationId = typeof body.conversationId === "string" ? body.conversationId : null;

  if (!image && !message.trim()) {
    return NextResponse.json({ error: "Envie uma foto ou uma mensagem." }, { status: 400 });
  }
  if (image && (!image.startsWith("data:image/") || image.length > MAX_IMAGE_CHARS)) {
    return NextResponse.json({ error: "Imagem inválida ou grande demais." }, { status: 400 });
  }

  const kind = image ? "photo" : "text";
  const limit = await checkRateLimit(supabase, user.id, kind);
  if (!limit.ok) {
    return NextResponse.json({ reply: limit.message, limited: true });
  }

  const digest = await getPlatformDigest();

  // Histórico antigo vai só como texto; a imagem entra apenas na mensagem atual
  const messages: object[] = [
    { role: "system", content: buildSystemPrompt(digest) },
    ...history.map((h) => ({
      role: h.role,
      content: String(h.content).slice(0, 1500),
    })),
    {
      role: "user",
      content: image
        ? [
            ...(message.trim() ? [{ type: "text", text: message }] : []),
            { type: "image_url", image_url: { url: image, detail: "auto" } },
          ]
        : message,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      reasoning_effort: "low",
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("OpenAI error:", response.status, detail.slice(0, 500));
    const friendly =
      response.status === 429
        ? "A IA tá sobrecarregada agora. Tenta de novo em alguns segundos."
        : "Deu ruim na análise. Tenta de novo em instantes.";
    return NextResponse.json({ error: friendly }, { status: 502 });
  }

  const result = await response.json();
  const raw: string = result?.choices?.[0]?.message?.content ?? "";
  // Garantia extra do vocabulário: o modelo às vezes deixa escapar "look"
  const reply = raw
    .replace(/\blooks\b/g, "outfits")
    .replace(/\bLooks\b/g, "Outfits")
    .replace(/\blook\b/g, "outfit")
    .replace(/\bLook\b/g, "Outfit");
  if (!reply) {
    return NextResponse.json({ error: "A IA não retornou resposta. Tenta de novo." }, { status: 502 });
  }

  const usage = result?.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? 0;

  // Registra o uso (incluindo o consumo de tokens)
  await supabase.from("fit_check_logs").insert({ 
    user_id: user.id, 
    kind,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens
  });

  // ---------- Persistência da conversa (histórico de 5) ----------
  if (!conversationId) {
    const title = (message.trim() || "Fit check").slice(0, 60);
    const { data: conv } = await supabase
      .from("fit_check_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single<{ id: string }>();
    conversationId = conv?.id ?? null;

    // Mantém só as 5 conversas mais recentes
    if (conversationId) {
      const { data: all } = await supabase
        .from("fit_check_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const excess = (all ?? []).slice(5).map((c) => c.id);
      if (excess.length > 0) {
        await supabase.from("fit_check_conversations").delete().in("id", excess);
      }
    }
  }

  if (conversationId) {
    await supabase.from("fit_check_messages").insert([
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: message.trim() || "Fit check!",
        thumb: image ? thumb ?? null : null,
      },
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: reply,
      },
    ]);
    await supabase
      .from("fit_check_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  return NextResponse.json({ reply, conversationId });
}
