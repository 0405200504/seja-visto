import { MessageCircle, Trash2 } from "lucide-react";
import { deleteComment, type ReactionTarget } from "@/app/actions/community";
import { CommentForm } from "@/components/app/comment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FitComment } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentsSection({
  target,
  comments,
  currentUserId,
  isAdmin,
}: {
  target: ReactionTarget;
  comments: FitComment[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <MessageCircle className="size-4" />
          </span>
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {comments.length > 0 && (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-xl border border-border bg-surface-2/50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">
                    {comment.author_name ?? "Aluno da comunidade"}
                    <span className="ml-2 font-normal text-muted">
                      {formatDate(comment.created_at)}
                    </span>
                  </p>
                  {(comment.user_id === currentUserId || isAdmin) && (
                    <form action={deleteComment}>
                      <input type="hidden" name="id" value={comment.id} />
                      <button
                        type="submit"
                        aria-label="Excluir comentário"
                        className="cursor-pointer text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {comments.length === 0 && (
          <p className="text-sm text-muted">Seja a primeira pessoa a comentar.</p>
        )}

        <CommentForm target={target} />
      </CardContent>
    </Card>
  );
}
