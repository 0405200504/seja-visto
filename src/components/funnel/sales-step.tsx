"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  ChevronDown,
  Star,
  Flame,
  Clock,
  Shirt,
  Smartphone,
  Gift,
  AlertCircle,
  Eye,
} from "lucide-react";
import { FunnelAnswers } from "./types";
import {
  STYLE_NAMES_MAP,
  STYLE_IMAGES_MAP,
  GOAL_NAMES_MAP,
} from "@/lib/funnel-data";
import {
  MONTHLY_CHECKOUT_URL,
  MONTHLY_PRICE,
  checkoutHref,
} from "@/components/landing/checkout";
import { CheckoutLink } from "@/components/landing/checkout-link";

interface SalesStepProps {
  answers: FunnelAnswers;
}

const ARTIST_SAMPLE_PHOTOS = [
  "/images/raphael/artistas/artista-01.jpg",
  "/images/raphael/artistas/artista-02.jpg",
  "/images/raphael/artistas/artista-03.jpg",
  "/images/raphael/artistas/artista-04.jpg",
  "/images/raphael/artistas/artista-05.jpg",
  "/images/raphael/artistas/artista-06.jpg",
];

const FAQS = [
  {
    q: "Preciso ter dinheiro sobrando pra comprar roupas novas?",
    a: "Não! O método foi desenvolvido exatamente para você aproveitar as peças que já estão no seu guarda-roupa. Você vai aprender a combinar cores neutras, caimentos e proporções com camisetas e calças que já possui. Só compre novas peças quando souber exatamente o que precisa.",
  },
  {
    q: "E se eu for magro, tiver barriga ou for baixinho?",
    a: "O MPO possui um módulo completo de ilusão de ótica e proporção corporal. Você vai aprender os truques exatos de cortes, golas, comprimentos e sobreposições que valorizam seus ombros, alongam a silhueta ou disfarçam gordurinhas sem aperto.",
  },
  {
    q: "Como funciona o Fit Check com Inteligência Artificial?",
    a: "Você tira uma foto do seu outfit no espelho pelo celular e envia na plataforma. A IA do MPO — calibrada com o olhar técnico de stylist de Raphael Pereira — avalia na hora a harmonia de cores, caimento e proporção, te dando a nota do look e ajustes rápidos antes de você sair de casa.",
  },
  {
    q: "Como e quando recebo meu acesso?",
    a: "O acesso é imediato. Assim que o pagamento de R$ 27 for confirmado pela Cakto, você recebe seus dados de login diretamente no seu e-mail e WhatsApp, podendo usar no celular, tablet ou computador.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, 100% livre e sem letras miúdas. Se em qualquer momento você não quiser continuar, cancela com apenas 1 clique no seu painel ou nos avisando. Sem burocracia.",
  },
];

const TESTIMONIALS = [
  {
    name: "Lucas M., 27 anos",
    role: "Engenheiro de Software",
    comment: "Eu sempre fui o cara que vestia qualquer camiseta preta. Na primeira semana aplicando os outfits de trabalho do MPO, meu chefe e duas colegas elogiaram meu visual no mesmo dia. Vale cada centavo.",
    stars: 5,
  },
  {
    name: "Gabriel S., 31 anos",
    role: "Empresário",
    comment: "A consultoria com IA (Fit Check) me salvou num date semana passada. Mandei a foto do look, ela sugeriu trocar a cor da sobreposição e foi sucesso total. Menos de 1 real por dia por isso é ridículo de barato.",
    stars: 5,
  },
  {
    name: "Rodrigo T., 24 anos",
    role: "Advogado",
    comment: "O que o Rapha fala sobre os 7 segundos é a mais pura verdade. A postura e o respeito das pessoas mudam imediatamente quando você acerta o caimento das peças certas.",
    stars: 5,
  },
];

const RECENT_SALES = [
  { name: "Matheus B.", city: "São Paulo - SP", action: "desbloqueou as 228 combinações", time: "há 2 minutos" },
  { name: "Felipe R.", city: "Curitiba - PR", action: "iniciou o Fit Check com IA", time: "há 4 minutos" },
  { name: "Guilherme S.", city: "Rio de Janeiro - RJ", action: "entrou no MPO", time: "há 6 minutos" },
  { name: "Arthur M.", city: "Belo Horizonte - MG", action: "desbloqueou a consultoria", time: "há 8 minutos" },
  { name: "Lucas V.", city: "Brasília - DF", action: "acabou de entrar no MPO", time: "há 1 minuto" },
];

export function SalesStep({ answers }: SalesStepProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 52); // 14 min 52 seg
  const [activeToast, setActiveToast] = useState<{ name: string; city: string; action: string; time: string } | null>(null);

  const cleanName = answers.name?.trim() ? answers.name.trim() : "Irmão";
  const styleLabel = STYLE_NAMES_MAP[answers.desiredStyle] || "Casual Sofisticado";
  const styleImage = STYLE_IMAGES_MAP[answers.desiredStyle] || "/estilos/casual/01.jpg";
  const goalLabel = GOAL_NAMES_MAP[answers.mainGoal] || "ser mais atraente e seguro";

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notificações de prova social a cada 9 segundos
  useEffect(() => {
    let index = 0;
    const toastInterval = setInterval(() => {
      setActiveToast(RECENT_SALES[index % RECENT_SALES.length]);
      index++;
      setTimeout(() => {
        setActiveToast(null);
      }, 4500);
    }, 9500);

    return () => clearInterval(toastInterval);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      {/* Background radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[550px] w-[750px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,108,255,0.2) 0%, transparent 65%)",
        }}
      />

      {/* 0. Banner de Urgência & Reserva do Diagnóstico */}
      <div className="relative mb-6 flex items-center justify-between rounded-2xl border border-[#146CFF]/40 bg-[#146CFF]/10 px-4 py-2.5 text-xs text-[#F5F7FA] shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Clock className="size-4 animate-pulse text-[#78A9FF]" />
          <span>Diagnóstico reservado para <strong>{cleanName}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
          <span>Expira em:</span>
          <span className="rounded bg-black/50 px-2 py-0.5">{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* 1. Header de Prescrição Desbloqueada */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Sparkles className="size-3.5" />
          <span>Prescrição Liberada por Raphael Pereira</span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#F5F7FA] md:text-5xl md:leading-[1.15]">
          A fórmula exata para <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">você</span> dominar o estilo{" "}
          <span className="text-white">{styleLabel}</span>.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#A4AAB5] md:text-base">
          Como mudar a temperatura do ambiente e ser notado nos primeiros 7 segundos — sem gastar com roupas de grife e usando as peças que você já tem.
        </p>
      </div>

      {/* 2. Prova de Autoridade: O Stylist das Maiores Celebridades */}
      <div className="mt-8 rounded-3xl border border-[#20242C] bg-[#0A0A0A]/90 p-5 md:p-6">
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#78A9FF]">
              Stylist Profissional desde 2017
            </p>
            <p className="font-display text-base font-bold text-[#F5F7FA]">
              Já vestiu Matuê, Teto, WIU e os maiores artistas da geração
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-[#A4AAB5]">
            +2.000 homens transformados
          </span>
        </div>

        {/* Mini Grid de Artistas */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ARTIST_SAMPLE_PHOTOS.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[#20242C] bg-[#111318]"
            >
              <Image
                src={src}
                alt="Artista vestido por Raphael Pereira"
                fill
                sizes="120px"
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Card de Diagnóstico & Prescrição */}
      <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#146CFF]/50 bg-gradient-to-b from-[#146CFF]/10 to-[#0A0A0A] p-5 shadow-[0_0_50px_-15px_rgb(20_108_255/0.4)] md:p-8">
        <div className="grid items-center gap-6 sm:grid-cols-[140px_1fr] md:gap-8">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#20242C] bg-[#111318]">
            <Image
              src={styleImage}
              alt={styleLabel}
              fill
              sizes="140px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold uppercase tracking-wider text-white">
              Sua Referência
            </div>
          </div>

          <div className="space-y-2.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#146CFF] px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">
                Diagnóstico Concluído
              </span>
              <span className="text-xs font-semibold text-[#78A9FF]">
                Para: {cleanName}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-[#F5F7FA]">
              Seu Plano de Ação Personalizado:
            </h2>

            <ul className="space-y-1.5 text-xs text-[#A4AAB5] md:text-sm">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Foco:</strong> {goalLabel}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Estética Alvo:</strong> {styleLabel} adaptado ao seu biotipo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Efeito 7 Segundos:</strong> Ajustes imediatos de proporção e caimento</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Degustação dos 228 Outfits (Prévia com Cadeado) */}
      <div className="mt-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78A9FF]">
            Amostra da Plataforma
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#F5F7FA] md:text-3xl">
            228 Combinações Prontas ao Seu Alcance
          </h2>
          <p className="mt-1 text-xs text-[#A4AAB5]">
            Outfits montados peça por peça para você só copiar e vestir.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Look Liberado 1 */}
          <div className="overflow-hidden rounded-2xl border border-[#146CFF]/50 bg-[#0A0A0A] p-2 text-left">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#111318]">
              <Image
                src="/estilos/casual/02.jpg"
                alt="Look Liberado"
                fill
                sizes="180px"
                className="object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Liberado
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-[#F5F7FA]">Date & Encontros</p>
            <p className="text-[10px] text-[#A4AAB5]">Camiseta Heavyweight + Alfaiataria</p>
          </div>

          {/* Look Liberado 2 */}
          <div className="overflow-hidden rounded-2xl border border-[#146CFF]/50 bg-[#0A0A0A] p-2 text-left">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#111318]">
              <Image
                src="/estilos/smartcasual/02.jpg"
                alt="Look Liberado"
                fill
                sizes="180px"
                className="object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Liberado
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-[#F5F7FA]">Trabalho & Reuniões</p>
            <p className="text-[10px] text-[#A4AAB5]">Camisa Oxford + Chino + Tênis Clean</p>
          </div>

          {/* Look Bloqueado 3 */}
          <div className="relative overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-2 text-left opacity-75">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#111318] blur-[2px]">
              <Image
                src="/estilos/streetwear/03.jpg"
                alt="Look Bloqueado"
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 text-center backdrop-blur-[1px]">
              <Lock className="size-6 text-[#78A9FF]" />
              <span className="mt-1 text-[11px] font-bold text-white">Outfit #47</span>
              <span className="text-[9px] text-[#A4AAB5]">Desbloqueie no MPO</span>
            </div>
          </div>

          {/* Look Bloqueado 4 */}
          <div className="relative overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-2 text-left opacity-75">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#111318] blur-[2px]">
              <Image
                src="/estilos/oldmoney/03.jpg"
                alt="Look Bloqueado"
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 text-center backdrop-blur-[1px]">
              <Lock className="size-6 text-[#78A9FF]" />
              <span className="mt-1 text-[11px] font-bold text-white">+224 Outfits</span>
              <span className="text-[9px] text-[#A4AAB5]">Desbloqueie no MPO</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Comparativo: O Erro Tradicional vs. O Método MPO */}
      <div className="mt-12 rounded-3xl border border-[#20242C] bg-[#0A0A0A] p-6 md:p-8">
        <h3 className="text-center font-display text-xl font-bold text-[#F5F7FA]">
          Por que tentar se vestir no “achismo” custa caro:
        </h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
            <p className="font-display text-sm font-bold uppercase tracking-wider text-red-400">
              ❌ Sem o MPO
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#A4AAB5]">
              <li>• Compra roupas de shopping que nunca usa</li>
              <li>• Insegurança no date: "será que tô estranho?"</li>
              <li>• Passa despercebido ou parece um adolescente</li>
              <li>• Perde 20 minutos na frente do espelho todo dia</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#146CFF]/40 bg-[#146CFF]/[0.08] p-5">
            <p className="font-display text-sm font-bold uppercase tracking-wider text-[#78A9FF]">
              ✓ Com o MPO no seu bolso
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#F5F7FA]">
              <li>• 228 combinações prontas para qualquer ocasião</li>
              <li>• Fit Check com IA que avalia seu look em segundos</li>
              <li>• Presença, autoridade e elogios espontâneos</li>
              <li>• Guarda-roupa inteligente com o que você já tem</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Depoimentos Reais de Alunos */}
      <div className="mt-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78A9FF]">
            Resultados Reais
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#F5F7FA]">
            O Que os Homens Estão Falando:
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-5"
            >
              <div>
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#A4AAB5]">
                  "{t.comment}"
                </p>
              </div>
              <div className="mt-4 border-t border-white/5 pt-3">
                <p className="text-xs font-bold text-[#F5F7FA]">{t.name}</p>
                <p className="text-[10px] text-[#78A9FF]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Caixa da Oferta Irresistível com Seletor de Planos */}
      <div id="oferta" className="relative mt-14 scroll-mt-20">
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-[#146CFF] bg-gradient-to-b from-[#146CFF]/[0.18] via-[#0E1015] to-[#0A0A0A] p-6 shadow-[0_0_70px_-15px_rgb(20_108_255/0.6)] md:p-10">
          {/* Header da Oferta */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#146CFF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
              Oferta do Diagnóstico Liberada
            </span>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#A4AAB5]">
              <span>Consultoria Individual:</span>
              <span className="line-through">R$ 2.500,00</span>
            </div>

            <div className="mt-3">
              <div className="font-display text-5xl font-extrabold tracking-tight text-[#F5F7FA] md:text-6xl">
                R$ 27<span className="text-xl font-normal text-[#A4AAB5]">/mês</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#78A9FF]">
                Menos de R$ 0,90 por dia · Cancele quando quiser sem pegadinhas
              </p>
            </div>
          </div>

          {/* Lista de Benefícios */}
          <ul className="mt-8 space-y-2.5 border-t border-[#20242C] pt-6 text-xs text-[#F5F7FA] md:text-sm">
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Acesso imediato a todas as <strong>228 combinações prontas</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span><strong>Fit Check com IA</strong> para avaliar seus looks no celular</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Guarda-roupa inteligente (10 peças = 30 looks)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Método completo em 8 módulos e 37 aulas</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>3 Bônus Exclusivos (Guia do Date, Dicionário e Plano 7 Dias)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Garantia incondicional de 7 dias (risco zero)</span>
            </li>
          </ul>

          {/* Botão de Compra Pulsante (Checkout Cakto) */}
          <div className="mt-8">
            <CheckoutLink
              href={checkoutHref(MONTHLY_CHECKOUT_URL)}
              valor={MONTHLY_PRICE}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] via-[#2575FC] to-[#0D57D6] py-5 text-base font-extrabold tracking-wide text-white shadow-[0_0_45px_-5px_rgb(20_108_255/0.9)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              <span>LIBERAR MEU ACESSO POR R$ 27</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </CheckoutLink>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-center text-[11px] text-[#A4AAB5]/70">
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[#78A9FF]" />
                <span>Pagamento Seguro (Cakto)</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="size-3.5 text-emerald-400" />
                <span>Acesso Imediato</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="size-3.5 text-[#78A9FF]" />
                <span>Sem Fidelidade</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Garantia Blindada de 7 Dias */}
      <div className="mt-12 flex flex-col items-center rounded-3xl border border-[#20242C] bg-[#0A0A0A] p-6 text-center md:flex-row md:gap-6 md:text-left">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <ShieldCheck className="size-9" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-[#F5F7FA] md:text-lg">
            Teste por 7 Dias sem Risco · Devolução de 100%
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#A4AAB5]">
            Você tem 7 dias completos para explorar a plataforma, testar as combinações no espelho e usar o Fit Check com IA. Se você não receber elogios ou achar que não valeu cada centavo, basta nos enviar uma mensagem que devolvemos 100% do seu valor imediatamente. O risco é todo meu.
          </p>
        </div>
      </div>

      {/* 9. FAQs Anti-Objeção */}
      <div className="mt-12">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
            Perguntas Frequentes
          </h2>
          <p className="mt-1 text-xs text-[#A4AAB5]">
            Tire suas dúvidas antes de destravar seu acesso.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] transition-colors hover:border-[#146CFF]/30"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-[#F5F7FA] md:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-[#78A9FF] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#20242C] p-4 pt-3 text-xs leading-relaxed text-[#A4AAB5]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Final */}
      <div className="mt-12 text-center">
        <CheckoutLink
          href={checkoutHref(MONTHLY_CHECKOUT_URL)}
          valor={MONTHLY_PRICE}
          className="group inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] via-[#2575FC] to-[#0D57D6] py-5 text-base font-extrabold tracking-wide text-white shadow-[0_0_45px_-5px_rgb(20_108_255/0.9)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
        >
          <span>QUERO DESTRAVAR MEU ACESSO POR R$ 27</span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </CheckoutLink>
        <p className="mt-2 text-xs text-[#A4AAB5]/60">
          Acesso liberado na hora · 7 dias de garantia incondicional
        </p>
      </div>

      {/* Toast Flutuante de Prova Social em Tempo Real */}
      {activeToast && (
        <div className="fixed bottom-5 left-5 z-50 flex max-w-xs items-center gap-3 rounded-2xl border border-[#146CFF]/40 bg-[#0E1015]/95 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-fadeIn">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#146CFF]/20 text-[#78A9FF]">
            <Zap className="size-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#F5F7FA]">
              <strong className="text-white">{activeToast.name}</strong> ({activeToast.city})
            </p>
            <p className="text-[11px] text-[#A4AAB5]">
              {activeToast.action} · <span className="text-emerald-400">{activeToast.time}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
