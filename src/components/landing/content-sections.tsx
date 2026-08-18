import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Check,
  Grid3x3,
  Palette,
  Ruler,
  ShoppingBag,
} from "lucide-react";
import { Reveal } from "./reveal";

/* ── Seção 9.5 — O método, módulo por módulo ──────────────── */

/**
 * Currículo real da plataforma: títulos, capas e número de aulas saem da
 * tabela `modules`/`lessons` do banco. Se um módulo for renomeado, trocar de
 * capa ou ganhar aula lá dentro, esta lista precisa ser atualizada junto — é
 * a única parte da página de vendas que promete conteúdo nome por nome.
 *
 * As capas são pôsteres 4:5 com o nome do módulo já impresso na arte; por
 * isso os cards da esteira não repetem o título por escrito.
 */
const MODULES = [
  { n: 1, title: "Boas Vindas", lessons: 4, capa: "/modulos/01-boas-vindas.webp" },
  { n: 2, title: "Fundamentos", lessons: 6, capa: "/modulos/02-fundamentos.webp" },
  { n: 3, title: "Armário Essencial", lessons: 4, capa: "/modulos/03-armario-essencial.webp" },
  {
    n: 4,
    title: "Combinações Inteligentes",
    lessons: 7,
    capa: "/modulos/04-combinacoes-inteligentes.webp",
  },
  { n: 5, title: "Cores", lessons: 5, capa: "/modulos/05-cores.webp" },
  {
    n: 6,
    title: "Roupas pra Tipo de Corpo",
    lessons: 4,
    capa: "/modulos/06-roupas-tipo-de-corpo.webp",
  },
  { n: 7, title: "Tamanho e Caimento", lessons: 4, capa: "/modulos/07-tamanho-e-caimento.webp" },
  { n: 8, title: "Use o MPO no Dia a Dia", lessons: 4, capa: "/modulos/08-mpo-no-dia-a-dia.webp" },
];

const TOTAL_AULAS = MODULES.reduce((s, m) => s + m.lessons, 0);

export function MethodSection() {
  return (
    <section id="metodo" className="relative scroll-mt-24 py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              O método completo
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              8 módulos, {TOTAL_AULAS} aulas — e você sabe exatamente o que tem
              dentro.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              As aulas são em texto, curtas e diretas: você lê em poucos minutos
              e volta para consultar sempre que precisar, sem procurar o minuto
              certo de um vídeo de 40 minutos.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Esteira automática e infinita das capas. Duas cópias da lista: o
          keyframe anda -50%, então a segunda entra exatamente onde a primeira
          saiu. Roda ao contrário da esteira dos estilos, para as duas não
          parecerem a mesma faixa. */}
      <Reveal delay={250}>
        <div className="marquee-mask relative mt-12 overflow-hidden">
          <div
            className="marquee-track flex w-max hover:[animation-play-state:paused]"
            style={{ animationDuration: "44s", animationDirection: "reverse" }}
          >
            {[false, true].map((clone) => (
              <div
                key={clone ? "clone" : "original"}
                aria-hidden={clone || undefined}
                className="flex shrink-0 gap-4 pr-4"
              >
                {MODULES.map((mod) => (
                  <article
                    key={mod.n}
                    className="group relative w-44 shrink-0 overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] transition-all hover:border-[#146CFF]/60 md:w-56"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={mod.capa}
                        alt={clone ? "" : `Capa do módulo ${mod.n} — ${mod.title}`}
                        fill
                        sizes="(max-width: 768px) 176px, 224px"
                        quality={70}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                      <span className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-[#F5F7FA] backdrop-blur-md">
                        {mod.lessons} aulas
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        {/* Lista escrita: a esteira anda, e quem quiser conferir nome por nome
            (inclusive leitor de tela) tem tudo parado aqui. */}
        <Reveal delay={300}>
          <ul className="mt-10 flex flex-wrap justify-center gap-2">
            {MODULES.map((mod) => (
              <li
                key={mod.n}
                className="flex items-center gap-2 rounded-full border border-[#20242C] bg-[#0A0A0A] py-1.5 pl-2 pr-3.5"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-[#146CFF]/[0.14] text-[10px] font-bold text-[#78A9FF]">
                  {mod.n}
                </span>
                <span className="text-xs font-medium text-[#F5F7FA]">{mod.title}</span>
                <span className="text-[10px] text-[#A4AAB5]">{mod.lessons} aulas</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={350}>
          <p className="mt-8 text-center text-sm leading-relaxed text-[#A4AAB5]/80">
            O progresso de cada aula fica salvo, e o dashboard sempre mostra de
            onde você parou.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 10 — Os 16 estilos ─────────────────────────────── */

const STYLES = [
  { slug: "casual", nome: "Casual", tagline: "O básico bem executado", refs: 10 },
  { slug: "streetwear", nome: "Streetwear", tagline: "O estilo urbano mais popular", refs: 19 },
  { slug: "workwear", nome: "Workwear", tagline: "Inspirado em uniformes de trabalho", refs: 19 },
  { slug: "smartcasual", nome: "Smart Casual", tagline: "Arrumado sem gravata", refs: 10 },
  { slug: "oldmoney", nome: "Old Money", tagline: "Clássico e sofisticado", refs: 22 },
  { slug: "preppy", nome: "Preppy", tagline: "Clássico universitário revisitado", refs: 10 },
  { slug: "minimalista", nome: "Minimalista", tagline: "Menos peças, mais intenção", refs: 24 },
  { slug: "gorpcore", nome: "Gorpcore", tagline: "Estética outdoor no dia a dia", refs: 23 },
  { slug: "vintage", nome: "Vintage/Y2K", tagline: "Referências dos anos 90 e 2000", refs: 26 },
  { slug: "techwear", nome: "Techwear", tagline: "Moda funcional e futurista", refs: 9 },
  { slug: "skater", nome: "Skater", tagline: "Cultura do skate dos anos 90 e 2000", refs: 10 },
  { slug: "quietluxury", nome: "Quiet Luxury", tagline: "Sofisticação sem ostentação", refs: 8 },
  { slug: "usdrip", nome: "US Drip", tagline: "O visual do rap americano", refs: 10 },
  { slug: "opium", nome: "Opium", tagline: "Preto total com peso gótico", refs: 8 },
  { slug: "sportlife", nome: "Sportlife", tagline: "Camisa de time como peça de estilo", refs: 10 },
  { slug: "boho", nome: "Boho", tagline: "Leveza artesanal em tons naturais", refs: 10 },
];

export function StylesSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Entenda as referências antes de escolher as suas.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              Ninguém precisa seguir um estilo só — dá pra misturar Streetwear
              com Workwear, Minimalista com Quiet Luxury. A plataforma mostra o
              que define cada um e como isso aparece em outfits reais.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Esteira automática e infinita. Duas cópias da lista: o keyframe
          anda -50%, então a segunda entra exatamente onde a primeira saiu. */}
      <Reveal delay={250}>
        <div className="marquee-mask relative mt-12 overflow-hidden">
          <div
            className="marquee-track flex w-max hover:[animation-play-state:paused]"
            style={{ animationDuration: "50s" }}
          >
            {[false, true].map((clone) => (
              <div
                key={clone ? "clone" : "original"}
                aria-hidden={clone || undefined}
                className="flex shrink-0 gap-4 pr-4"
              >
                {STYLES.map((style) => (
                  <article
                    key={style.slug}
                    className="group relative w-56 shrink-0 overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] transition-all hover:border-[#146CFF]/60 md:w-64"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={`/estilos/${style.slug}/01.jpg`}
                        alt={clone ? "" : `Referência do estilo ${style.nome}`}
                        fill
                        sizes="256px"
                        quality={70}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-[#F5F7FA] backdrop-blur-md">
                        {style.refs} refs
                      </span>
                    </div>
                    <div className="relative -mt-14 p-5">
                      <h3 className="font-display text-lg font-bold text-[#F5F7FA]">
                        {style.nome}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#A4AAB5]">{style.tagline}</p>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#78A9FF] transition-colors group-hover:text-[#F5F7FA]">
                        Explorar estilo <ArrowRight className="size-3.5" aria-hidden />
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={300}>
        <p className="mt-8 text-center font-display text-sm font-semibold tracking-wide text-[#F5F7FA]">
          São <span className="text-[#78A9FF]">228 fotos reais</span> de
          referência organizadas por estilo.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Seção 11 — Guias práticos ────────────────────────────── */

const GUIDES = [
  "Como tirar suas medidas",
  "Como combinar acessórios",
  "Como combinar cores",
  "A modelagem ideal para o seu tipo de corpo",
  "Hacks rápidos para se vestir melhor",
  "A calça ideal para cada tipo de tênis",
  "O tênis ideal para cada roupa",
  "Monte 27 outfits com 9 peças",
  "As melhores marcas para comprar",
  "Como fazer suas peças durarem mais",
  "Combinações simples com jeans",
];

const INTERACTIVE_GUIDES = [
  {
    icon: Ruler,
    title: "Suas medidas",
    text: "Registre as próprias medidas e mantenha tudo salvo para consultar antes de comprar.",
  },
  {
    icon: Palette,
    title: "Combinador de cores",
    text: "Escolha uma cor e veja quais tons criam combinações equilibradas com ela.",
  },
  {
    icon: Grid3x3,
    title: "Cápsula de 27 outfits",
    text: "Cadastre nove peças e visualize como transformá-las em até 27 combinações.",
  },
];

export function GuidesSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Respostas diretas para as dúvidas que aparecem na hora de se vestir.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              Os guias foram escritos para serem consultados no momento em que
              você precisa. Sem enrolação, introduções longas ou uma aula de 40
              minutos para explicar uma combinação.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Lista dos 11 guias */}
          <Reveal delay={150}>
            <ol className="space-y-2">
              {GUIDES.map((guide, i) => (
                <li
                  key={guide}
                  className="flex items-center gap-3.5 rounded-xl border border-[#20242C] bg-white/[0.015] px-4 py-3 transition-colors hover:border-[#146CFF]/40"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#146CFF]/[0.1] font-display text-[11px] font-bold text-[#78A9FF]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-[#A4AAB5]">{guide}</span>
                  <BookOpen className="ml-auto size-3.5 shrink-0 text-[#A4AAB5]/40" aria-hidden />
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Guias interativos em destaque */}
          <div className="flex flex-col gap-4">
            <Reveal delay={200}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
                Ferramentas interativas
              </p>
            </Reveal>
            {INTERACTIVE_GUIDES.map((g, i) => (
              <Reveal key={g.title} delay={250 + i * 100}>
                <div className="group flex gap-5 rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-6 transition-all hover:-translate-y-0.5 hover:border-[#146CFF]/50">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#20242C] bg-[#146CFF]/[0.08] text-[#78A9FF] transition-colors group-hover:bg-[#146CFF]/[0.16]">
                    <g.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F5F7FA]">
                      {g.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#A4AAB5]">
                      {g.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={550}>
              <div className="rounded-2xl border border-[#146CFF]/30 bg-[#146CFF]/[0.05] p-6">
                <p className="text-sm leading-relaxed text-[#F5F7FA]">
                  Aproximadamente{" "}
                  <span className="font-bold text-[#78A9FF]">79 minutos</span>{" "}
                  de conteúdo prático, dividido em guias fáceis de consultar.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Seção 12 — Dicionário do outfit ──────────────────────── */

const GLOSSARY = [
  { nome: "Boxy tee", desc: "camiseta larga e quadrada" },
  { nome: "Oversized tee", desc: "camiseta ampla e comprida" },
  { nome: "Baggy jeans", desc: "jeans largo" },
  { nome: "Parachute pants", desc: "calça leve e ampla" },
  { nome: "Jorts", desc: "bermuda jeans larga" },
  { nome: "Football jersey", desc: "camisa esportiva" },
  { nome: "Trucker jacket", desc: "jaqueta jeans curta" },
  { nome: "Retro runner", desc: "tênis de corrida retrô" },
  { nome: "Five panel cap", desc: "boné de cinco painéis" },
];

export function GlossarySection() {
  return (
    <section className="relative py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              Dicionário do outfit
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Você sabe qual peça quer.{" "}
              <span className="text-[#A4AAB5]">Só não sabe o nome dela.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              Muita gente encontra uma roupa interessante em uma referência, mas
              não consegue pesquisar ou pedir a peça porque não sabe como ela é
              chamada. O dicionário do outfit resolve isso.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {GLOSSARY.map((item, i) => (
            <Reveal key={item.nome} delay={i * 70}>
              <div className="group rounded-xl border border-[#20242C] bg-[#0A0A0A] p-5 transition-all hover:-translate-y-0.5 hover:border-[#146CFF]/50">
                <p className="font-display text-sm font-bold text-[#F5F7FA] md:text-base">
                  {item.nome}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#A4AAB5] md:text-[13px]">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p className="mt-8 text-center text-sm leading-relaxed text-[#A4AAB5]/80">
            São <span className="font-semibold text-[#F5F7FA]">24 peças catalogadas</span>{" "}
            com nome, tradução prática, descrição e referência visual para você
            saber exatamente o que procurar.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 13 — Guarda-roupa inteligente ──────────────────── */

const WARDROBE_CATEGORIES = [
  "Camisetas",
  "Camisas",
  "Calças",
  "Jaquetas",
  "Calçados",
  "Acessórios",
];

const WARDROBE_LEVELS = [
  { nome: "Essencial", desc: "compre primeiro", cor: "text-[#78A9FF] border-[#146CFF]/50 bg-[#146CFF]/[0.08]" },
  { nome: "Intermediária", desc: "depois de montar a base", cor: "text-[#A4AAB5] border-[#20242C] bg-white/[0.02]" },
  { nome: "Avançada", desc: "peças para elevar as combinações", cor: "text-[#A4AAB5] border-[#20242C] bg-white/[0.02]" },
];

export function WardrobeSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                Saiba o que você tem, o que falta e o que vale comprar primeiro.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 leading-relaxed text-[#A4AAB5]">
                São 30 peças mapeadas em 6 categorias e 3 níveis de prioridade.
                Você marca o que já possui, adiciona o que deseja comprar e evita
                gastar dinheiro em roupas que não se conectam com o restante do
                guarda-roupa.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-7 flex flex-wrap gap-2">
                {WARDROBE_CATEGORIES.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-[#20242C] bg-white/[0.02] px-4 py-2 text-xs font-medium text-[#A4AAB5]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-6 space-y-2.5">
                {WARDROBE_LEVELS.map((nivel) => (
                  <div
                    key={nivel.nome}
                    className={`flex items-baseline gap-3 rounded-xl border px-4 py-3 ${nivel.cor}`}
                  >
                    <span className="font-display text-sm font-bold">{nivel.nome}</span>
                    <span className="text-xs opacity-80">— {nivel.desc}</span>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-8 border-l-2 border-[#146CFF]/50 pl-4 text-sm leading-relaxed text-[#A4AAB5]/85">
                Você deixa de comprar porque a peça parecia bonita sozinha e
                começa a comprar porque sabe quantas combinações consegue montar
                com ela.
              </p>
            </Reveal>
          </div>

          {/* Mini interface do guarda-roupa */}
          <Reveal delay={200}>
            <div className="rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-6 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] md:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-sm font-bold text-[#F5F7FA]">
                  Meu guarda-roupa
                </p>
                <span className="rounded-full bg-[#146CFF]/[0.12] px-3 py-1 text-[10px] font-semibold text-[#78A9FF]">
                  17 de 30 peças
                </span>
              </div>
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-[11px]">
                  <span className="text-[#A4AAB5]">Progresso do essencial</span>
                  <span className="font-semibold text-[#78A9FF]">58%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full w-[58%] rounded-full bg-gradient-to-r from-[#146CFF] to-[#78A9FF]" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { peca: "Camiseta branca de qualidade", nivel: "Essencial", status: "ja-tenho" },
                  { peca: "Calça reta em tom neutro", nivel: "Essencial", status: "ja-tenho" },
                  { peca: "Overshirt versátil", nivel: "Intermediária", status: "quero" },
                  { peca: "Jaqueta de couro ou suede", nivel: "Avançada", status: "quero" },
                ].map((row) => (
                  <div
                    key={row.peca}
                    className="flex items-center gap-3 rounded-xl border border-[#20242C] bg-[#111318] px-4 py-3"
                  >
                    <span
                      className={
                        row.status === "ja-tenho"
                          ? "flex size-5 shrink-0 items-center justify-center rounded-md border border-[#146CFF] bg-[#146CFF]"
                          : "size-5 shrink-0 rounded-md border border-[#20242C]"
                      }
                    >
                      {row.status === "ja-tenho" && (
                        <Check className="size-3.5 text-white" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#F5F7FA]">
                        {row.peca}
                      </p>
                      <p className="text-[10px] text-[#A4AAB5]/70">{row.nivel}</p>
                    </div>
                    <span
                      className={
                        row.status === "ja-tenho"
                          ? "ml-auto shrink-0 text-[10px] font-semibold text-[#2fbf71]"
                          : "ml-auto flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#78A9FF]"
                      }
                    >
                      {row.status === "ja-tenho" ? (
                        "Já tenho"
                      ) : (
                        <>
                          <ShoppingBag className="size-3" aria-hidden /> Quero comprar
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Seção 14 — Plano de ação de 7 dias ───────────────────── */

const PLAN_DAYS = [
  {
    dia: 1,
    titulo: "Diagnóstico do guarda-roupa",
    texto: "Organize as peças, identifique o que não serve e anote o que está faltando.",
  },
  {
    dia: 2,
    titulo: "Monte três outfits básicos",
    texto: "Crie três combinações simples com o que você já possui.",
  },
  {
    dia: 3,
    titulo: "Teste uma combinação neutra",
    texto: "Monte um outfit usando apenas tons neutros.",
  },
  {
    dia: 4,
    titulo: "Use uma terceira peça",
    texto: "Adicione uma jaqueta, camisa aberta ou overshirt.",
  },
  {
    dia: 5,
    titulo: "Ajuste calçado e acessórios",
    texto: "Mude a leitura do outfit utilizando os detalhes.",
  },
  {
    dia: 6,
    titulo: "Monte um outfit para sair",
    texto: "Prepare uma combinação completa para uma ocasião noturna.",
  },
  {
    dia: 7,
    titulo: "Fotografe e salve referências",
    texto: "Registre o que funcionou e crie seu próprio banco de referências.",
  },
];

export function PlanSection() {
  return (
    <section className="relative py-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Em sete dias, você já começa a enxergar seu guarda-roupa de outro jeito.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              O plano transforma o conteúdo em pequenas ações. Você não precisa
              refazer seu estilo inteiro de uma vez. Só precisa cumprir uma
              missão por dia.
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute left-[19px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-[#146CFF]/60 via-[#20242C] to-transparent md:block"
          />
          <ol className="space-y-4 md:space-y-5">
            {PLAN_DAYS.map((dia, i) => (
              <Reveal key={dia.dia} delay={i * 80} as="li">
                <div className="flex gap-5">
                  <span
                    className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold ${
                      dia.dia <= 4
                        ? "border-[#146CFF] bg-[#146CFF]/[0.14] text-[#78A9FF]"
                        : "border-[#20242C] bg-[#0A0A0A] text-[#A4AAB5]"
                    }`}
                  >
                    {dia.dia}
                  </span>
                  <div className="flex-1 rounded-2xl border border-[#20242C] bg-[#0A0A0A] px-5 py-4 transition-colors hover:border-[#146CFF]/40 md:px-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78A9FF]">
                      Dia {dia.dia}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-[#F5F7FA]">
                      {dia.titulo}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#A4AAB5]">
                      {dia.texto}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={300}>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {["Progresso salvo", "Anotações pessoais", "Checklist diário", "Acompanhamento no dashboard"].map(
              (item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[#20242C] bg-white/[0.02] px-4 py-2 text-xs font-medium text-[#A4AAB5]"
                >
                  <Check className="size-3.5 text-[#78A9FF]" aria-hidden />
                  {item}
                </span>
              )
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
