"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import {
  toggleReaction,
  type ReactionKind,
  type ReactionTarget,
} from "@/app/actions/community";
import { cn } from "@/lib/utils";

function ReactionToggle({
  target,
  kind,
  count,
  active,
  icon: Icon,
  label,
  size,
}: {
  target: ReactionTarget;
  kind: ReactionKind;
  count: number;
  active: boolean;
  icon: typeof Heart;
  label: string;
  size: "sm" | "md";
}) {
  const [optimistic, setOptimistic] = useOptimistic({ active, count });
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          setOptimistic({
            active: !optimistic.active,
            count: optimistic.count + (optimistic.active ? -1 : 1),
          });
          await toggleReaction(target, kind, optimistic.active);
        });
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full transition-all duration-200 active:scale-90",
        size === "sm" ? "text-xs" : "text-sm",
        optimistic.active ? "text-accent" : "text-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(size === "sm" ? "size-4" : "size-[18px]", optimistic.active && "fill-accent")}
      />
      <span className="tabular-nums">{optimistic.count}</span>
    </button>
  );
}

/**
 * Barra de interações sociais: curtir, salvar e contagem de comentários.
 * Funciona tanto para fits da comunidade quanto para looks oficiais.
 */
export function ReactionButtons({
  target,
  likes,
  liked,
  saves,
  saved,
  comments,
  showSave = true,
  size = "sm",
  className,
}: {
  target: ReactionTarget;
  likes: number;
  liked: boolean;
  saves?: number;
  saved?: boolean;
  comments?: number;
  showSave?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ReactionToggle
        target={target}
        kind="like"
        count={likes}
        active={liked}
        icon={Heart}
        label={liked ? "Remover curtida" : "Curtir"}
        size={size}
      />
      {showSave && (
        <ReactionToggle
          target={target}
          kind="save"
          count={saves ?? 0}
          active={saved ?? false}
          icon={Bookmark}
          label={saved ? "Remover dos salvos" : "Salvar"}
          size={size}
        />
      )}
      {comments !== undefined && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-muted",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          <MessageCircle className={size === "sm" ? "size-4" : "size-[18px]"} />
          <span className="tabular-nums">{comments}</span>
        </span>
      )}
    </div>
  );
}
