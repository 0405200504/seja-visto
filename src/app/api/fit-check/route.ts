import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STYLES, OCCASIONS } from "@/lib/constants";

/**
 * Fit Check — análise de outfit por IA (OpenAI, gpt-4o-mini).
 *
 * Recebe uma foto (data URL, já redimensionada no navegador) e/ou uma
 * mensagem de texto + histórico curto da conversa. O prompt do sistema
 * carrega um resumo compacto das combinações do lookbook para a IA
 * citar looks reais da plataforma nas sugestões.
 */

const MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 500;
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

// Cache do resumo do lookbook por instância do servidor (renova a cada hora)
let lookbookCache: { text: string; at: number } | null = null;

async function getLookbookDigest(): Promise<string> {
  if (lookbookCache && Date.now() - lookbookCache.at < 60 * 60 * 1000) {
    return lookbookCache.text;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("looks")
    .select("title, style, occasion, pieces")
    .returns<LookRow[]>();

  const lines = (data ?? []).map((look) => {
    const pieces = (look.pieces ?? [])
      .map((p) => (typeof p === "string" ? p : p?.name ?? ""))
      .filter(Boolean)
      .join(", ");
    const style = STYLES[look.style] ?? look.style;
    const occasion = OCCASIONS[look.occasion] ?? look.occasion;
    return `- "${look.title}" (${style}, ${occasion}): ${pieces}`;
  });

  const text = lines.join("\n");
  lookbookCache = { text, at: Date.now() };
  return text;
}

function buildSystemPrompt(lookbook: string): string {
  return `Você é o Fit Check da plataforma vista-se — um consultor de moda masculina que vive a cultura de rua. Analisa fotos de outfits ("fits") dos alunos e dá feedback direto.

TOM DE VOZ:
- Linguagem descontraída, de quem entende de street culture. Pode usar gírias como "fit", "clean", "peça", "proporção", mas com naturalidade — nada forçado, nada de exagerar no slang, zero cringe.
- Fala como um amigo que manja: direto, encorajador, sem formalidade.

QUANDO RECEBER UMA FOTO DE FIT, responda SEMPRE nesta estrutura:
1. **O que tá funcionando** — comece pelos acertos (sempre existe algo bom).
2. **Pontos de melhoria** — 2 a 3 sugestões concretas: o que trocar, adicionar ou tirar (peça, cor, caimento, proporção). Seja específico.
3. **Nota: X/10** — seja GENEROSO. A nota serve pra motivar, não pra derrubar. Use a faixa 7–10 na maioria dos casos; nunca dê menos que 6. Fit bem resolvido merece 9 ou 10.

Quando fizer sentido, indique uma combinação real do lookbook da plataforma (lista abaixo) que conversa com o fit da pessoa ou com a sugestão que você deu — cite pelo título e diga que está na aba Combinações.

Se a foto não mostrar uma roupa/outfit, diga de boa que precisa de uma foto do fit (de preferência corpo inteiro, boa luz).

Se for só uma pergunta de texto (sem foto), responda como consultor de estilo, curto e direto.

Responda sempre em português do Brasil. Máximo ~250 palavras.

LOOKBOOK DA PLATAFORMA:
${lookbook}`;
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

  let body: { image?: string; message?: string; history?: HistoryItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : undefined;
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "";
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

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

  const lookbook = await getLookbookDigest();

  // Histórico antigo vai só como texto; a imagem entra apenas na mensagem atual
  const messages: object[] = [
    { role: "system", content: buildSystemPrompt(lookbook) },
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
      max_tokens: MAX_OUTPUT_TOKENS,
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
  const reply: string = result?.choices?.[0]?.message?.content ?? "";
  if (!reply) {
    return NextResponse.json({ error: "A IA não retornou resposta. Tenta de novo." }, { status: 502 });
  }

  // Registra o uso (ignora erro se a tabela ainda não existir)
  await supabase.from("fit_check_logs").insert({ user_id: user.id, kind });

  return NextResponse.json({ reply });
}
