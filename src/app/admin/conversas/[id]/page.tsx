import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, User } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConversaDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const db = createAdminClient();

  const { data: conv } = await db.from("fit_check_conversations").select("*").eq("id", id).maybeSingle();
  if (!conv) notFound();

  const [{ data: messages }, { data: student }] = await Promise.all([
    db.from("fit_check_messages").select("id, role, content, thumb, created_at").eq("conversation_id", id).order("created_at"),
    db.from("users_profile").select("user_id, name, email").eq("user_id", conv.user_id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/admin/conversas" className="mb-1 flex items-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="size-3" /> Todas as conversas
        </Link>
        <h1 className="font-display text-lg font-bold text-foreground">{conv.title}</h1>
        <p className="mt-0.5 text-xs text-muted">
          {student ? (
            <Link href={`/admin/alunos/${student.user_id}`} className="text-[#7ea2ff] hover:underline">
              {student.name ?? student.email}
            </Link>
          ) : (
            "Aluno removido"
          )}{" "}
          · iniciada em {dateTime(conv.created_at)} · leitura interna (o aluno não vê este acesso)
        </p>
      </div>

      <div className="space-y-3">
        {(messages ?? []).map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" ? "" : "flex-row-reverse")}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-surface-3 text-muted" : "bg-accent-soft text-[#7ea2ff]"
              )}
            >
              {m.role === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
            </span>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl border px-3.5 py-2.5",
                m.role === "user" ? "border-border bg-surface-2" : "border-accent/20 bg-accent-soft/40"
              )}
            >
              {m.thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb} alt="Foto enviada" className="mb-2 max-h-56 rounded-lg border border-border" />
              )}
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{m.content}</p>
              <p className="mt-1 text-[10px] text-muted-2">{dateTime(m.created_at)}</p>
            </div>
          </div>
        ))}
        {(messages ?? []).length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-xs text-muted-2">
            Conversa sem mensagens.
          </p>
        )}
      </div>
    </div>
  );
}
