"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Loader2, NotebookPen } from "lucide-react";
import { toggleActionDay, saveDayNotes } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionDay } from "@/lib/constants";

export function ActionDayCard({
  day,
  completed,
  notes,
  locked,
  defaultOpen,
}: {
  day: ActionDay;
  completed: boolean;
  notes: string;
  locked: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [noteDraft, setNoteDraft] = useState(notes);
  const [savedNote, setSavedNote] = useState(notes);
  const [pending, startTransition] = useTransition();
  const [savingNote, startNoteTransition] = useTransition();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-surface shadow-card transition-colors",
        completed ? "border-success/30" : open ? "border-border-strong" : "border-border",
        locked && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer sm:px-6"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold transition-colors",
            completed
              ? "bg-success/15 text-success"
              : "bg-accent-soft text-accent"
          )}
        >
          {completed ? <Check className="size-5" /> : `D${day.day}`}
        </span>
        <span className="flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Dia {day.day}
          </span>
          <span
            className={cn(
              "block font-display text-[15px] font-semibold sm:text-base",
              completed && "text-muted"
            )}
          >
            {day.title}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 sm:px-6">
          <p className="rounded-xl bg-accent-soft/60 px-4 py-3 text-sm font-medium text-foreground">
            🎯 Missão: {day.mission}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">{day.explanation}</p>

          <ul className="mt-5 space-y-2.5">
            {day.checklist.map((task, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-muted">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border border-border-strong">
                  {completed && <Check className="size-3 text-success" />}
                </span>
                {task}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
              <NotebookPen className="size-3.5" />
              Suas anotações
            </label>
            <Textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="O que funcionou? O que você descobriu sobre seu estilo hoje?"
            />
            {noteDraft !== savedNote && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                disabled={savingNote}
                onClick={() =>
                  startNoteTransition(async () => {
                    await saveDayNotes(day.day, noteDraft);
                    setSavedNote(noteDraft);
                  })
                }
              >
                {savingNote && <Loader2 className="size-3.5 animate-spin" />}
                Salvar anotação
              </Button>
            )}
          </div>

          <div className="mt-6">
            <Button
              variant={completed ? "secondary" : "default"}
              disabled={pending}
              onClick={() => startTransition(() => toggleActionDay(day.day, completed))}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : completed ? (
                "Desmarcar dia"
              ) : (
                <>
                  <Check className="size-4" />
                  Concluir dia {day.day}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
