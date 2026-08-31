"use client";

import { useState } from "react";
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
  HelpCircle,
} from "lucide-react";
import { FunnelAnswers } from "./types";
import {
  STYLE_NAMES_MAP,
  STYLE_IMAGES_MAP,
  GOAL_NAMES_MAP,
} from "@/lib/funnel-data";
import {
  MONTHLY_CHECKOUT_URL,
  ANNUAL_CHECKOUT_URL,
  MONTHLY_PRICE,
  ANNUAL_PRICE,
  checkoutHref,
} from "@/components/landing/checkout";
import { CheckoutLink } from "@/components/landing/checkout-link";

interface SalesStepProps {
  answers: FunnelAnswers;
}

const FAQS = [
  {
    q: "Preciso ter dinheiro sobrando pra comprar roupas novas?",
    a: "Não. O método foi desenhado exatamente para você aproveitar as peças que já tem no armário. Os outfits de nível básico usam itens comuns (como jeans reto, camiseta neutra, jaqueta básica e tênis limpo). Você só compra peças novas quando souber exatamente o que precisa.",
  },
  {
    q: "E se eu for muito magro, estiver acima do peso ou for baixinho?",
    a: "O MPO tem um módulo inteiro dedicado a proporção corporal e ilusão de ótica visual. Você vai aprender a usar as linhas, contrastes e caimentos que valorizam seus ombros, disfarçam gordurinhas ou alongam sua silhueta instantaneamente.",
  },
  {
    q: "Como funciona o Fit Check com Inteligência Artificial?",
    a: "Você tira uma foto do seu outfit no espelho pelo celular e envia na plataforma. A IA do MPO — calibrada com o olhar técnico de stylist do Raphael Pereira — analisa cores, proporções e caimento, te dando a nota do look e ajustes pontuais antes de você sair de casa.",
  },
  {
    q: "Como e quando recebo o acesso?",
    a: "O acesso é imediato. Assim que a sua assinatura de R$27 for confirmada pela Cakto, você recebe os dados de login no seu e-mail e já pode acessar a plataforma pelo celular, tablet ou computador.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, com total liberdade e sem fidelidade. Se quiser cancelar, basta um clique dentro do seu painel ou nos enviar uma mensagem. Sem burocracia.",
  },
];

export function SalesStep({ answers }: SalesStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const cleanName = answers.name?.trim() ? answers.name.trim() : "Irmão";
  const styleLabel = STYLE_NAMES_MAP[answers.desiredStyle] || "Casual Sofisticado";
  const styleImage = STYLE_IMAGES_MAP[answers.desiredStyle] || "/estilos/casual/01.jpg";
  const goalLabel = GOAL_NAMES_MAP[answers.mainGoal] || "ser mais atraente e seguro";

  const checkoutUrl =
    selectedPlan === "monthly" ? MONTHLY_CHECKOUT_URL : ANNUAL_CHECKOUT_URL;
  const currentPrice = selectedPlan === "monthly" ? MONTHLY_PRICE : ANNUAL_PRICE;

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8 md:py-14">
      {/* Background radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,108,255,0.18) 0%, transparent 65%)",
        }}
      />

      {/* 1. Header de Prescrição Desbloqueada */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Sparkles className="size-3.5" />
          <span>Diagnóstico & Prescrição Desbloqueados</span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#F5F7FA] md:text-5xl md:leading-[1.15]">
          A rota exata para <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">{cleanName}</span> dominar o estilo{" "}
          <span className="text-white">{styleLabel}</span>.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#A4AAB5] md:text-base">
          Você não precisa de roupas caras de R$ 2.000. Você só precisa de 3 ajustes de proporção para que as pessoas te respeitem e te achem magnético nos primeiros 7 segundos.
        </p>
      </div>

      {/* 2. Card de Diagnóstico do Lead */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold uppercase tracking-wider text-white">
              Seu Estilo Alvo
            </div>
          </div>

          <div className="space-y-2.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#146CFF] px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">
                Fórmula Calibrada
              </span>
              <span className="text-xs font-semibold text-[#78A9FF]">
                Por Raphael Pereira (Stylist)
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-[#F5F7FA]">
              Seu Plano de Transformação Visual:
            </h2>

            <ul className="space-y-1.5 text-xs text-[#A4AAB5] md:text-sm">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Objetivo Principal:</strong> {goalLabel}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Estilo Ideal:</strong> {styleLabel} calibrado para o seu biotipo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#78A9FF]" />
                <span><strong>Tempo para Resultados:</strong> Primeiras 24h a 7 dias</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. O Que Entra no Seu Acesso (O Arsenal Completo) */}
      <div className="mt-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78A9FF]">
            Tudo o que você recebe imediatamente
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#F5F7FA] md:text-3xl">
            O Arsenal Definitivo do Homem Bem Vestido
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-5 transition-colors hover:border-[#146CFF]/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#146CFF]/15 text-[#78A9FF]">
              <Shirt className="size-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#F5F7FA]">
              228 Combinações Prontas
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#A4AAB5]">
              Montadas peça por peça por stylist. Escolha a ocasião (date, trabalho, noite, casual) e o outfit vem pronto na sua tela.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-5 transition-colors hover:border-[#146CFF]/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#146CFF]/15 text-[#78A9FF]">
              <Smartphone className="size-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#F5F7FA]">
              Fit Check com Inteligência Artificial
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#A4AAB5]">
              Tire foto do seu look no espelho e receba em segundos a avaliação honesta, nota e ajustes de caimento no seu celular.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-5 transition-colors hover:border-[#146CFF]/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#146CFF]/15 text-[#78A9FF]">
              <Sparkles className="size-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#F5F7FA]">
              Guarda-Roupa Inteligente
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#A4AAB5]">
              Aprenda a montar mais de 30 outfits combinando apenas 10 peças essenciais. Nunca mais compre uma peça que fica parada.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-5 transition-colors hover:border-[#146CFF]/40">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#146CFF]/15 text-[#78A9FF]">
              <Flame className="size-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-[#F5F7FA]">
              Método em 8 Módulos (37 Aulas)
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#A4AAB5]">
              Aulas em texto e imagens rápidas e consultáveis. Sem vídeos longos e cansativos: direto ao ponto pro seu dia a dia.
            </p>
          </div>
        </div>

        {/* Bônus Exclusivos Inclusos */}
        <div className="mt-6 rounded-2xl border border-[#146CFF]/30 bg-[#146CFF]/[0.05] p-5 md:p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#78A9FF]">
            <Gift className="size-4" />
            <span>3 Bônus Exclusivos Liberados Nesta Sessão</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#20242C] bg-[#0A0A0A]/80 p-3.5">
              <p className="text-[11px] font-bold uppercase text-[#78A9FF]">Bônus #1</p>
              <p className="mt-1 text-xs font-semibold text-[#F5F7FA]">Guia do Date Perfeito</p>
              <p className="mt-1 text-[11px] text-[#A4AAB5]">O que usar para impressionar sem parecer que tentou demais.</p>
            </div>

            <div className="rounded-xl border border-[#20242C] bg-[#0A0A0A]/80 p-3.5">
              <p className="text-[11px] font-bold uppercase text-[#78A9FF]">Bônus #2</p>
              <p className="mt-1 text-xs font-semibold text-[#F5F7FA]">Dicionário de 24 Peças</p>
              <p className="mt-1 text-[11px] text-[#A4AAB5]">Os tecidos, cortes e marcas ideais para comprar sem erro.</p>
            </div>

            <div className="rounded-xl border border-[#20242C] bg-[#0A0A0A]/80 p-3.5">
              <p className="text-[11px] font-bold uppercase text-[#78A9FF]">Bônus #3</p>
              <p className="mt-1 text-xs font-semibold text-[#F5F7FA]">Plano de Ação de 7 Dias</p>
              <p className="mt-1 text-[11px] text-[#A4AAB5]">Passo a passo diário para transformar seu visual em 1 semana.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Ancoragem de Preço e Oferta Irresistível */}
      <div id="oferta" className="relative mt-14 scroll-mt-20">
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-[#146CFF] bg-gradient-to-b from-[#146CFF]/[0.15] via-[#0E1015] to-[#0A0A0A] p-6 shadow-[0_0_70px_-15px_rgb(20_108_255/0.6)] md:p-10">
          {/* Header da Oferta */}
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#146CFF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
              Acesso Completo Liberado
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

          {/* Lista de Checkmarks */}
          <ul className="mt-8 space-y-2.5 border-t border-[#20242C] pt-6 text-xs text-[#F5F7FA] md:text-sm">
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Acesso imediato a todas as <strong>228 combinações prontas</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span><strong>Fit Check com IA</strong> para analisar seus outfits no celular</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Guarda-roupa inteligente & lista de compras na ordem certa</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>Todos os 8 módulos e 37 aulas do método prático</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#78A9FF]" />
              <span>3 Bônus Exclusivos inclusos (sem pagar nada a mais)</span>
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
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] via-[#2575FC] to-[#0D57D6] py-5 text-base font-extrabold tracking-wide text-white shadow-[0_0_40px_-5px_rgb(20_108_255/0.9)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              <span>QUERO MEU ACESSO AGORA POR R$ 27</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </CheckoutLink>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-center text-[11px] text-[#A4AAB5]/70">
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-[#78A9FF]" />
                <span>Pagamento 100% Seguro (Cakto)</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="size-3.5 text-emerald-400" />
                <span>Liberação Imediata no E-mail</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="size-3.5 text-[#78A9FF]" />
                <span>Cancele com 1 Clique</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quem é Raphael Pereira (Autoridade) */}
      <div className="mt-14 rounded-3xl border border-[#20242C] bg-[#0A0A0A] p-6 md:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[160px_1fr]">
          <div className="relative mx-auto aspect-square w-36 overflow-hidden rounded-2xl border border-[#20242C]">
            <Image
              src="/images/raphael/raphael.jpg"
              alt="Raphael Pereira"
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78A9FF]">
              Seu Mentor & Stylist
            </span>
            <h3 className="mt-1 font-display text-xl font-bold text-[#F5F7FA]">
              Raphael Pereira
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A4AAB5] md:text-sm">
              Stylist profissional desde 2017, vestiu os principais artistas da geração (como Matuê), trabalhou com marcas como Renner e PlayStation e destilou todo o seu conhecimento prático para colocar o olhar de um stylist de elite no bolso de qualquer homem comum.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Garantia Blindada de 7 Dias */}
      <div className="mt-8 flex flex-col items-center rounded-3xl border border-[#20242C] bg-[#0A0A0A] p-6 text-center md:flex-row md:gap-6 md:text-left">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <ShieldCheck className="size-8" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-[#F5F7FA] md:text-lg">
            Garantia Incondicional de 7 Dias · Risco Zero
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#A4AAB5]">
            Entre na plataforma, teste o Fit Check, copie as combinações e aplique no seu dia a dia. Se você não receber elogios ou achar que o MPO não mudou seu visual, basta nos avisar que devolvemos 100% do seu dinheiro. Sem perguntas e sem ressentimentos.
          </p>
        </div>
      </div>

      {/* 7. FAQs Anti-Objeção */}
      <div className="mt-12">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">
            Perguntas Frequentes
          </h2>
          <p className="mt-1 text-xs text-[#A4AAB5]">
            Tudo o que você precisa saber antes de destravar seu acesso.
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

      {/* CTA Sticky / Final */}
      <div className="mt-12 text-center">
        <CheckoutLink
          href={checkoutHref(MONTHLY_CHECKOUT_URL)}
          valor={MONTHLY_PRICE}
          className="group inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#146CFF] via-[#2575FC] to-[#0D57D6] py-5 text-base font-extrabold tracking-wide text-white shadow-[0_0_40px_-5px_rgb(20_108_255/0.9)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
        >
          <span>QUERO MEU ACESSO POR R$ 27</span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </CheckoutLink>
        <p className="mt-2 text-xs text-[#A4AAB5]/60">
          Acesso liberado na hora · 7 dias de garantia incondicional
        </p>
      </div>
    </div>
  );
}
