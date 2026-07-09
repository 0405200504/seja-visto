"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/user";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  lookId,
  isFavorite,
  className,
}: {
  lookId: string;
  isFavorite: boolean;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={optimistic ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleFavorite(lookId, optimistic);
        });
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 active:scale-90 cursor-pointer",
        optimistic
          ? "border-accent/50 bg-accent/20 text-accent"
          : "border-white/10 bg-black/40 text-white/70 hover:text-white",
        className
      )}
    >
      <Heart className={cn("size-4", optimistic && "fill-accent")} />
    </button>
  );
}
