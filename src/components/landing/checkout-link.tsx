"use client";

import { pinterestCheckout } from "@/lib/pinterest";

/**
 * Botão de compra da página de vendas. É igual a um link comum, só que avisa o
 * Pinterest que a pessoa foi pro checkout — por isso vive num componente
 * cliente, separado das seções, que continuam sendo renderizadas no servidor.
 */
export function CheckoutLink({
  href,
  valor,
  className,
  children,
}: {
  href: string;
  /** Preço em reais do plano. */
  valor: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        // Quando o link da Cakto não está configurado o botão só rola a página
        // até os planos — aí não houve ida pro checkout pra registrar.
        if (href.startsWith("http")) pinterestCheckout(valor);
      }}
    >
      {children}
    </a>
  );
}
