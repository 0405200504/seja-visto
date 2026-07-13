"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, History, Plus, Send, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

/** Renderiza **negrito** e quebras de linha da resposta da IA. */
function FormattedReply({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i} className={cn("min-h-[0.5em]", i > 0 && "mt-1.5")}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      ))}
    </>
  );
}

export function FitCheckChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{ full: string; thumb: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("fit_check_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);
    setConversations((data as Conversation[]) ?? []);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;

    const image = pendingImage;
    const userMessage: ChatMessage = {
      role: "user",
      content: text || "Fit check!",
      image: image?.thumb,
    };

    // Histórico enxuto: só texto das últimas trocas (a foto vai apenas na mensagem atual)
    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.role === "user" && m.image ? `${m.content} [foto enviada]` : m.content,
    }));

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
          history,
          conversationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro na análise.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
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
    <div className="flex h-[calc(100dvh-16rem)] min-h-[24rem] flex-col rounded-2xl border border-border bg-surface/60">
      {/* Barra do topo: novo chat + histórico */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={newChat}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-border-strong hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo chat
        </button>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
            showHistory
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-foreground"
          )}
        >
          <History className="h-3.5 w-3.5" />
          Histórico
        </button>
      </div>

      {/* Painel de histórico */}
      {showHistory && (
        <div className="border-b border-border px-3 py-2 sm:px-4">
          {conversations.length === 0 ? (
            <p className="py-2 text-xs text-muted">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(conv.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 py-2 text-left text-sm transition hover:text-foreground",
                      conv.id === conversationId ? "text-accent" : "text-muted"
                    )}
                  >
                    <span className="truncate">{conv.title}</span>
                    <span className="shrink-0 text-xs text-muted-2">{formatDay(conv.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold">Manda a foto do seu fit</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                De preferência corpo inteiro e com boa luz. A IA fala o que tá
                funcionando, o que dá pra melhorar e solta a nota.
              </p>
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                message.role === "user"
                  ? "rounded-br-md bg-accent text-accent-foreground"
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
                  className="mb-2 max-h-56 w-auto rounded-xl object-cover"
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

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                Analisando o fit…
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Erro */}
      {error && (
        <p className="border-t border-border px-4 py-2 text-xs text-danger sm:px-5">{error}</p>
      )}

      {/* Prévia da foto pendente */}
      {pendingImage && (
        <div className="border-t border-border px-4 py-3 sm:px-5">
          <div className="relative inline-block">
            <Image
              src={pendingImage.thumb}
              alt="Prévia do fit"
              width={80}
              height={104}
              unoptimized
              className="h-24 w-auto rounded-lg object-cover"
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

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-border p-3 sm:p-4">
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted transition hover:border-border-strong hover:text-foreground disabled:opacity-50"
          aria-label="Enviar foto do fit"
        >
          <Camera className="h-5 w-5" />
        </button>
        <textarea
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
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-2 focus:border-accent"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || (!input.trim() && !pendingImage)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
