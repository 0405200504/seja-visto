import Image from "next/image";
import {
  Bookmark,
  Calendar,
  Camera,
  Compass,
  Home,
  Layers,
  Shirt,
} from "lucide-react";
import { Reveal, ProgressFill } from "./reveal";
import { ANNUAL_CHECKOUT_URL, checkoutHref } from "./checkout";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-44 md:pb-24">
      {/* Fundo: grid tecnológico discreto + luz azul difusa */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(32,36,44,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(32,36,44,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 75%)",
          }}
        />
        <div
          className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,108,255,0.13) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/2 right-[-160px] h-[360px] w-[360px]"
          style={{
            background:
              "radial-gradient(circle at center, rgba(20,108,255,0.07) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* Texto */}
        <div>
          <Reveal>
            <p className="mb-5 inline-block rounded-full border border-[#20242C] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              Manual Prático do Outfit
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-[#F5F7FA] sm:text-5xl lg:text-[60px]">
              Pare de se vestir no{" "}
              <span className="bg-gradient-to-r from-[#146CFF] via-[#3B82F6] to-[#78A9FF] bg-clip-text text-transparent">
                improviso
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#A4AAB5] md:text-lg">
              Você não precisa comprar mais roupa sem saber o que fazer com ela.
              O MPO mostra quais peças combinam com você, quais looks funcionam
              para cada ocasião e o que mudar para construir um estilo que
              realmente tenha a sua cara.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A4AAB5]/80">
              Lookbook, guias práticos, guarda-roupa inteligente, plano de ação
              e um consultor de estilo com IA reunidos em uma única plataforma.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={checkoutHref(ANNUAL_CHECKOUT_URL)}
                className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#146CFF] px-8 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)]"
              >
                DESCOBRIR MEU ESTILO
              </a>
              <a
                href="#como-funciona"
                className="inline-flex h-[52px] items-center justify-center rounded-xl border border-[#20242C] bg-white/[0.02] px-8 text-sm font-semibold text-[#F5F7FA] transition-all hover:border-[#146CFF]/60 hover:bg-[#146CFF]/[0.06]"
              >
                VER COMO FUNCIONA
              </a>
            </div>
          </Reveal>

          <Reveal delay={440}>
            <p className="mt-6 text-xs font-medium tracking-wide text-[#A4AAB5]/70">
              Acesso imediato · Plataforma atualizada · Use no celular ou computador
            </p>
          </Reveal>
        </div>

        {/* Mockup do dashboard */}
        <Reveal delay={300} className="relative">
          <div className="relative">
            {/* Cards flutuantes */}
            <div
              aria-hidden
              className="absolute -top-5 -left-3 z-10 hidden animate-[landing-float_7s_ease-in-out_infinite] rounded-xl border border-[#20242C] bg-[#0A0A0A]/90 px-3.5 py-2.5 backdrop-blur-md sm:block"
            >
              <p className="text-[10px] font-medium text-[#A4AAB5]">Seu estilo</p>
              <p className="text-xs font-bold text-[#F5F7FA]">Streetwear</p>
            </div>
            <div
              aria-hidden
              className="absolute -right-3 top-16 z-10 hidden animate-[landing-float_8s_ease-in-out_infinite_1s] rounded-xl border border-[#146CFF]/40 bg-[#0A0A0A]/90 px-3.5 py-2.5 shadow-[0_0_24px_-8px_rgb(20_108_255/0.6)] backdrop-blur-md sm:block"
            >
              <p className="text-[10px] font-medium text-[#A4AAB5]">Fit Check</p>
              <p className="text-xs font-bold text-[#78A9FF]">8,7/10</p>
            </div>
            <div
              aria-hidden
              className="absolute -bottom-4 left-10 z-10 hidden animate-[landing-float_6.5s_ease-in-out_infinite_0.5s] items-center gap-2 rounded-xl border border-[#20242C] bg-[#0A0A0A]/90 px-3.5 py-2.5 backdrop-blur-md sm:flex"
            >
              <Bookmark className="size-3.5 text-[#78A9FF]" />
              <p className="text-xs font-semibold text-[#F5F7FA]">Look salvo</p>
            </div>

            {/* Janela da plataforma */}
            <div className="overflow-hidden rounded-2xl border border-[#20242C] bg-[#0A0A0A] shadow-[0_24px_80px_-24px_rgb(0_0_0/0.9),0_0_60px_-30px_rgb(20_108_255/0.4)]">
              {/* Barra da janela */}
              <div className="flex items-center gap-1.5 border-b border-[#20242C] bg-[#111318] px-4 py-3">
                <span className="size-2.5 rounded-full bg-[#20242C]" />
                <span className="size-2.5 rounded-full bg-[#20242C]" />
                <span className="size-2.5 rounded-full bg-[#146CFF]/70" />
                <span className="ml-3 rounded-md bg-[#050505] px-2.5 py-0.5 text-[9px] font-medium text-[#A4AAB5]">
                  app.mpo — dashboard
                </span>
              </div>

              <div className="flex">
                {/* Menu lateral */}
                <div className="hidden w-36 shrink-0 flex-col gap-0.5 border-r border-[#20242C] bg-[#0A0A0A] p-2.5 text-[10px] font-medium text-[#A4AAB5] sm:flex">
                  <span className="flex items-center gap-2 rounded-md bg-[#146CFF]/[0.14] px-2.5 py-1.5 text-[#78A9FF]">
                    <Home className="size-3" /> Dashboard
                  </span>
                  <span className="flex items-center gap-2 px-2.5 py-1.5">
                    <Layers className="size-3" /> Método
                  </span>
                  <span className="flex items-center gap-2 px-2.5 py-1.5">
                    <Compass className="size-3" /> Lookbook
                  </span>
                  <span className="flex items-center gap-2 px-2.5 py-1.5">
                    <Shirt className="size-3" /> Guarda-roupa
                  </span>
                  <span className="flex items-center gap-2 px-2.5 py-1.5">
                    <Camera className="size-3" /> Fit Check
                  </span>
                  <span className="flex items-center gap-2 px-2.5 py-1.5">
                    <Calendar className="size-3" /> Plano 7 dias
                  </span>
                </div>

                {/* Conteúdo do dashboard */}
                <div className="flex-1 space-y-3 p-4">
                  <div>
                    <p className="text-xs font-bold text-[#F5F7FA]">
                      Boa noite, Lucas
                    </p>
                    <p className="text-[10px] text-[#A4AAB5]">
                      Estilo principal: <span className="text-[#78A9FF]">Streetwear</span> · Objetivo:
                      vestir melhor no dia a dia
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#20242C] bg-[#111318] p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#F5F7FA]">
                        Seu progresso
                      </span>
                      <span className="text-[#78A9FF]">62%</span>
                    </div>
                    <ProgressFill percent={62} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#20242C] bg-[#111318] p-3">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-[#A4AAB5]">
                        Plano de 7 dias
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#F5F7FA]">
                        Dia 4 <span className="text-[10px] font-medium text-[#A4AAB5]">de 7</span>
                      </p>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <span
                            key={d}
                            className={`h-1 flex-1 rounded-full ${d <= 4 ? "bg-[#146CFF]" : "bg-white/[0.08]"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#146CFF]/30 bg-[#146CFF]/[0.07] p-3">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-[#78A9FF]">
                        Continue de onde parou
                      </p>
                      <p className="mt-1 text-[11px] font-semibold leading-snug text-[#F5F7FA]">
                        Módulo 3 · Cores e combinações
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold text-[#F5F7FA]">
                      Looks para o seu perfil
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { src: "/estilos/streetwear/01.jpg", alt: "Look streetwear recomendado" },
                        { src: "/estilos/streetwear/03.jpg", alt: "Look urbano recomendado" },
                        { src: "/estilos/casual/02.jpg", alt: "Look casual recomendado" },
                      ].map((img) => (
                        <div
                          key={img.src}
                          className="relative aspect-[3/4] overflow-hidden rounded-md border border-[#20242C]"
                        >
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            sizes="120px"
                            quality={55}
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
