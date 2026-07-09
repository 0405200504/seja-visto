"use client";

import { useOptimistic, useTransition } from "react";
import { CalendarPlus, Check, Heart, PackageCheck } from "lucide-react";
import { toggleFavorite, type FavoriteKind } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ActionToggle({
  lookId,
  kind,
  active,
  icon: Icon,
  label,
  activeLabel,
}: {
  lookId: string;
  kind: FavoriteKind;
  active: boolean;
  icon: typeof Heart;
  label: string;
  activeLabel: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={optimistic ? "default" : "secondary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleFavorite(lookId, optimistic, kind);
        })
      }
      className="w-full sm:w-auto"
    >
      {optimistic ? <Check className="size-4" /> : <Icon className={cn("size-4")} />}
      {optimistic ? activeLabel : label}
    </Button>
  );
}

export function LookActions({
  lookId,
  states,
}: {
  lookId: string;
  states: Record<FavoriteKind, boolean>;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
      <ActionToggle
        lookId={lookId}
        kind="favorite"
        active={states.favorite}
        icon={Heart}
        label="Favoritar look"
        activeLabel="Nos favoritos"
      />
      <ActionToggle
        lookId={lookId}
        kind="have_pieces"
        active={states.have_pieces}
        icon={PackageCheck}
        label="Tenho essas peças"
        activeLabel="Você tem as peças"
      />
      <ActionToggle
        lookId={lookId}
        kind="plan"
        active={states.plan}
        icon={CalendarPlus}
        label="Adicionar ao meu plano"
        activeLabel="No seu plano"
      />
    </div>
  );
}
