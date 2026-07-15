import {
  ClipboardCheck,
  Compass,
  GraduationCap,
  Shirt,
} from "lucide-react";
import { Reveal, Counter } from "./reveal";
import { OnboardingDemo } from "./onboarding-demo";

/* ── Seção 3 — Reconhecimento do problema ─────────────────── */

const PROBLEM_CHIPS = [
  "A calça não conversa com o tênis.",
  "A camiseta muda completamente o formato do corpo.",
  "A combinação funciona na foto, mas não funciona em você.",
  "Cada nova compra parece mais uma tentativa do que uma decisão.",
];

export function ProblemSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                Você até compra roupas boas.{" "}
                <span className="text-[#A4AAB5]">
                  O difícil é fazer tudo conversar.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 max-w-xl leading-relaxed text-[#A4AAB5]">
                Talvez o seu guarda-roupa esteja cheio, mas na hora de sair você
                continue usando as mesmas combinações.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-4 max-w-xl leading-relaxed text-[#A4AAB5]">
                Você salva referências, acompanha pessoas que se vestem bem e
                encontra peças interessantes. Só que, quando tenta trazer aquilo
                para a sua realidade, alguma coisa não encaixa.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-8 rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-6">
                <p className="leading-relaxed text-[#F5F7FA]">
                  Isso acontece porque{" "}
                  <span className="font-semibold text-[#78A9FF]">
                    referência sem método vira acúmulo
                  </span>
                  .
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#A4AAB5]">
                  Você não precisa decorar regra de moda. Precisa entender o que
                  funciona para o seu corpo, sua rotina, seu objetivo e a imagem
                  que quer passar.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col justify-center gap-3">
            {PROBLEM_CHIPS.map((chip, i) => (
              <Reveal key={chip} delay={i * 100}>
                <div className="flex items-start gap-3 rounded-xl border border-[#20242C] bg-white/[0.02] px-5 py-4 transition-colors hover:border-[#146CFF]/40">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#146CFF]"
                  />
                  <p className="text-sm leading-relaxed text-[#A4AAB5] md:text-[15px]">
                    {chip}
                  </p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={450}>
              <div className="mt-2 flex flex-wrap gap-2" aria-hidden>
                {["Boxy tee", "Baggy jeans", "Retro runner", "Overshirt", "Trucker jacket", "Jorts"].map(
                  (peca) => (
                    <span
                      key={peca}
                      className="rounded-full border border-[#20242C] bg-[#0A0A0A] px-3 py-1.5 text-[11px] font-medium text-[#A4AAB5]/70"
                    >
                      {peca}
                    </span>
                  )
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Seção 4 — Apresentação da solução ────────────────────── */

const FLOW_STEPS = [
  {
    icon: Compass,
    title: "Descubra seu perfil",
    text: "Responda ao quiz e veja quais estilos mais combinam com você.",
  },
  {
    icon: GraduationCap,
    title: "Aprenda o que realmente importa",
    text: "Consuma aulas e guias rápidos sobre modelagem, cores, peças e combinações.",
  },
  {
    icon: Shirt,
    title: "Monte seu sistema pessoal",
    text: "Organize o guarda-roupa, salve outfits e crie sua lista de compras.",
  },
  {
    icon: ClipboardCheck,
    title: "Teste e ajuste",
    text: "Use o Fit Check para receber feedback sobre os seus próprios outfits.",
  },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[#20242C] to-transparent"
      />
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              Um sistema, não uma pasta de referências
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
              O MPO organiza o que antes era tentativa e erro.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 leading-relaxed text-[#A4AAB5]">
              Ao entrar, você responde cinco perguntas rápidas sobre seu
              objetivo, suas dificuldades e o jeito que gostaria de ser
              percebido. A plataforma cruza essas respostas com 12 perfis de
              estilo e passa a recomendar outfits, conteúdos e próximos passos de
              acordo com você.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <p className="mt-4 leading-relaxed text-[#A4AAB5]">
              Você aprende os fundamentos, aplica no seu próprio guarda-roupa,
              salva referências, organiza suas compras e ainda pode mandar uma
              foto do outfit para receber uma análise instantânea.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <ul className="mt-6 space-y-2 text-sm text-[#A4AAB5]/85">
              <li>Sem depender de inspiração aleatória.</li>
              <li>Sem precisar assistir horas de vídeo para encontrar uma resposta simples.</li>
              <li>Sem comprar mais uma peça que fica esquecida no fundo do armário.</li>
            </ul>
          </Reveal>
        </div>

        {/* Fluxo de 4 etapas */}
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="group relative h-full rounded-2xl border border-[#20242C] bg-[#0A0A0A] p-6 transition-all hover:-translate-y-1 hover:border-[#146CFF]/50 hover:shadow-[0_12px_40px_-16px_rgb(20_108_255/0.35)]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-[#20242C] bg-[#146CFF]/[0.08] text-[#78A9FF] transition-colors group-hover:bg-[#146CFF]/[0.16]">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-3xl font-bold text-white/[0.07]">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F5F7FA]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A4AAB5]">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Seção 5 — Onboarding personalizado ───────────────────── */

export function OnboardingSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-[#F5F7FA] md:text-[42px] md:leading-[1.12]">
                A plataforma começa entendendo você.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 leading-relaxed text-[#A4AAB5]">
                Antes de recomendar qualquer roupa, o MPO descobre o que você
                quer comunicar com a sua imagem.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <ol className="mt-8 space-y-3">
                {[
                  "Qual é o seu objetivo principal?",
                  "Qual é a sua maior dificuldade?",
                  "Como você quer ser percebido?",
                  "Qual outfit você usaria em um sábado à tarde?",
                  "Qual paleta de cores mais combina com você?",
                ].map((q, i) => (
                  <li key={q} className="flex items-center gap-3.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#20242C] bg-[#0A0A0A] font-display text-xs font-bold text-[#78A9FF]">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#A4AAB5] md:text-[15px]">{q}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-8 border-l-2 border-[#146CFF]/50 pl-4 text-sm leading-relaxed text-[#A4AAB5]/85">
                O resultado não serve para colocar você dentro de uma caixa. Ele
                serve como ponto de partida para filtrar o excesso e mostrar
                referências que fazem sentido para a sua realidade.
              </p>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <OnboardingDemo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Seção 6 — Números da plataforma ──────────────────────── */

const METRICS = [
  { value: 8, suffix: "", label: "módulos" },
  { value: 37, suffix: "", label: "aulas" },
  { value: 12, suffix: "", label: "estilos" },
  { value: 190, suffix: "+", label: "referências visuais" },
  { value: 11, suffix: "", label: "guias práticos" },
  { value: 3, suffix: "", label: "ferramentas interativas" },
  { value: 24, suffix: "", label: "peças catalogadas" },
  { value: 7, suffix: "", label: "dias de plano prático" },
];

export function MetricsSection() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] px-6 py-10 md:px-12 md:py-12">
            <div
              aria-hidden
              className="absolute -top-32 left-1/2 h-64 w-[540px] -translate-x-1/2"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(20,108,255,0.09) 0%, transparent 65%)",
              }}
            />
            <dl className="relative grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label} className="text-center">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">
                    <Counter value={m.value} suffix={m.suffix} />
                  </dd>
                  <p className="mt-1.5 text-xs font-medium text-[#A4AAB5] md:text-[13px]">
                    {m.label}
                  </p>
                </div>
              ))}
            </dl>
            <p className="relative mt-10 text-center text-xs leading-relaxed text-[#A4AAB5]/70">
              Tudo organizado para você encontrar a resposta certa sem precisar
              procurar em dezenas de vídeos, pastas ou perfis diferentes.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
