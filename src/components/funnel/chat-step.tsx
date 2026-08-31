"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { FunnelAnswers } from "./types";
import { getChatScript, STYLE_NAMES_MAP } from "@/lib/funnel-data";

interface ChatStepProps {
  answers: FunnelAnswers;
  onComplete: () => void;
}

function AudioBubblePlayer({
  id,
  audioDuration,
  audioTranscription,
  audioSrc,
  audioBase64,
  audioSources,
  isPlayingGlobal,
  onPlay,
  onPause,
}: {
  id: string;
  audioDuration?: string;
  audioTranscription?: string;
  audioSrc?: string;
  audioBase64?: string;
  audioSources?: any;
  isPlayingGlobal: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscription, setShowTranscription] = useState(false);

  // Sincroniza se outro áudio começou a tocar na conversa
  useEffect(() => {
    if (!isPlayingGlobal && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isPlayingGlobal, isPlaying]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      onPause();
    } else {
      onPlay();
      el.muted = false;
      el.volume = 1.0;
      if (el.ended || el.currentTime >= (el.duration || 100)) {
        el.currentTime = 0;
      }

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Erro ao reproduzir com base64, tentando fallback:", err);
            if (audioSources?.url && el.src !== audioSources.url) {
              el.src = audioSources.url;
              el.load();
              el.play()
                .then(() => setIsPlaying(true))
                .catch((e2) => {
                  console.warn("Fallback 1 falhou, tentando WAV:", e2);
                  if (audioSources?.urlWav) {
                    el.src = audioSources.urlWav;
                    el.load();
                    el.play().then(() => setIsPlaying(true));
                  }
                });
            }
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPause();
  };

  const formatSecs = (sec: number) => {
    if (!sec || isNaN(sec)) return audioDuration || "0:30";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Prioriza o áudio embutido em Base64 Data URL (100% imune a erros de rede, proxies, cookies e CORS)
  const primarySource = audioBase64 || audioSources?.m4a || audioSources?.url || audioSrc || "/audios/audio-1.m4a";

  return (
    <div className="w-72 rounded-2xl rounded-tl-sm border border-[#146CFF]/40 bg-gradient-to-r from-[#146CFF]/10 to-[#15181F] p-3 text-[#F5F7FA] shadow-[0_0_25px_-5px_rgb(20_108_255/0.2)]">
      {/* Elemento de áudio com src inline garantido */}
      <audio
        ref={audioRef}
        src={primarySource}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#146CFF] text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
        >
          {isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="ml-0.5 size-5" />
          )}
        </button>

        {/* Waveform animada sincronizada com o progresso real */}
        <div className="flex-1">
          <div className="flex items-center gap-0.5 h-6">
            {[35, 60, 40, 85, 50, 95, 70, 45, 80, 55, 30, 90, 65, 40, 75, 50, 85, 30].map(
              (height, idx) => {
                const totalDur = duration || audioSources?.durationSec || 30;
                const progressRatio = totalDur > 0 ? currentTime / totalDur : 0;
                const isPlayed = idx / 18 <= progressRatio;
                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying
                        ? isPlayed
                          ? "bg-[#78A9FF] animate-pulse"
                          : "bg-[#146CFF]/40"
                        : "bg-[#A4AAB5]/40"
                    }`}
                    style={{
                      height: `${isPlaying ? Math.max(25, (height * (idx % 3 + 1)) % 100) : height}%`,
                    }}
                  />
                );
              }
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#78A9FF]">
            <span className="font-semibold">
              {isPlaying ? "Reproduzindo áudio..." : "Mensagem de voz"}
            </span>
            <span>
              {isPlaying
                ? formatSecs(currentTime)
                : audioDuration || formatSecs(duration || audioSources?.durationSec || 30)}
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Transcrição */}
      {audioTranscription && (
        <div className="mt-2.5 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setShowTranscription(!showTranscription)}
            className="flex items-center gap-1 text-[11px] font-medium text-[#A4AAB5] hover:text-white transition-colors"
          >
            <span>
              {showTranscription
                ? "Ocultar texto do áudio"
                : "Ler transcrição do áudio"}
            </span>
            {showTranscription ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
          {showTranscription && (
            <p className="mt-1.5 rounded-lg bg-black/50 p-2.5 text-xs italic leading-relaxed text-[#F5F7FA]/90 border border-white/5">
              "{audioTranscription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatStep({ answers, onComplete }: ChatStepProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState("Raphael está digitando...");
  const [currentStep, setCurrentStep] = useState(1);
  const [activeQuickReplies, setActiveQuickReplies] = useState<any[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showFinalCta, setShowFinalCta] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const cleanName = answers.name?.trim() ? answers.name.trim() : "irmão";
  const script = getChatScript(cleanName, {
    mainGoal: answers.mainGoal,
    painPoint: answers.painPoint,
    desiredStyle: answers.desiredStyle,
    bodyType: answers.bodyType,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, activeQuickReplies, showFinalCta]);

  // Carrega as mensagens do step atual com delays realistas e humanizados
  useEffect(() => {
    const stepMessages = script.filter((m) => m.step === currentStep);
    let timeoutId: NodeJS.Timeout;

    const playMessageSequence = async () => {
      for (let i = 0; i < stepMessages.length; i++) {
        const msg = stepMessages[i];
        
        // Verifica se a mensagem já foi enviada
        if (messages.some((m) => m.id === msg.id)) continue;

        if (msg.audioDuration) {
          setTypingStatus("Raphael está gravando um áudio...");
        } else {
          setTypingStatus("Raphael está digitando...");
        }
        setIsTyping(true);

        // Tempo de digitação proporcional ao conteúdo
        const typingTime = msg.delayMs || (msg.audioDuration ? 3500 : 2500);
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, typingTime);
        });

        setIsTyping(false);
        setMessages((prev) => [...prev, { ...msg, timestamp: getFormattedTime() }]);

        if (msg.quickReplies) {
          setActiveQuickReplies(msg.quickReplies);
        }

        if (msg.isFinalCta) {
          setShowFinalCta(true);
        }

        // Pequena pausa natural entre mensagens consecutivas
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 800);
        });
      }
    };

    playMessageSequence();

    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  const handleQuickReplyClick = (reply: any) => {
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: "user" as const,
      text: reply.text,
      timestamp: getFormattedTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveQuickReplies([]);

    if (reply.nextStepId === "step_2") {
      setTimeout(() => setCurrentStep(2), 900);
    } else if (reply.nextStepId === "step_3") {
      setTimeout(() => setCurrentStep(3), 900);
    }
  };

  function getFormattedTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="relative mx-auto flex h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#20242C] bg-[#0A0A0A] shadow-[0_0_60px_-15px_rgba(0,0,0,0.9)]">
      {/* Header VIP do WhatsApp / Direct */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#20242C] bg-[#0E1015]/95 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="relative size-11 overflow-hidden rounded-full border border-[#146CFF]/50 bg-[#111318]">
              <Image
                src="/images/raphael/raphael.jpg"
                alt="Raphael Pereira"
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            {/* Status dot online */}
            <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#0A0A0A] bg-emerald-500" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-bold text-[#F5F7FA]">
                Raphael Pereira
              </span>
              <span className="flex size-4 items-center justify-center rounded-full bg-[#146CFF] text-[9px] font-black text-white">
                ✓
              </span>
            </div>
            <p className="text-[11px] font-medium text-emerald-400">
              Online agora · Stylist dos Artistas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[#146CFF]/30 bg-[#146CFF]/10 px-2.5 py-1 text-[10px] font-bold text-[#78A9FF]">
          <Zap className="size-3 text-[#146CFF]" />
          <span>Etapa 2 de 3</span>
        </div>
      </div>

      {/* Área de Mensagens (Scrollable) */}
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(20,108,255,0.03) 0%, transparent 80%)",
        }}
      >
        {/* Aviso de Início da Conversa */}
        <div className="my-2 flex justify-center">
          <span className="rounded-full border border-[#20242C] bg-[#111318]/80 px-3.5 py-1 text-[10px] font-medium text-[#A4AAB5]/80">
            🔒 Conversa privada · Diagnóstico de Estilo
          </span>
        </div>

        {/* Lista de Mensagens */}
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-fadeIn">
                <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#146CFF] to-[#0D57D6] px-4 py-2.5 text-sm text-white shadow-md">
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
                    <span>{msg.timestamp}</span>
                    <CheckCheck className="size-3.5 text-white" />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-end gap-2 animate-fadeIn">
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-[#20242C] bg-[#111318]">
                <Image
                  src="/images/raphael/raphael.jpg"
                  alt="Raphael"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </div>

              <div className="max-w-[85%] space-y-2">
                {/* 1. Mensagem de Texto Normal */}
                {msg.text && (
                  <div className="rounded-2xl rounded-tl-sm border border-[#20242C] bg-[#15181F] px-4 py-2.5 text-sm leading-relaxed text-[#F5F7FA]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-[#78A9FF] font-semibold">$1</strong>'
                        ),
                      }}
                    />
                    <div className="mt-1 flex justify-end text-[10px] text-[#A4AAB5]/60">
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* 2. Mensagem com Foto */}
                {msg.image && (
                  <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-[#20242C] bg-[#15181F]">
                    <div className="relative aspect-[4/3] w-full bg-black/40">
                      <Image
                        src={msg.image}
                        alt="Imagem enviada por Raphael"
                        fill
                        sizes="(max-width: 640px) 85vw, 400px"
                        className="object-cover"
                      />
                    </div>
                    {msg.imageCaption && (
                      <div className="p-3 text-xs leading-relaxed text-[#A4AAB5]">
                        <p>{msg.imageCaption}</p>
                        <div className="mt-1 flex justify-end text-[10px] text-[#A4AAB5]/60">
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Mensagem de Áudio Interativo com Base64 e Player Nativo */}
                {msg.audioDuration && (
                  <AudioBubblePlayer
                    id={msg.id}
                    audioDuration={msg.audioDuration}
                    audioTranscription={msg.audioTranscription}
                    audioSrc={msg.audioSrc}
                    audioBase64={msg.audioBase64}
                    audioSources={msg.audioSources}
                    isPlayingGlobal={playingAudioId === msg.id}
                    onPlay={() => setPlayingAudioId(msg.id)}
                    onPause={() => {
                      if (playingAudioId === msg.id) setPlayingAudioId(null);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Indicador de Digitação (Typing Indicator) */}
        {isTyping && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-[#20242C] bg-[#111318]">
              <Image
                src="/images/raphael/raphael.jpg"
                alt="Raphael"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#20242C] bg-[#15181F] px-4 py-2.5">
              <span className="text-xs font-medium text-[#78A9FF]">{typingStatus}</span>
              <div className="flex items-center gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-[#146CFF] [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[#146CFF] [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[#146CFF]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de Ações e Respostas Rápidas (Bottom Bar) */}
      <div className="relative z-10 border-t border-[#20242C] bg-[#0E1015] p-4">
        {/* Botões de Resposta Rápida (Quick Replies) */}
        {activeQuickReplies.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78A9FF]">
              Toque para responder:
            </p>
            <div className="flex flex-col gap-2">
              {activeQuickReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => handleQuickReplyClick(reply)}
                  className="flex items-center justify-between rounded-xl border border-[#146CFF]/50 bg-[#146CFF]/10 px-4 py-3 text-left text-sm font-semibold text-[#F5F7FA] transition-all hover:bg-[#146CFF] hover:text-white active:scale-[0.98]"
                >
                  <span>{reply.text}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA Final para a Etapa 3 (Página de Vendas da Prescrição) */}
        {showFinalCta && (
          <div className="animate-fadeIn">
            <button
              onClick={onComplete}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] via-[#2575FC] to-[#0D57D6] py-4 text-sm font-bold tracking-wide text-white shadow-[0_0_35px_-5px_rgb(20_108_255/0.8)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              <span>VER MINHA PRESCRIÇÃO E LIBERAR O ACESSO</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-2 text-center text-[11px] text-[#A4AAB5]/70">
              Acesso individual · Prescrição calibrada para {cleanName}
            </p>
          </div>
        )}

        {/* Se estiver aguardando digitação e sem quick replies ativas */}
        {!showFinalCta && activeQuickReplies.length === 0 && (
          <div className="flex items-center justify-center py-1 text-xs text-[#A4AAB5]/50">
            <span>Aguarde a resposta do Raphael…</span>
          </div>
        )}
      </div>
    </div>
  );
}
