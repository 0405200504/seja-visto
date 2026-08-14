import { Reveal } from "./reveal";
import { CheckoutLink } from "./checkout-link";
import { MONTHLY_CHECKOUT_URL, MONTHLY_PRICE, checkoutHref } from "./checkout";


/**
 * CTA de meio de página. Entra depois das seções que acabam de provar valor,
 * para o visitante não precisar rolar até os planos para comprar.
 */
export function SectionCta({
  label = "QUERO AS 228 COMBINAÇÕES",
  nota = "Acesso liberado na hora · 7 dias de garantia",
  className,
}: {
  label?: string;
  nota?: string;
  className?: string;
}) {
  return (
    <Reveal delay={120} className={className}>
      <div className="mx-auto mt-10 flex max-w-xl flex-col items-center px-5 text-center md:px-8">
        <CheckoutLink
          href={checkoutHref(MONTHLY_CHECKOUT_URL)}
          valor={MONTHLY_PRICE}
          className="flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#146CFF] px-6 py-3 text-center text-[13px] font-bold leading-tight tracking-wide text-white transition-all hover:bg-[#3B82F6] hover:shadow-[0_0_40px_-8px_rgb(20_108_255/0.9)] sm:w-auto sm:px-10 sm:text-sm"
        >
          {label}
        </CheckoutLink>
        <p className="mt-3 text-xs font-medium text-[#A4AAB5]/80">{nota}</p>
      </div>
    </Reveal>
  );
}
