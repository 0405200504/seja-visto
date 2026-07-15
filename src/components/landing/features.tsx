import Image from "next/image";
import {
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Compass,
  Heart,
  LayoutDashboard,
  Layers,
  Plus,
  Shirt,
  Star,
} from "lucide-react";
import { Reveal, ProgressFill } from "./reveal";
import { ANNUAL_CHECKOUT_URL, checkoutHref } from "./checkout";

/* ── Seção 7 — Bento grid de funcionalidades ──────────────── */

export function FeaturesSection() {
  return (
    <section id="recursos" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              Tudo dentro da mesma plataforma
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Do primeiro diagnóstico até o outfit pronto.
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard — card maior */}
          <Reveal className="lg:col-span-2">
            <BentoCard
              icon={LayoutDashboard}
              title="Dashboard personalizado"
              text="Acompanhe seu progresso, veja seu estilo principal, continue de onde parou e receba outfits filtrados para o seu perfil."
            >
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#20242C] bg-[#111318] p-3.5">
                  <p className="text-[10px] font-medium text-[#A4AAB5]">Progresso geral</p>
                  <p className="mt-1 mb-2 font-display text-lg font-bold text-[#F5F7FA]">62%</p>
                  <ProgressFill percent={62} />
                </div>
                <div className="rounded-xl border border-[#146CFF]/30 bg-[#146CFF]/[0.06] p-3.5">
                  <p className="text-[10px] font-medium text-[#78A9FF]">Continue de onde parou</p>
                  <p className="mt-1 text-xs font-semibold leading-snug text-[#F5F7FA]">
                    Módulo 3 · Cores e combinações
                  </p>
                  <p className="mt-2 text-[10px] text-[#A4AAB5]">Aula 4 de 6</p>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* Método */}
          <Reveal delay={100}>
            <BentoCard
              icon={Layers}
              title="Método completo"
              text="São 8 módulos e 37 aulas em texto, organizadas para você aprender no seu ritmo e consultar sempre que precisar."
            >
              <div className="mt-5 space-y-2">
                {["Fundamentos do estilo", "Modelagem e caimento", "Cores e combinações"].map(
                  (mod, i) => (
                    <div
                      key={mod}
                      className="flex items-center gap-2.5 rounded-lg border border-[#20242C] bg-[#111318] px-3 py-2"
                    >
                      <span className="flex size-5 items-center justify-center rounded-md bg-[#146CFF]/[0.14] text-[9px] font-bold text-[#78A9FF]">
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-medium text-[#A4AAB5]">{mod}</span>
                    </div>
                  )
                )}
              </div>
            </BentoCard>
          </Reveal>

          {/* Lookbook */}
          <Reveal delay={150}>
            <BentoCard
              icon={Compass}
              title="Lookbook inteligente"
              text="Encontre combinações prontas por ocasião, estilo, clima, nível e cor base."
            >
              <div className="mt-5 flex flex-wrap gap-1.5" aria-hidden>
                {["Date", "Trabalho", "Calor", "Streetwear", "Neutros"].map((chip, i) => (
                  <span
                    key={chip}
                    className={
                      i === 0
                        ? "rounded-full border border-[#146CFF]/60 bg-[#146CFF]/[0.12] px-2.5 py-1 text-[10px] font-medium text-[#78A9FF]"
                        : "rounded-full border border-[#20242C] px-2.5 py-1 text-[10px] font-medium text-[#A4AAB5]"
                    }
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </BentoCard>
          </Reveal>

          {/* 12 estilos */}
          <Reveal delay={200}>
            <BentoCard
              icon={Star}
              title="12 estilos masculinos"
              text="Entenda Casual, Streetwear, Workwear, Smart Casual, Old Money, Preppy, Minimalista, Gorpcore, Vintage/Y2K, Techwear, Skater e Quiet Luxury."
            >
              <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden>
                {["casual", "streetwear", "minimalista", "oldmoney"].map((s) => (
                  <div
                    key={s}
                    className="relative aspect-square overflow-hidden rounded-md border border-[#20242C]"
                  >
                    <Image
                      src={`/estilos/${s}/01.jpg`}
                      alt=""
                      fill
                      sizes="80px"
                      quality={70}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </BentoCard>
          </Reveal>

          {/* Guias */}
          <Reveal delay={250}>
            <BentoCard
              icon={BookOpen}
              title="Guias práticos"
              text="Aprenda sobre medidas, cores, modelagens, acessórios, tênis, calças, cuidados com as peças e guarda-roupa cápsula."
            />
          </Reveal>

          {/* Guarda-roupa */}
          <Reveal delay={300}>
            <BentoCard
              icon={Shirt}
              title="Guarda-roupa essencial"
              text="Marque o que já possui, descubra o que falta e saiba quais peças comprar primeiro."
            >
              <div className="mt-5 space-y-2" aria-hidden>
                {[
                  { item: "Camiseta branca de qualidade", done: true },
                  { item: "Calça reta neutra", done: true },
                  { item: "Jaqueta versátil", done: false },
                ].map((row) => (
                  <div key={row.item} className="flex items-center gap-2.5 text-[11px]">
                    <span
                      className={
                        row.done
                          ? "flex size-4 items-center justify-center rounded border border-[#146CFF] bg-[#146CFF]"
                          : "size-4 rounded border border-[#20242C]"
                      }
                    >
                      {row.done && <Check className="size-3 text-white" />}
                    </span>
                    <span className={row.done ? "text-[#A4AAB5]" : "text-[#A4AAB5]/60"}>
                      {row.item}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </Reveal>

          {/* Plano de 7 dias */}
          <Reveal delay={350}>
            <BentoCard
              icon={Calendar}
              title="Plano de 7 dias"
              text="Saia da teoria e reorganize o seu guarda-roupa com pequenas missões diárias."
            >
              <div className="mt-5 flex gap-1.5" aria-hidden>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <span
                    key={d}
                    className={`flex h-8 flex-1 items-center justify-center rounded-md text-[10px] font-bold ${
                      d <= 4
                        ? "bg-[#146CFF]/[0.16] text-[#78A9FF]"
                        : "border border-[#20242C] text-[#A4AAB5]/50"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </BentoCard>
          </Reveal>

          {/* Fit Check */}
          <Reveal delay={400} className="md:col-span-2 lg:col-span-2">
            <BentoCard
              icon={Camera}
              title="Fit Check com IA"
              text="Envie uma foto ou descreva o outfit e receba uma análise sobre o que está funcionando e o que pode melhorar."
              highlight
            >
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#146CFF]/30 bg-[#146CFF]/[0.06] px-4 py-3" aria-hidden>
                <Camera className="size-4 shrink-0 text-[#78A9FF]" />
                <p className="text-[11px] text-[#A4AAB5]">
                  &ldquo;A paleta funciona bem. Testar um tênis com menos volume deixaria o
                  outfit mais equilibrado.&rdquo;
                </p>
                <span className="ml-auto shrink-0 rounded-lg bg-[#146CFF] px-2.5 py-1 font-display text-xs font-bold text-white">
                  8,7
                </span>
              </div>
            </BentoCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon: Icon,
  title,
  text,
  highlight = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  text: string;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group h-full rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-[0_16px_48px_-16px_rgb(20_108_255/0.3)] md:p-7 ${
        highlight
          ? "border-[#146CFF]/40 bg-gradient-to-b from-[#146CFF]/[0.08] to-[#0A0A0A] hover:border-[#146CFF]/70"
          : "border-[#20242C] bg-[#0A0A0A] hover:border-[#146CFF]/50"
      }`}
    >
      <span className="mb-4 flex size-10 items-center justify-center rounded-xl border border-[#20242C] bg-[#146CFF]/[0.08] text-[#78A9FF] transition-colors group-hover:bg-[#146CFF]/[0.16]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="font-display text-lg font-bold text-[#F5F7FA]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#A4AAB5]">{text}</p>
      {children}
    </div>
  );
}

/* ── Seção 8 — Lookbook ───────────────────────────────────── */

const LOOKBOOK_FILTERS = [
  "Dia a dia",
  "Trabalho",
  "Date",
  "Noite",
  "Faculdade",
  "Viagem",
  "Evento casual",
  "Calor",
  "Frio",
  "Meia-estação",
];

const LOOKBOOK_CARDS = [
  {
    src: "/estilos/smartcasual/02.jpg",
    nome: "Smart casual para o date",
    pecas: "Overshirt · camiseta lisa · calça reta · tênis limpo",
    porque: "A terceira peça estrutura o outfit sem exigir alfaiataria completa.",
    tags: ["Date", "Meia-estação", "Nível fácil"],
  },
  {
    src: "/estilos/streetwear/05.jpg",
    nome: "Street proporcional",
    pecas: "Boxy tee · baggy jeans · tênis retrô",
    porque: "As proporções amplas conversam entre si e o tênis fecha a leitura urbana.",
    tags: ["Dia a dia", "Calor", "Streetwear"],
  },
  {
    src: "/estilos/minimalista/03.jpg",
    nome: "Neutro intencional",
    pecas: "Camiseta off-white · calça de sarja · acessório discreto",
    porque: "Paleta neutra com variação de textura evita o efeito monótono.",
    tags: ["Trabalho", "Nível fácil", "Neutros"],
  },
];

export function LookbookSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              Você não recebe só a foto.{" "}
              <span className="text-[#78A9FF]">Recebe a lógica por trás do outfit.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              O lookbook foi criado para funcionar como uma biblioteca de
              receitas. Você escolhe a ocasião, o estilo, o clima, o nível de
              dificuldade e a cor principal. A plataforma mostra combinações
              completas e explica por que cada uma funciona.
            </p>
          </Reveal>
        </div>

        {/* Filtros */}
        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap gap-2" aria-hidden>
            {LOOKBOOK_FILTERS.map((f, i) => (
              <span
                key={f}
                className={
                  i === 2
                    ? "rounded-full border border-[#146CFF]/70 bg-[#146CFF]/[0.14] px-4 py-2 text-xs font-semibold text-[#78A9FF]"
                    : "rounded-full border border-[#20242C] bg-white/[0.02] px-4 py-2 text-xs font-medium text-[#A4AAB5] transition-colors hover:border-[#146CFF]/40 hover:text-[#F5F7FA]"
                }
              >
                {f}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Cards de outfits */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {LOOKBOOK_CARDS.map((look, i) => (
            <Reveal key={look.nome} delay={i * 140}>
              <article className="group overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] transition-all hover:-translate-y-1 hover:border-[#146CFF]/50">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={look.src}
                    alt={`Referência de outfit: ${look.nome}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={70}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                  <div className="absolute right-3 top-3 flex gap-1.5" aria-hidden>
                    {[Heart, Calendar, CheckCircle2].map((Icon, j) => (
                      <span
                        key={j}
                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-[#F5F7FA] backdrop-blur-md transition-colors hover:border-[#146CFF] hover:text-[#78A9FF]"
                        title={["Favoritar", "Colocar no plano", "Já tenho as peças"][j]}
                      >
                        <Icon className="size-3.5" />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-bold text-[#F5F7FA]">
                    {look.nome}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#A4AAB5]">{look.pecas}</p>
                  <p className="mt-3 border-l-2 border-[#146CFF]/50 pl-3 text-xs leading-relaxed text-[#A4AAB5]">
                    <span className="font-semibold text-[#78A9FF]">Por que funciona: </span>
                    {look.porque}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {look.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#20242C] px-2.5 py-1 text-[10px] font-medium text-[#A4AAB5]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-[#A4AAB5]/80">
            Em vez de salvar mais uma imagem e esquecer dela, você transforma a
            referência em um plano real para o seu guarda-roupa.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Seção 9 — Fit Check com IA ───────────────────────────── */

export function FitCheckSection() {
  return (
    <section
      id="fit-check"
      className="relative scroll-mt-24 overflow-hidden py-20 md:py-28"
    >
      {/* Background diferenciado */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#0A0A0A]">
        <div className="absolute left-1/2 top-0 h-px w-full max-w-[1280px] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#146CFF]/40 to-transparent" />
        <div
          className="absolute -top-48 left-1/2 h-96 w-[640px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,108,255,0.1) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
                Um consultor de estilo no seu bolso
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                Montou o outfit e ficou na dúvida?{" "}
                <span className="bg-gradient-to-r from-[#146CFF] to-[#78A9FF] bg-clip-text text-transparent">
                  Manda uma foto.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 leading-relaxed text-[#A4AAB5]">
                O Fit Check analisa a combinação que você está usando e devolve
                um feedback direto. Ele mostra o que está funcionando, aponta
                possíveis ajustes e dá uma nota geral para o outfit.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <p className="mt-4 leading-relaxed text-[#A4AAB5]">
                Você pode testar uma combinação antes de sair, comparar
                alternativas ou entender por que alguma coisa parece não
                encaixar.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-8 border-l-2 border-[#146CFF]/50 pl-4 text-sm leading-relaxed text-[#A4AAB5]/85">
                A ideia não é a IA decidir como você deve se vestir. É ajudar
                você a perceber detalhes que antes passavam despercebidos.
              </p>
            </Reveal>
            <Reveal delay={420}>
              <a
                href={checkoutHref(ANNUAL_CHECKOUT_URL)}
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#146CFF] px-7 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_36px_-8px_rgb(20_108_255/0.9)]"
              >
                QUERO USAR O FIT CHECK
              </a>
            </Reveal>
          </div>

          {/* Demonstração do chat */}
          <div className="space-y-3">
            <Reveal delay={150}>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-[#20242C] bg-[#146CFF]/[0.12] px-4 py-3">
                <p className="text-sm text-[#F5F7FA]">
                  Vou usar esse outfit em um date. O que você mudaria?
                </p>
                <div className="relative mt-3 aspect-[4/5] w-36 overflow-hidden rounded-xl border border-[#20242C]">
                  <Image
                    src="/estilos/smartcasual/04.jpg"
                    alt="Foto de outfit enviada para análise no Fit Check"
                    fill
                    sizes="144px"
                    quality={70}
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={350}>
              <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-[#20242C] bg-[#111318] px-5 py-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#78A9FF]">
                  Fit Check
                </p>
                <p className="text-sm leading-relaxed text-[#A4AAB5]">
                  A combinação está equilibrada e a paleta funciona bem. A calça
                  mais ampla conversa com o formato da camiseta, mas o tênis
                  está criando um peso visual maior do que o restante do outfit.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#20242C] bg-[#0A0A0A] p-3.5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#2fbf71]">
                      O que está funcionando
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-[#A4AAB5]">
                      <li className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-[#2fbf71]" aria-hidden />Paleta neutra</li>
                      <li className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-[#2fbf71]" aria-hidden />Proporção entre camiseta e calça</li>
                      <li className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-[#2fbf71]" aria-hidden />Terceira peça bem utilizada</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[#20242C] bg-[#0A0A0A] p-3.5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#78A9FF]">
                      O que pode melhorar
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-[#A4AAB5]">
                      <li className="flex gap-2"><Plus className="mt-0.5 size-3 shrink-0 text-[#78A9FF]" aria-hidden />Testar um tênis com menos volume</li>
                      <li className="flex gap-2"><Plus className="mt-0.5 size-3 shrink-0 text-[#78A9FF]" aria-hidden />Dobrar levemente a manga</li>
                      <li className="flex gap-2"><Plus className="mt-0.5 size-3 shrink-0 text-[#78A9FF]" aria-hidden />Adicionar um acessório discreto</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#146CFF]/40 bg-[#146CFF]/[0.08] px-4 py-3">
                  <p className="text-xs font-semibold text-[#F5F7FA]">Nota geral</p>
                  <p className="font-display text-xl font-bold text-[#78A9FF]">8,7/10</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
