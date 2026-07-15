import Image from "next/image";
import { Check, ChevronDown, Minus } from "lucide-react";
import { Reveal } from "./reveal";
import {
  ANNUAL_CHECKOUT_URL,
  MONTHLY_CHECKOUT_URL,
  checkoutHref,
} from "./checkout";

/* ── Seção 15 — O que torna o MPO diferente ───────────────── */

const TRADITIONAL = [
  "Conteúdo concentrado em vídeos",
  "Difícil encontrar uma informação específica",
  "Referências genéricas",
  "Pouca aplicação prática",
  "O aluno assiste e tenta lembrar depois",
];

const MPO_WAY = [
  "Conteúdo direto e consultável",
  "Recomendações personalizadas",
  "Ferramentas interativas",
  "Outfits filtrados por contexto",
  "Guarda-roupa organizado",
  "Progresso acompanhado",
  "Fit Check com IA",
  "Uso contínuo no dia a dia",
];

export function ComparisonSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
            Feito para ser usado, não apenas consumido.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-[#20242C] bg-white/[0.015] p-7 md:p-8">
              <p className="mb-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-[#A4AAB5]/70">
                Curso tradicional
              </p>
              <ul className="space-y-3.5">
                {TRADITIONAL.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#A4AAB5]/80">
                    <Minus className="mt-0.5 size-4 shrink-0 text-[#A4AAB5]/40" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-[#146CFF]/40 bg-gradient-to-b from-[#146CFF]/[0.09] to-[#0A0A0A] p-7 md:p-8">
              <div
                aria-hidden
                className="absolute -top-20 right-0 h-40 w-40"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(20,108,255,0.15) 0%, transparent 65%)",
                }}
              />
              <p className="relative mb-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-[#78A9FF]">
                MPO
              </p>
              <ul className="relative space-y-3.5">
                {MPO_WAY.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#F5F7FA]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#78A9FF]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <p className="mx-auto mt-10 max-w-2xl text-center leading-relaxed text-[#A4AAB5]">
            O objetivo não é fazer você decorar regras. É criar um sistema que
            ajude você a tomar decisões melhores toda vez que for se vestir ou
            comprar uma peça nova.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 16 — Raphael Pereira ───────────────────────────── */

const ARTIST_PHOTOS = Array.from({ length: 21 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `/images/raphael/artistas/artista-${n}.jpg`;
});

function ArtistMarquee() {
  return (
    <div className="relative mt-16 md:mt-20">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
Já vestiu os principais artistas da geração
      </p>
      <div className="marquee-mask relative overflow-hidden">
        <div className="marquee-track flex w-max">
          {[false, true].map((clone) => (
            <div
              key={clone ? "clone" : "original"}
              aria-hidden={clone || undefined}
              className="flex shrink-0 gap-4 pr-4"
            >
              {ARTIST_PHOTOS.map((src) => (
                <div
                  key={src}
                  className="relative aspect-[3/4] h-56 shrink-0 overflow-hidden rounded-xl border border-[#20242C] bg-[#111318] md:h-72"
                >
                  <Image
                    src={src}
                    alt={clone ? "" : "Artista vestido por Raphael Pereira"}
                    fill
                    sizes="(max-width: 768px) 168px, 216px"
                    quality={80}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RaphaelSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0A0A0A]">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent" />
      </div>
      <div className="relative mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <figure className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-[#20242C] bg-[#111318]">
              <Image
                src="/images/raphael/raphael.jpg"
                alt="Raphael Pereira, stylist e dono do MPO"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                quality={80}
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0A0A0A] to-transparent"
              />
              <figcaption className="absolute bottom-5 left-5 right-5">
                <p className="font-display text-lg font-bold text-[#F5F7FA]">
                  Raphael Pereira
                </p>
                <p className="text-xs text-[#A4AAB5]">
                  Stylist desde 2017 · Criador e dono do MPO
                </p>
              </figcaption>
            </figure>
          </Reveal>

          <div>
            <Reveal delay={100}>
              <p className="mb-4 inline-block rounded-full border border-[#146CFF]/40 bg-[#146CFF]/[0.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#78A9FF]">
                Quem está por trás do MPO
              </p>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                O MPO tem dono. E ele veste artista desde 2017.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 leading-relaxed text-[#A4AAB5]">
                Raphael Pereira é stylist desde 2017 e uma referência no meio.
                Em quase uma década de carreira, já vestiu os principais
                artistas da geração — construindo, outfit por outfit, o olhar
                que hoje está dentro do MPO.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <p className="mt-4 leading-relaxed text-[#A4AAB5]">
                Para o Rapha, moda nunca foi só profissão. Se vestir bem é o
                lifestyle dele: uma paixão que começou antes do trabalho e que
                ele vive todos os dias — no espelho e nos bastidores com os
                artistas.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-4 leading-relaxed text-[#A4AAB5]">
                No caminho, ainda fundou a própria marca, vestiu nomes como
                Matuê e participou de projetos com Renner e PlayStation. Mas é
                o repertório de stylist — de quem decide na prática o que
                funciona em cada corpo e contexto — que ele destilou na
                plataforma.
              </p>
            </Reveal>
            <Reveal delay={440}>
              <div className="mt-8 rounded-2xl border border-[#20242C] bg-[#050505] p-6">
                <p className="text-sm leading-relaxed text-[#F5F7FA]">
                  Não para transformar você em especialista em moda. Para ajudar
                  você a se vestir melhor{" "}
                  <span className="text-[#78A9FF]">
                    sem depender de opinião aleatória, tendência passageira ou
                    tentativa e erro
                  </span>
                  .
                </p>
              </div>
            </Reveal>
            <Reveal delay={500}>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {[
                  "Stylist desde 2017",
                  "Principais artistas da geração",
                  "Matuê",
                  "Renner",
                  "PlayStation",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#20242C] bg-white/[0.02] px-4 py-2 text-xs font-medium text-[#A4AAB5]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={200}>
          <ArtistMarquee />
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 17 — Para quem é ───────────────────────────────── */

const FOR_WHO = [
  "Abre o guarda-roupa e acaba usando sempre a mesma coisa",
  "Compra peças boas, mas tem dificuldade para combiná-las",
  "Quer parecer mais bem vestido sem usar roupa social o tempo todo",
  "Não sabe quais modelagens valorizam mais seu corpo",
  "Salva muitas referências, mas não consegue adaptá-las",
  "Quer montar um guarda-roupa mais inteligente",
  "Deseja passar mais presença e intenção através da imagem",
  "Quer receber uma opinião antes de sair com determinado outfit",
  "Não tem paciência para consumir um curso longo em vídeo",
];

export function ForWhoSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
            O MPO faz sentido para você que…
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOR_WHO.map((item, i) => (
            <Reveal key={item} delay={i * 60}>
              <div className="flex h-full items-start gap-3 rounded-xl border border-[#20242C] bg-[#0A0A0A] px-5 py-4 transition-colors hover:border-[#146CFF]/40">
                <Check className="mt-0.5 size-4 shrink-0 text-[#78A9FF]" aria-hidden />
                <p className="text-sm leading-relaxed text-[#A4AAB5]">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#146CFF]/30 bg-[#146CFF]/[0.05] p-6 text-center">
            <p className="font-display text-base font-bold text-[#F5F7FA]">
              Não é necessário entender de moda.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#A4AAB5]">
              A plataforma foi criada justamente para organizar o processo desde
              o começo.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 18 — Tudo que o aluno recebe ───────────────────── */

const DELIVERABLES = [
  "Quiz e diagnóstico personalizado",
  "Dashboard individual",
  "8 módulos",
  "37 aulas",
  "Lookbook com filtros avançados",
  "12 estilos masculinos",
  "Mais de 190 referências",
  "11 guias práticos",
  "Ferramentas interativas",
  "Dicionário do outfit",
  "Guarda-roupa inteligente",
  "Lista de compras",
  "Área de favoritos",
  "Plano de ação de 7 dias",
  "Fit Check com IA",
  "Histórico das análises",
  "Atualizações da plataforma",
];

export function StackSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
            Seu sistema completo de estilo.
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-12 rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-7 md:p-10">
            <ul className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {DELIVERABLES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#A4AAB5]">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#78A9FF]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-10 text-center">
            <a
              href="#planos"
              className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#146CFF] px-8 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)]"
            >
              VER OS PLANOS
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 19 — Planos ────────────────────────────────────── */

const PLAN_BENEFITS = [
  "Acesso completo à plataforma",
  "Dashboard personalizado",
  "Método com 37 aulas",
  "Lookbook completo",
  "190+ referências",
  "Guias e ferramentas interativas",
  "Guarda-roupa inteligente",
  "Plano de 7 dias",
  "Fit Check com IA",
  "Cupons exclusivos",
  "Atualizações durante o período de acesso",
];

export function PricingSection() {
  return (
    <section id="planos" className="relative scroll-mt-24 overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#146CFF]/40 to-transparent" />
        <div
          className="absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,108,255,0.08) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1080px] px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Escolha como quer acessar.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-5 leading-relaxed text-[#A4AAB5]">
              Você recebe acesso à mesma plataforma nos dois planos. A diferença
              está no período de cobrança.
            </p>
          </Reveal>
        </div>

        {/* Anual sempre primeiro — desktop e mobile */}
        <div className="mt-12 grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-start">
          {/* PLANO ANUAL */}
          <Reveal delay={150}>
            <div className="relative overflow-hidden rounded-2xl border border-[#146CFF]/60 bg-gradient-to-b from-[#146CFF]/[0.1] to-[#0c0e14] p-7 shadow-[0_0_60px_-18px_rgb(20_108_255/0.45)] md:p-9">
              <span className="absolute right-6 top-6 rounded-full bg-[#146CFF] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Mais vantajoso
              </span>
              <p className="font-display text-lg font-bold text-[#F5F7FA]">MPO Anual</p>
              <p className="mt-5 font-display text-5xl font-bold tracking-tight text-[#F5F7FA]">
                12x <span className="text-[#78A9FF]">de R$17</span>
              </p>
              <p className="mt-2 text-sm text-[#A4AAB5]">Total de R$204 por ano.</p>
              <p className="mt-3 inline-block rounded-lg bg-[#146CFF]/[0.14] px-3.5 py-2 text-xs font-semibold text-[#78A9FF]">
                Economize R$120 em comparação com 12 meses no plano mensal.
              </p>

              <ul className="mt-7 space-y-2.5">
                {PLAN_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-[#F5F7FA]/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#78A9FF]" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>

              <a
                href={checkoutHref(ANNUAL_CHECKOUT_URL)}
                className="mt-8 flex h-[54px] items-center justify-center rounded-xl bg-[#146CFF] text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)]"
              >
                QUERO O PLANO ANUAL
              </a>
            </div>
          </Reveal>

          {/* PLANO MENSAL */}
          <Reveal delay={250}>
            <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-7 md:p-9">
              <p className="font-display text-lg font-bold text-[#F5F7FA]">MPO Mensal</p>
              <p className="mt-5 font-display text-4xl font-bold tracking-tight text-[#F5F7FA]">
                R$27 <span className="text-lg font-semibold text-[#A4AAB5]">por mês</span>
              </p>
              <p className="mt-6 text-sm leading-relaxed text-[#A4AAB5]">
                Os mesmos recursos disponíveis no plano anual durante o período
                contratado.
              </p>
              <a
                href={checkoutHref(MONTHLY_CHECKOUT_URL)}
                className="mt-8 flex h-[54px] items-center justify-center rounded-xl border border-[#20242C] bg-white/[0.03] text-sm font-bold tracking-wide text-[#F5F7FA] transition-all hover:border-[#146CFF]/60 hover:bg-[#146CFF]/[0.08]"
              >
                QUERO O PLANO MENSAL
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <p className="mt-8 text-center text-xs text-[#A4AAB5]/70">
            O acesso é individual e vinculado à conta cadastrada.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 20 — FAQ ───────────────────────────────────────── */

const FAQ = [
  {
    q: "O MPO é um curso em vídeo?",
    a: "Não. A plataforma foi pensada para ser utilizada como uma ferramenta. O conteúdo principal está organizado em textos, referências, guias, checklists, filtros e componentes interativos.",
  },
  {
    q: "Preciso entender de moda?",
    a: "Não. O primeiro acesso ajuda a identificar seu perfil e a plataforma organiza os conteúdos a partir daí.",
  },
  {
    q: "O MPO serve para qualquer estilo?",
    a: "A plataforma trabalha com 12 estilos, incluindo Casual, Streetwear, Workwear, Smart Casual, Old Money, Preppy, Minimalista, Gorpcore, Vintage/Y2K, Techwear, Skater e Quiet Luxury.",
  },
  {
    q: "Como funciona o Fit Check?",
    a: "Você envia uma foto do outfit ou faz uma descrição por texto. A ferramenta analisa a combinação e apresenta pontos positivos, possíveis ajustes e uma nota geral.",
  },
  {
    q: "Existe limite para usar o Fit Check?",
    a: "Sim. A ferramenta possui um limite diário para manter a qualidade e a disponibilidade do serviço.",
  },
  {
    q: "Consigo usar pelo celular?",
    a: "Sim. Toda a experiência é responsiva e funciona em celulares, tablets e computadores.",
  },
  {
    q: "Vou precisar comprar um guarda-roupa novo?",
    a: "Não. Uma das primeiras propostas da plataforma é ajudar você a organizar e combinar melhor o que já possui antes de decidir o que vale comprar.",
  },
  {
    q: "O plano anual e o mensal possuem conteúdos diferentes?",
    a: "Não. Os dois dão acesso à mesma plataforma durante o período contratado.",
  },
  {
    q: "As recomendações são personalizadas?",
    a: "Sim. O onboarding identifica objetivo, dificuldade, percepção desejada, referências visuais e paleta preferida para orientar as recomendações iniciais.",
  },
  {
    q: "Os conteúdos podem ser atualizados?",
    a: "A plataforma pode receber novos conteúdos, referências e melhorias ao longo do tempo.",
  },
];

export function FaqSection() {
  return (
    <section id="duvidas" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[840px] px-5 md:px-8">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px]">
            Dúvidas antes de entrar?
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 50}>
              <details className="group rounded-2xl border border-[#20242C] bg-[#0A0A0A] transition-colors open:border-[#146CFF]/40 hover:border-[#146CFF]/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold text-[#F5F7FA] [&::-webkit-details-marker]:hidden md:text-[15px]">
                  {item.q}
                  <ChevronDown
                    className="size-4 shrink-0 text-[#78A9FF] transition-transform duration-300 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-[#A4AAB5]">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Seção 21 — CTA final ─────────────────────────────────── */

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(32,36,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(32,36,44,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-96 w-[680px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,108,255,0.12) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
        <Reveal>
          <p className="mb-5 inline-block rounded-full border border-[#20242C] bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
            Seu guarda-roupa já tem um ponto de partida
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-[#F5F7FA] md:text-[56px]">
            Agora falta transformar roupa em{" "}
            <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">
              estilo
            </span>
            .
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-[#A4AAB5]">
            Entre no MPO, descubra seu perfil e comece a organizar as peças,
            referências e combinações que fazem sentido para você.
          </p>
        </Reveal>
        <Reveal delay={280}>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#A4AAB5]/80">
            Sem precisar mudar quem você é. Só deixando mais claro o que a sua
            imagem comunica.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <a
            href={checkoutHref(ANNUAL_CHECKOUT_URL)}
            className="mt-10 inline-flex h-14 items-center justify-center rounded-xl bg-[#146CFF] px-10 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_50px_-8px_rgb(20_108_255/1)]"
          >
            DESCOBRIR MEU ESTILO
          </a>
        </Reveal>
        <Reveal delay={440}>
          <p className="mt-5 text-xs font-medium text-[#A4AAB5]/70">
            Planos a partir de 12x de R$17.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────── */

// PLACEHOLDERS — troque o "#" pelas URLs reais quando as páginas existirem
// (ex.: "/termos", "/privacidade", "mailto:suporte@...").
const FOOTER_LINKS = [
  { label: "Termos de uso", href: "#" },
  { label: "Política de privacidade", href: "#" },
  { label: "Suporte", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t border-[#20242C] bg-[#050505] py-12">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mpo-192.png"
              alt="Logo MPO"
              width={36}
              height={36}
              className="size-9 rounded-lg"
            />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-[#F5F7FA]">MPO</p>
              <p className="text-[11px] text-[#A4AAB5]">Manual Prático do Outfit</p>
            </div>
          </div>

          <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-7 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-[#A4AAB5] transition-colors hover:text-[#F5F7FA]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#20242C]/60 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-[#A4AAB5]/60">
            © {new Date().getFullYear()} MPO — Manual Prático do Outfit. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-[#A4AAB5]/50">
            Cupons sujeitos às condições e disponibilidade das marcas parceiras.
          </p>
        </div>
      </div>
    </footer>
  );
}
