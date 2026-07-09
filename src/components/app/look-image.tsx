import Image from "next/image";
import { COLOR_SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Imagem do look (otimizada via next/image) com fallback elegante:
 * gradiente escuro + monograma na cor base do look.
 * O elemento pai precisa ter `position: relative` e proporção definida.
 */
export function LookImage({
  imageUrl,
  title,
  baseColor,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className,
}: {
  imageUrl: string | null;
  title: string;
  baseColor: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover object-top", className)}
      />
    );
  }

  const swatch = COLOR_SWATCHES[baseColor] ?? "#1a2230";
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn("absolute inset-0 flex items-center justify-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(160deg, ${swatch}66 0%, #0c111a 55%, #06080c 100%)`,
      }}
    >
      <div
        className="absolute -top-10 right-0 size-48 rounded-full opacity-30 blur-3xl"
        style={{ background: swatch }}
      />
      <span className="font-display text-4xl font-bold tracking-tight text-white/15">
        {initials}
      </span>
      <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
        Lookbook
      </span>
    </div>
  );
}
