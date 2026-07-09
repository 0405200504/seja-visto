"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toggleLesson, completeModule } from "@/app/actions/user";
import { LessonContent } from "@/components/app/lesson-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

export function LessonList({
  moduleId,
  lessons,
  completedIds,
}: {
  moduleId: string;
  lessons: Lesson[];
  completedIds: string[];
}) {
  const [open, setOpen] = useState<string | null>(lessons[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const completed = new Set(completedIds);
  const allDone = lessons.length > 0 && lessons.every((l) => completed.has(l.id));

  return (
    <div className="space-y-3">
      {lessons.map((lesson, i) => {
        const isOpen = open === lesson.id;
        const isDone = completed.has(lesson.id);

        return (
          <div
            key={lesson.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-surface transition-colors",
              isOpen ? "border-border-strong" : "border-border"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : lesson.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isDone
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-border-strong text-muted"
                )}
              >
                {isDone ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium sm:text-[15px]",
                  isDone && "text-muted line-through decoration-muted-2"
                )}
              >
                {lesson.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border px-5 py-5 sm:px-6">
                {lesson.content && <LessonContent content={lesson.content} />}
                <div className="mt-6">
                  <Button
                    variant={isDone ? "secondary" : "default"}
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => toggleLesson(moduleId, lesson.id, isDone))
                    }
                  >
                    {isDone ? "Desmarcar aula" : "Marcar aula como concluída"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {lessons.length > 0 && !allDone && (
        <div className="pt-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                completeModule(
                  moduleId,
                  lessons.map((l) => l.id)
                )
              )
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Marcar módulo inteiro como concluído
          </Button>
        </div>
      )}
    </div>
  );
}
