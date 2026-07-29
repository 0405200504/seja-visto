"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  CircleCheck,
  Coins,
  History,
  Plus,
  Search,
  Send,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TOKENS_100_CHECKOUT_URL, TOKENS_25_CHECKOUT_URL } from "@/components/landing/checkout";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  image?: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

const MAX_EDGE = 768;
const THUMB_EDGE = 160;
const JPEG_QUALITY = 0.82;

const SUGGESTIONS = [
  "Como fico pra sair à noite?",
  "Isso combina com tênis branco?",
  "Me ajuda a combinar essa peça",
];

const THINKING_PHRASES = [
  "Olhando a foto…",
  "Avaliando cores e caimento…",
  "Comparando com o que combina…",
  "Fechando o veredito…",
];

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Arquivo de imagem inválido."));
    el.src = dataUrl;
  });
}

function drawScaled(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Redimensiona a foto no navegador: versão p/ análise (768px) e miniatura p/ histórico. */
async function resizeImage(file: File): Promise<{ full: string; thumb: string }> {
  const img = await fileToImage(file);
  return {
    full: drawScaled(img, MAX_EDGE, JPEG_QUALITY),
    thumb: drawScaled(img, THUMB_EDGE, 0.7),
  };
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "hoje";
  if (date.toDateString() === yesterday.toDateString()) return "ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Cabeçalhos de seção que a IA sempre usa (ver prompt do sistema em api/fit-check/route.ts). */
const SECTION_HEADERS: Record<string, { icon: typeof CircleCheck; tone: string }> = {
  "o que tá funcionando": { icon: CircleCheck, tone: "text-success" },
  "o que eu mudaria": { icon: Wand2, tone: "text-accent" },
};

function ScoreBadge({ score }: { score: string }) {
  const value = parseFloat(score.replace(",", "."));
  const isTop = Number.isFinite(value) && value >= 9;
  return (
    <div
      className={cn(
        "mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 first:mt-0",
        isTop ? "border-success/30 bg-success/10" : "border-accent/30 bg-accent-soft"
      )}
    >
      <Star className={cn("h-4 w-4", isTop ? "text-success" : "text-accent")} fill="currentColor" />
      <span className="text-sm font-semibold text-foreground">
        Nota <span className={cn("text-base font-bold", isTop ? "text-success" : "text-accent")}>{score}</span>/10
      </span>
    </div>
  );
}

function parseBoldParts(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={j}>{part}</span>
    )
  );
}

/** Renderiza a resposta da IA: cabeçalhos de seção com ícone, nota em destaque, **negrito** e parágrafos. */
function FormattedReply({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const stripped = trimmed.replace(/\*\*/g, "").trim();

        const scoreMatch = stripped.match(/^Nota:\s*(\d{1,2}(?:[.,]\d)?)\s*\/\s*10\b/i);
        if (scoreMatch) return <ScoreBadge key={i} score={scoreMatch[1]} />;

        // Títulos "Combinação 1 — vibe" do modo monta-comigo
        if (/^combina[çc][ãa]o\s*\d/i.test(stripped) && stripped.length < 70) {
          return (
            <p
              key={i}
              className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-accent first:mt-0"
            >
              <Shirt className="h-3.5 w-3.5" />
              {stripped.replace(/:$/, "")}
            </p>
          );
        }

        if (stripped.length < 60) {
          const headerKey = stripped.toLowerCase().replace(/:$/, "");
          const header = Object.entries(SECTION_HEADERS).find(([k]) => headerKey.startsWith(k));
          if (header) {
            const Icon = header[1].icon;
            return (
              <p
                key={i}
                className={cn("mt-3 flex items-center gap-1.5 text-[13px] font-semibold first:mt-0", header[1].tone)}
              >
                <Icon className="h-3.5 w-3.5" />
                {stripped.replace(/:$/, "")}
              </p>
            );
          }
        }

        // Citação da combinação-base da plataforma (modo monta-comigo)
        if (/^inspirada em\b/i.test(stripped)) {
          return (
            <p key={i} className="pl-1 text-xs italic leading-relaxed text-muted">
              {parseBoldParts(line.trim())}
            </p>
          );
        }

        // Itens de lista "- peça" (modo monta-comigo)
        const listMatch = trimmed.match(/^[-•]\s+(.*)/);
        if (listMatch) {
          return (
            <p key={i} className="flex items-start gap-2 pl-1 leading-relaxed">
              <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
              <span>{parseBoldParts(listMatch[1])}</span>
            </p>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            {parseBoldParts(line)}
          </p>
        );
      })}
    </div>
  );
}

function AssistantAvatar({ thinking = false }: { thinking?: boolean }) {
  return (
    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
      {thinking && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </span>
    </div>
  );
}

/** Bolha de "pensando": pontinhos animados + frases alternando, pra dar a sensação de raciocínio real. */
function ThinkingBubble() {
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhrase((p) => (p + 1) % THINKING_PHRASES.length), 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-end justify-start gap-2">
      <AssistantAvatar thinking />
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
        </span>
        <span key={phrase} className="animate-fade-up">
          {THINKING_PHRASES[phrase]}
        </span>
      </div>
    </div>
  );
}

export function FitCheckChat() {
  const searchParams = useSearchParams();
  const simularTokens = searchParams.get("simular_tokens") === "true";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{ full: string; thumb: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [buyStep, setBuyStep] = useState<0 | 1 | 2>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("fit_check_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) ?? []);
  }, []);

  const loadCredits = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("fit_check_credits")
      .select("balance, expires_at")
      .maybeSingle<{ balance: number; expires_at: string | null }>();

    if (data) {
      const expiry = data.expires_at ? new Date(data.expires_at) : null;
      if (expiry && expiry < new Date()) {
        setCredits(0);
      } else {
        setCredits(data.balance);
      }
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadCredits();
  }, [loadConversations, loadCredits]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("simular_tokens") === "true") {
        setCredits(0);
        setBuyStep(1);
      }
    }
  }, []);

  async function deleteConversation(id: string) {
    if (!window.confirm("Excluir esta conversa? Isso não tem como desfazer.")) return;
    const supabase = createClient();
    await supabase.from("fit_check_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) newChat();
  }

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  function newChat() {
    setMessages([]);
    setConversationId(null);
    setPendingImage(null);
    setInput("");
    setError(null);
    setShowHistory(false);
  }

  async function openConversation(id: string) {
    setShowHistory(false);
    setError(null);
    const supabase = createClient();
    const { data } = await supabase
      .from("fit_check_messages")
      .select("role, content, thumb")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setConversationId(id);
    setMessages(
      ((data as { role: "user" | "assistant"; content: string; thumb: string | null }[]) ?? []).map(
        (m) => ({ role: m.role, content: m.content, image: m.thumb ?? undefined })
      )
    );
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Manda uma imagem (JPG, PNG…).");
      return;
    }
    setError(null);
    try {
      setPendingImage(await resizeImage(file));
    } catch {
      setError("Não consegui ler essa imagem. Tenta outra.");
    }
  }

  function fillSuggestion(text: string) {
    setInput(text);
    textareaRef.current?.focus();
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;

    const image = pendingImage;

    // Sem tokens e tentando mandar foto: abre o popup de compra direto.
    if (image && credits !== null && credits <= 0) {
      setBuyStep(1);
      return;
    }
    const userMessage: ChatMessage = {
      role: "user",
      content: text || "Fit check!",
      image: image?.thumb,
    };

    // O histórico não é mais enviado daqui: o servidor o reconstrói a partir
    // do banco, pelo conversationId. Histórico vindo do navegador podia ser
    // forjado para reescrever o papel do modelo.
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/fit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image: image?.full,
          thumb: image?.thumb,
          conversationId,
        }),
      });
      const data = await res.json();
      // Tokens de imagem acabaram: devolve o que a pessoa mandou e abre o popup.
      if (data?.needTokens) {
        setCredits(0);
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        setPendingImage(image);
        setBuyStep(1);
        return;
      }
      if (data?.semAcesso) {
        setMessages((prev) => prev.slice(0, -1));
        setError("O Fit Check faz parte do acesso à plataforma. Renove para continuar usando.");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Erro na análise.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (typeof data.credits === "number") setCredits(data.credits);
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deu ruim. Tenta de novo.");
      // Devolve a mensagem pro campo pra pessoa não perder o que digitou
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
      setPendingImage(image);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-[calc(100dvh-8rem)] min-h-[28rem] flex-col lg:h-[calc(100dvh-6rem)]">
      {/* Ambiência: glow suave no topo, sutil o bastante pra não competir com o conteúdo */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[110px]" />

      {/* Barra do topo: minimalista, sem caixa — só os controles */}
      <div className="relative z-30 mx-auto flex w-full max-w-2xl items-center justify-between gap-2 pb-4">
        <button
          type="button"
          onClick={newChat}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo chat
        </button>
        <div className="flex items-center gap-1.5">
          {credits !== null && (
            <button
              type="button"
              onClick={() => setBuyStep(1)}
              title="Cada imagem analisada usa 1 token. Clique para comprar mais."
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                credits <= 0
                  ? "bg-danger/10 text-danger hover:bg-danger/15"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Coins className="h-3.5 w-3.5" />
              {credits} {credits === 1 ? "token" : "tokens"}
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                showHistory ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <History className="h-3.5 w-3.5" />
              Histórico
            </button>

            {/* Painel de histórico: dropdown flutuante, não empurra o layout */}
            {showHistory && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowHistory(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-border bg-surface p-3 shadow-2xl">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar conversa…"
                      className="w-full rounded-lg border border-border bg-surface-2 py-1.5 pl-8 pr-3 text-xs outline-none transition placeholder:text-muted-2 focus:border-accent"
                    />
                  </div>

                  {conversations.length === 0 ? (
                    <p className="py-2 text-xs text-muted">Nenhuma conversa ainda.</p>
                  ) : filteredConversations.length === 0 ? (
                    <p className="py-2 text-xs text-muted">Nenhuma conversa encontrada.</p>
                  ) : (
                    <ul className="max-h-72 space-y-0.5 overflow-y-auto text-left">
                      {filteredConversations.map((conv) => (
                        <li key={conv.id} className="group flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openConversation(conv.id)}
                            className={cn(
                              "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-surface-2 hover:text-foreground",
                              conv.id === conversationId ? "bg-accent-soft text-accent" : "text-muted"
                            )}
                          >
                            <span className="truncate">{conv.title}</span>
                            <span className="shrink-0 text-xs text-muted-2">{formatDay(conv.updated_at)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(conv.id)}
                            className="shrink-0 rounded-md p-1.5 text-muted-2 opacity-60 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                            aria-label="Excluir conversa"
                            title="Excluir conversa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens: coluna centralizada, sem caixa — o conteúdo respira na própria página */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 px-1 pb-2">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-accent/15 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-surface-2 ring-1 ring-inset ring-accent/20">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Manda a foto do fit ou de uma peça</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                  Foto do outfit completo? A IA avalia e solta a nota. Foto de
                  uma peça solta? Ela monta 3 combinações pra você usar.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => fillSuggestion(s)}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex items-end gap-2",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && <AssistantAvatar />}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%]",
                  message.role === "user"
                    ? "rounded-br-md bg-gradient-to-br from-accent to-accent-hover text-accent-foreground"
                    : "rounded-bl-md border border-border bg-surface-2 text-foreground/90"
                )}
              >
                {message.image && (
                  <Image
                    src={message.image}
                    alt="Foto do fit"
                    width={160}
                    height={213}
                    unoptimized
                    className="mb-2 max-h-56 w-auto rounded-xl object-cover ring-1 ring-inset ring-white/10"
                  />
                )}
                {message.role === "assistant" ? (
                  <FormattedReply text={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {loading && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Zona inferior: erro, prévia da foto e input flutuante — tudo na mesma coluna centralizada */}
      <div className="relative z-20 mx-auto w-full max-w-2xl pt-2">
        {error && <p className="px-1 pb-2 text-xs text-danger">{error}</p>}

        {pendingImage && (
          <div className="px-1 pb-3">
            <div className="relative inline-block">
              <Image
                src={pendingImage.thumb}
                alt="Prévia do fit"
                width={80}
                height={104}
                unoptimized
                className="h-24 w-auto rounded-lg object-cover ring-1 ring-inset ring-white/10"
              />
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:text-foreground"
                aria-label="Remover foto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-2 p-1.5 shadow-card transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-3 hover:text-foreground disabled:opacity-50"
            aria-label="Enviar foto do fit"
          >
            <Camera className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Pergunta algo ou só manda a foto…"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-2"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover text-accent-foreground transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Popup de compra de tokens */}
      {buyStep !== 0 && (
        <TokenModal
          step={buyStep as 1 | 2}
          onDecline={() => setBuyStep(2)}
          onClose={() => setBuyStep(0)}
        />
      )}
    </div>
  );
}

/** Oferta principal (100 tokens) e, se recusar, oferta de saída (25 tokens). */
function TokenModal({
  step,
  onDecline,
  onClose,
}: {
  step: 1 | 2;
  onDecline: () => void;
  onClose: () => void;
}) {
  const isMain = step === 1;
  const amount = isMain ? 100 : 25;
  const price = isMain ? "97" : "27";
  const url = isMain ? TOKENS_100_CHECKOUT_URL : TOKENS_25_CHECKOUT_URL;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-accent/20 blur-lg" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-surface-2 ring-1 ring-inset ring-accent/20">
            <Coins className="h-7 w-7 text-accent" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground">
          {isMain ? "Seus tokens acabaram" : "Que tal um pacote menor?"}
        </h3>
        <p className="mx-auto mt-1.5 max-w-xs text-xs text-muted">
          {isMain
            ? "Cada imagem analisada usa 1 token. Os tokens têm validade de 30 dias a partir da data de compra."
            : "Sem problema. Os tokens têm validade de 30 dias a partir da data de compra."}
        </p>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-3xl font-bold text-foreground">
            {amount} <span className="text-base font-medium text-muted">tokens</span>
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {amount} imagens (válido por 30 dias) · <span className="font-semibold text-foreground">R$ {price}</span>
          </p>
        </div>

        <a
          href={url || "#"}
          {...(url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover px-4 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition hover:brightness-110"
        >
          {isMain ? `Quero ${amount} tokens — R$ ${price}` : `Pegar ${amount} tokens — R$ ${price}`}
        </a>

        <button
          type="button"
          onClick={isMain ? onDecline : onClose}
          className="mt-2 w-full py-2 text-sm text-muted transition hover:text-foreground"
        >
          {isMain ? "Agora não" : "Fechar"}
        </button>
      </div>
    </div>
  );
}
