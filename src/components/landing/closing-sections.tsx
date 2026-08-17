import Image from "next/image";
import { Check, ChevronDown, Minus, ShieldCheck } from "lucide-react";
import { Reveal } from "./reveal";
import { CheckoutLink } from "./checkout-link";
import {
  MONTHLY_CHECKOUT_URL,
  MONTHLY_PRICE,
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
  "Fits reais dos outros alunos",
  "Uso contínuo no dia a dia",
];

export function ComparisonSection() {
  return (
    <section className="relative py-8 md:py-14">
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
    <section className="relative overflow-hidden py-8 md:py-14">
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
                Quem montou os 228 outfits
              </p>
            </Reveal>
            <Reveal delay={150}>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                Não saiu de um gerador aleatório. Saiu do olho de quem veste
                artista desde 2017.
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
                O trabalho dele nunca foi colocar roupa cara em gente famosa —
                roupa cara qualquer um compra. É fazer com que a pessoa entre
                num lugar e mude a temperatura da sala. Controlar aquele
                julgamento de sete segundos antes que ele aconteça.
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
                  Cada outfit do MPO passou pelo mesmo critério que ele usa nos
                  bastidores: o que funciona em qual corpo, em qual contexto,
                  com qual proporção. A diferença é que agora isso está{" "}
                  <span className="text-[#78A9FF]">
                    no seu bolso por menos de R$1 por outfit
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
  "Você quer que a primeira impressão jogue a seu favor, não contra",
  "Você já foi “o cara legal” e quer ser olhado de outro jeito",
  "Você quer entrar numa reunião e ser levado a sério antes de abrir a boca",
  "Você entra nos lugares e sente que ninguém repara",
  "Você quer chegar num date sem a dúvida de “será que tá estranho?”",
  "Você tem peças boas e não sabe o que casa com o quê",
  "Você salva referência e nunca consegue reproduzir",
  "Você quer uma segunda opinião honesta antes de sair de casa",
  "Você não tem a menor paciência pra curso longo em vídeo",
];

export function ForWhoSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
            Isso é pra você se…
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
              Não precisa entender de moda. Não precisa comprar guarda-roupa
              novo.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#A4AAB5]">
              Os outfits de nível fácil começam com o que você já tem.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 18 — Tudo que o aluno recebe ───────────────────── */

const DELIVERABLES = [
  "228 outfits prontos",
  "Filtros por ocasião, clima, estilo, cor e nível",
  "16 estilos masculinos",
  "Fit Check com IA",
  "Guarda-roupa inteligente",
  "Lista de compras na ordem certa",
  "11 guias práticos",
  "3 ferramentas interativas",
  "Dicionário com 24 peças",
  "Plano de ação de 7 dias",
  "Método com 8 módulos e 37 aulas",
  "Comunidade de fits",
  "Área de favoritos",
  "Cupons de marcas parceiras",
  "Histórico das análises",
  "Dashboard individual",
  "Quiz e diagnóstico personalizado",
  "Atualizações da plataforma",
];

export function StackSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
            Tudo que entra no seu acesso.
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
            <CheckoutLink
              href={checkoutHref(MONTHLY_CHECKOUT_URL)}
              valor={MONTHLY_PRICE}
              className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#146CFF] px-8 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)]"
            >
              QUERO AS 228 COMBINAÇÕES
            </CheckoutLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 19 — Planos ────────────────────────────────────── */

const DESTAQUES = [
  { n: "228", t: "combinações prontas", d: "montadas por stylist, peça por peça" },
  { n: "37", t: "aulas em 8 módulos", d: "em texto, curtas e consultáveis" },
  { n: "16", t: "estilos destrinchados", d: "com fotos reais de referência" },
  { n: "11", t: "guias práticos", d: "corpo, cores, tecidos e proporção" },
];

const PLAN_BENEFITS = [
  "Fit Check com IA pra analisar seu outfit",
  "Guarda-roupa inteligente",
  "Plano de ação de 7 dias",
  "Dashboard e recomendações personalizadas",
  "Fits reais da comunidade",
  "Cupons de marcas parceiras",
  "Atualizações incluídas",
  "Acesso pelo celular, tablet e computador",
];

export function PricingSection() {
  return (
    <section id="planos" className="relative scroll-mt-24 overflow-hidden py-8 md:py-14">
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

      <div className="relative mx-auto max-w-[720px] px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Tudo isso por{" "}
              <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">
                R$27
              </span>
              .
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 leading-relaxed text-[#A4AAB5]">
              Menos de R$0,90 por dia. Uma peça errada no shopping custa mais
              que isso o ano inteiro — e a impressão errada custa bem mais do
              que dinheiro.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="relative mt-10 overflow-hidden rounded-2xl border border-[#146CFF]/60 bg-gradient-to-b from-[#146CFF]/[0.1] to-[#0c0e14] p-6 shadow-[0_0_70px_-20px_rgb(20_108_255/0.5)] md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(20,108,255,0.22) 0%, transparent 65%)",
              }}
            />

            <div className="relative text-center">
              <span className="inline-block rounded-full bg-[#146CFF] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Acesso completo
              </span>
              <p className="mt-5 font-display text-[44px] font-bold leading-none tracking-tight text-[#F5F7FA] md:text-6xl">
                R$27
              </p>
              {/* O período sai de cima do número, mas continua aqui: é o que
                  o visitante lê antes de decidir. */}
              <p className="mt-3 text-sm font-semibold text-[#78A9FF]">
                Assinatura mensal · cancele quando quiser
              </p>
            </div>

            {/* Números grandes: o que a pessoa leva na mão */}
            <div className="relative mt-8 grid grid-cols-2 gap-3">
              {DESTAQUES.map((item) => (
                <div
                  key={item.t}
                  className="rounded-xl border border-[#20242C] bg-[#0A0A0A]/70 p-4"
                >
                  <p className="font-display text-2xl font-bold leading-none tracking-tight text-[#78A9FF] md:text-3xl">
                    {item.n}
                  </p>
                  <p className="mt-1.5 text-[13px] font-semibold leading-snug text-[#F5F7FA]">
                    {item.t}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[#A4AAB5]">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>

            <ul className="relative mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {PLAN_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] text-[#F5F7FA]/90">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#78A9FF]" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>

            <CheckoutLink
              href={checkoutHref(MONTHLY_CHECKOUT_URL)}
              valor={MONTHLY_PRICE}
              className="relative mt-8 flex min-h-[56px] items-center justify-center rounded-xl bg-[#146CFF] px-6 py-3 text-center text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_45px_-8px_rgb(20_108_255/1)]"
            >
              QUERO AS 228 COMBINAÇÕES
            </CheckoutLink>

            <p className="relative mt-3 text-center text-xs text-[#A4AAB5]/80">
              Acesso liberado na hora, direto no seu e-mail.
            </p>
          </div>
        </Reveal>

        {/* Garantia legal (CDC art. 49) — está na página de reembolso, então
            precisa aparecer aqui também, ao lado do preço. */}
        <Reveal delay={250}>
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#146CFF]/30 bg-[#146CFF]/[0.05] p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#146CFF]/40 bg-[#146CFF]/[0.1] text-[#78A9FF]">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-base font-bold text-[#F5F7FA]">
                Teste tudo. Se não valer, você não paga nada.
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#A4AAB5]">
                Entre, abra as 228 combinações, monte três looks com o que você
                já tem e use o Fit Check. Se em 7 dias achar que não valeu, pede
                o reembolso e devolvemos 100%.{" "}
                <a
                  href="/reembolso"
                  className="font-medium text-[#78A9FF] hover:underline"
                >
                  Ver a política
                </a>
                .
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-6 text-center text-xs text-[#A4AAB5]/70">
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
    q: "Preciso comprar as peças exatas dos outfits?",
    a: "Não. Os outfits são descritos por tipo de peça, não por marca. E o filtro “já tenho as peças” mostra primeiro o que você monta hoje sem gastar nada. O conteúdo é em texto, consultável, não um curso em vídeo.",
  },
  {
    q: "Preciso entender de moda?",
    a: "Não. Você escolhe a ocasião e recebe o outfit pronto, com a explicação do porquê funciona. O entendimento vem de usar, não de estudar.",
  },
  {
    q: "O MPO serve para qualquer estilo?",
    a: "A plataforma trabalha com 16 estilos: Casual, Streetwear, Workwear, Smart Casual, Old Money, Preppy, Minimalista, Gorpcore, Vintage/Y2K, Techwear, Skater, Quiet Luxury, US Drip, Opium, Sportlife e Boho.",
  },
  {
    q: "Como funciona o Fit Check?",
    a: "Você envia uma foto do outfit ou faz uma descrição por texto. A ferramenta analisa a combinação e apresenta pontos positivos, possíveis ajustes e uma nota geral.",
  },
  {
    q: "Existe limite para usar o Fit Check?",
    a: "Sim. Você começa com 5 análises de foto incluídas e pode conversar por texto com o consultor até 20 mensagens por dia — o contador zera à meia-noite. Se quiser mais análises de foto, existem pacotes avulsos dentro da plataforma.",
  },
  {
    q: "Como recebo o acesso depois de comprar?",
    a: "A liberação é automática. Assim que o pagamento é confirmado, você recebe no e-mail da compra um link para criar sua senha e entrar. O link vale 30 dias, então não tem pressa nem risco de expirar antes de você abrir o e-mail.",
  },
  {
    q: "Tem garantia?",
    a: "Sim. Você tem 7 dias corridos a partir da compra para pedir reembolso integral, sem precisar justificar — é o direito de arrependimento previsto no Código de Defesa do Consumidor. Basta escrever para o suporte.",
  },
  {
    q: "Existe uma comunidade?",
    a: "Sim. Na área de Refs você publica os seus próprios fits e vê os fits reais dos outros alunos, podendo curtir, salvar e comentar. Todo fit enviado passa por aprovação antes de ficar visível, para manter a área organizada.",
  },
  {
    q: "O que são os bônus da plataforma?",
    a: "São 10 conteúdos extras opcionais — como corte ideal para o seu rosto, montar a mala, ficar bem nas fotos, círculo cromático e o grupo no WhatsApp. Eles não estão inclusos nos planos: são vendidos à parte, com liberação automática. Uma vez comprado, o bônus é seu para sempre — mas, como ele fica dentro da plataforma, você precisa estar com o MPO ativo para acessá-lo.",
  },
  {
    q: "Como funciona a cobrança?",
    a: "O MPO é uma assinatura mensal de R$27. A cobrança se repete todo mês no mesmo dia, e você mantém o acesso enquanto ela estiver ativa. Pode cancelar quando quiser, direto com o suporte, sem multa nem fidelidade — e nos primeiros 7 dias ainda vale o reembolso integral.",
  },
  {
    q: "O que acontece quando meu acesso termina?",
    a: "Você perde o acesso às áreas da plataforma, mas nada do que você preencheu é apagado: guarda-roupa, favoritos, progresso e análises continuam salvos e voltam do jeito que estavam se você renovar.",
  },
  {
    q: "Consigo usar pelo celular?",
    a: "Sim. Toda a experiência é responsiva e funciona em celulares, tablets e computadores.",
  },
  {
    q: "Vou precisar comprar um guarda-roupa novo?",
    a: "Não. Boa parte dos outfits de nível fácil se monta com peças que você provavelmente já tem. O guarda-roupa inteligente mostra o que falta e em que ordem comprar, se você quiser.",
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
    <section id="duvidas" className="relative scroll-mt-24 py-8 md:py-14">
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
    <section className="relative overflow-hidden py-12 md:py-20">
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
            São 228 outfits esperando você
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-[#F5F7FA] md:text-[56px]">
            Amanhã você vai causar uma primeira impressão.{" "}
            <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">
              A única escolha é qual
            </span>
            .
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-[#A4AAB5]">
            Ela vai acontecer com ou sem a sua participação. São 228 combinações
            prontas esperando você escolher a ocasião — mais o Fit Check, o
            guarda-roupa inteligente, os guias e o método inteiro, por R$27.
          </p>
        </Reveal>
        <Reveal delay={280}>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#A4AAB5]/80">
            Entra hoje, abre as 228 combinações e testa por 7 dias. Se não
            valer, devolvemos 100% — você não arrisca um centavo.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <CheckoutLink
            href={checkoutHref(MONTHLY_CHECKOUT_URL)}
            valor={MONTHLY_PRICE}
            className="mt-10 inline-flex h-14 items-center justify-center rounded-xl bg-[#146CFF] px-10 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_50px_-8px_rgb(20_108_255/1)]"
          >
            QUERO AS 228 COMBINAÇÕES AGORA
          </CheckoutLink>
        </Reveal>
        <Reveal delay={440}>
          <p className="mt-5 text-xs font-medium text-[#A4AAB5]/70">
            Acesso liberado na hora · R$27 · 7 dias de garantia incondicional
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
  // O mobile não tem mais menu no topo, então este é o único caminho de
  // login para quem já é aluno.
  { label: "Já sou membro", href: "/login" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Política de privacidade", href: "/privacidade" },
  { label: "Reembolso", href: "/reembolso" },
  { label: "Suporte", href: "mailto:suporte@manualpraticodooutfit.com.br" },
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
