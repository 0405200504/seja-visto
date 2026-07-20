"use client";

import { useEffect, useState, useRef } from "react";
import { X, MessageSquare, Calendar, Bot, User, Loader2, Image as ImageIcon } from "lucide-react";
import { getStudentConversationsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thumb: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface StudentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function StudentChatModal({ isOpen, onClose, studentId, studentName }: StudentChatModalProps) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fecha o modal ao apertar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Carrega as conversas de chat do aluno quando o modal abre
  useEffect(() => {
    if (!isOpen || !studentId) return;

    async function loadConversations() {
      setLoading(true);
      try {
        const data = await getStudentConversationsAction(studentId);
        // Garante a conversão de tipagem para as roles
        const typedData = (data ?? []).map(c => ({
          ...c,
          messages: (c.messages ?? []).map(m => ({
            ...m,
            role: m.role as "user" | "assistant"
          }))
        })) as Conversation[];

        setConversations(typedData);
        if (typedData.length > 0) {
          setActiveConvId(typedData[0].id);
        } else {
          setActiveConvId(null);
        }
      } catch (err) {
        console.error("Erro ao carregar conversas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [isOpen, studentId]);

  // Rola para o final da conversa quando muda de conversa ou de mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, conversations]);

  if (!isOpen) return null;

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop de vidro escurecido */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Janela do Modal */}
      <div className="relative flex flex-col w-full max-w-3xl h-[85vh] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-10">
        
        {/* Topo do Modal */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-accent/15 p-2 text-accent">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Histórico de Chats: {studentName}</h3>
              <p className="text-[10px] text-muted">Conversas arquivadas do consultor de estilo de IA (Fit Check)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl border border-border bg-surface hover:bg-surface-2/80 p-2 text-muted hover:text-foreground transition-all"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Corpo do Modal */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Menu Lateral: Lista de Conversas (Esquerda) */}
          <aside className="w-full md:w-60 border-r border-border bg-surface-2/30 overflow-y-auto shrink-0 md:block hidden">
            <p className="px-4 py-3 text-[10px] uppercase font-bold text-muted tracking-wider">Histórico recente</p>
            <div className="px-2 space-y-1 pb-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="size-5 animate-spin text-accent" />
                  <span className="text-[10px] text-muted">Buscando...</span>
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted">Sem conversas.</p>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConvId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className={`w-full text-left rounded-xl px-3.5 py-2.5 transition-all text-xs flex flex-col gap-1 ${
                        isActive 
                          ? "bg-accent/10 border border-accent/20 text-accent font-semibold" 
                          : "hover:bg-surface-2 text-muted border border-transparent"
                      }`}
                    >
                      <span className="truncate w-full font-medium">{c.title}</span>
                      <span className="text-[9px] opacity-70 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Menu Seletor para Mobile */}
          <div className="block md:hidden shrink-0 border-b border-border bg-surface-2/40 p-3">
            {conversations.length > 0 && (
              <select
                value={activeConvId ?? ""}
                onChange={(e) => setActiveConvId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({new Date(c.updated_at).toLocaleDateString("pt-BR")})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Área de Visualização do Chat (Direita) */}
          <main className="flex-1 flex flex-col bg-surface overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-7 animate-spin text-accent" />
                <p className="text-xs text-muted font-medium">Carregando conversas do aluno...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="size-10 text-muted/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">Sem histórico de chat</p>
                <p className="text-xs text-muted max-w-sm mt-1">Este aluno ainda não iniciou nenhuma conversa com o consultor de estilo por inteligência artificial.</p>
              </div>
            ) : activeConv ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mensagens do chat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeConv.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Avatar do emissor */}
                        <div className={`size-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                          isUser ? "bg-surface-3 text-muted" : "bg-accent/15 text-accent"
                        }`}>
                          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                        </div>

                        {/* Corpo da mensagem */}
                        <div className="space-y-1">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isUser
                                ? "bg-surface-2 text-foreground rounded-tr-none border border-border"
                                : "bg-accent/[0.04] text-foreground rounded-tl-none border border-accent/15"
                            }`}
                          >
                            {/* Imagem em anexo no chat (se houver thumb) */}
                            {msg.thumb && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-border/80 bg-surface-2 max-w-[200px]">
                                <img 
                                  src={msg.thumb} 
                                  alt="Fit Check Outfit" 
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            )}
                            
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className={`text-[9px] text-muted-2 ${isUser ? "text-right" : "text-left"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
