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
    <section className="relative overflow-hidden pt-11 pb-6 lg:pt-32 lg:pb-20">
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
        Estrutura de VSL: headline → vídeo → botão, em coluna única.
        Um único player no DOM (dois montariam dois players com o mesmo id e
        duplicariam as métricas do VTurb).
      */}
      <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-5 text-center lg:px-8">
        <p className="inline-block rounded-full border border-[#20242C] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#78A9FF] lg:px-3.5 lg:py-1.5 lg:text-[11px] lg:tracking-[0.24em]">
          Manual Prático do Outfit
        </p>

        <h1 className="mt-3 font-display text-[27px] font-bold leading-[1.08] tracking-[-0.03em] text-[#F5F7FA] sm:text-[34px] lg:mt-5 lg:text-[42px] lg:leading-[1.06]">
          O que separa você de conseguir a mulher que deseja, o cliente que
          sonha e a promoção que busca é{" "}
          <span className="bg-gradient-to-r from-[#146CFF] via-[#3B82F6] to-[#78A9FF] bg-clip-text text-transparent">
            um simples ajuste no seu visual
          </span>
          .
        </h1>

        <div className="relative mt-6 w-full lg:mt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-[75%] w-[90%] lg:block"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(20,108,255,0.24) 0%, transparent 68%)",
            }}
          />
          <VslPlayer className="relative mx-auto w-full max-w-[660px]" />
        </div>

        <OfferBlock className="mt-6 w-full max-w-[520px] lg:mt-7" />
        <ChipRow className="mt-6 justify-center lg:mt-7" />
      </div>
    </section>
  );
}

/** Bônus da oferta em linha, como reforço abaixo do CTA. */
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
        className="flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#146CFF] px-5 py-3 text-center text-[13px] font-bold leading-tight tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)] sm:px-8 sm:text-sm lg:min-h-[60px] lg:text-base"
      >
        QUERO AS 228 COMBINAÇÕES AGORA
      </CheckoutLink>

      <p className="mt-3 text-center text-xs font-medium leading-relaxed text-[#A4AAB5]/80">
        Acesso liberado na hora · 7 dias pra testar tudo — não gostou,
        devolvemos 100% sem perguntar nada.
      </p>
    </div>
  );
}
