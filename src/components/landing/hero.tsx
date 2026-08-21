import { CheckoutLink } from "./checkout-link";
import { VslPlayer } from "./vsl-player";
import { MONTHLY_CHECKOUT_URL, MONTHLY_PRICE, checkoutHref } from "./checkout";

const CHIPS = [
  "Fit Check com IA",
  "Guarda-roupa inteligente",
  "16 estilos",
  "Método completo",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-11 pb-6 lg:pt-44 lg:pb-20">
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
      </div>

      {/*
        Um único VSL no DOM (dois montariam dois players com o mesmo id e
        duplicariam as métricas): no mobile ele vem no topo, no desktop a
        ordem do grid joga ele para a direita do texto.
      */}
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:px-8">
        <div className="relative lg:order-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-[75%] w-[90%] lg:block"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(20,108,255,0.24) 0%, transparent 68%)",
            }}
          />
          <VslPlayer className="relative mx-auto w-full max-w-[560px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:order-1 lg:mx-0 lg:max-w-none">
          {/* ── MOBILE ───────────────────────────────────────────────── */}
          <div className="lg:hidden">
            <p className="mb-2.5 inline-block rounded-full border border-[#20242C] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#78A9FF]">
              Manual Prático do Outfit
            </p>
            <h1 className="font-display text-[27px] font-bold leading-[1.08] tracking-[-0.03em] text-[#F5F7FA] sm:text-[34px]">
              O que separa você de conseguir a mulher que deseja, o cliente que
              sonha e a promoção que busca é{" "}
              <span className="bg-gradient-to-r from-[#146CFF] via-[#3B82F6] to-[#78A9FF] bg-clip-text text-transparent">
                um simples ajuste no seu visual
              </span>
              .
            </h1>

            <p className="mt-3.5 text-[15px] leading-snug text-[#A4AAB5]">
              Não é ficar mais rico, mais alto, nem virar outra pessoa. É parar
              de errar a roupa: são{" "}
              <span className="font-semibold text-[#F5F7FA]">
                228 combinações prontas
              </span>{" "}
              — você escolhe a ocasião e o outfit vem montado. E as pessoas
              passam a te tratar diferente sem saber o que mudou.
            </p>

            <ChipRow className="mt-4" />
            <OfferBlock className="mt-5" />
          </div>

          {/* ── DESKTOP ──────────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <p className="mb-5 inline-block rounded-full border border-[#20242C] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#78A9FF]">
              Manual Prático do Outfit
            </p>

            <h1 className="font-display text-[46px] font-bold leading-[1.06] tracking-[-0.03em] text-[#F5F7FA]">
              O que separa você de conseguir a mulher que deseja, o cliente que
              sonha e a promoção que busca é{" "}
              <span className="bg-gradient-to-r from-[#146CFF] via-[#3B82F6] to-[#78A9FF] bg-clip-text text-transparent">
                um simples ajuste no seu visual
              </span>
              .
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#A4AAB5]">
              Esse ajuste não é ficar mais rico, mais alto, nem virar outra
              pessoa. É simplesmente parar de errar a roupa: são{" "}
              <span className="font-semibold text-[#F5F7FA]">
                228 combinações prontas
              </span>
              , montadas por stylist. Você escolhe a ocasião, o outfit vem
              montado peça por peça — e as pessoas passam a te tratar diferente
              sem saber o que mudou.
            </p>

            <ChipRow className="mt-6" />
            <OfferBlock className="mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bônus da oferta em linha, no lugar do parágrafo longo. */
function ChipRow({ className }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {CHIPS.map((chip) => (
        <li
          key={chip}
          className="rounded-full border border-[#20242C] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-[#A4AAB5] md:text-xs"
        >
          {chip}
        </li>
      ))}
      <li className="rounded-full border border-[#146CFF]/40 bg-[#146CFF]/[0.1] px-2.5 py-1 text-[11px] font-semibold text-[#78A9FF] md:text-xs">
        Tudo incluso, sem pagar a mais
      </li>
    </ul>
  );
}

/** Preço + CTA + garantia juntos, para a oferta bater antes da dobra. */
function OfferBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <CheckoutLink
        href={checkoutHref(MONTHLY_CHECKOUT_URL)}
        valor={MONTHLY_PRICE}
        className="flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#146CFF] px-5 py-3 text-center text-[13px] font-bold leading-tight tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)] sm:px-8 sm:text-sm lg:inline-flex lg:w-fit"
      >
        QUERO AS 228 COMBINAÇÕES AGORA
      </CheckoutLink>

      <p className="mt-3 text-xs font-medium leading-relaxed text-[#A4AAB5]/80">
        Acesso liberado na hora · 7 dias pra testar tudo — não gostou,
        devolvemos 100% sem perguntar nada.
      </p>
    </div>
  );
}
