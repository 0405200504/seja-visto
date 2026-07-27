"use client";

import { useRef, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { addComment, type ReactionTarget } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ target }: { target: ReactionTarget }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        const content = String(formData.get("content") ?? "").trim();
        if (!content) return;
        startTransition(async () => {
          await addComment(target, content);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2"
    >
      <Textarea
        name="content"
        rows={2}
        maxLength={500}
        required
        placeholder="Escreva um comentário…"
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={pending} aria-label="Enviar comentário">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
