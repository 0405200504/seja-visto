import { CheckCircle2, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { CopyButton } from "@/components/admin/copy-button";

export const dynamic = "force-dynamic";

function StatusRow({ name, ok, detail }: { name: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs leading-relaxed text-muted">{detail}</p>
      </div>
    </li>
  );
}

export default async function IntegracoesPage() {
  await requireAdmin();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app").replace(/\/$/, "");
  const webhookUrl = `${siteUrl}/api/webhooks/cakto`;

  const integracoes = [
    {
      name: "Supabase (banco, login e fotos)",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "Conectado com chave de serviço — webhook e admin funcionam."
        : "Falta SUPABASE_SERVICE_ROLE_KEY nas variáveis da Vercel.",
    },
    {
      name: "OpenAI (Fit Check)",
      ok: !!process.env.OPENAI_API_KEY,
      detail: process.env.OPENAI_API_KEY
        ? "Chave configurada. Modelo e prompt são editados em Sistema → Fit Check (IA)."
        : "Falta OPENAI_API_KEY — o Fit Check não responde sem ela.",
    },
    {
      name: "E-mail (Gmail SMTP)",
      ok: !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD,
      detail: process.env.GMAIL_USER
        ? `Enviando como ${process.env.GMAIL_USER}.`
        : "Sem GMAIL_USER/GMAIL_APP_PASSWORD — e-mails de acesso caem no fallback (Resend).",
    },
    {
      name: "E-mail (Resend — fallback)",
      ok: !!process.env.RESEND_API_KEY,
      detail: process.env.RESEND_API_KEY
        ? "Configurado como reserva. Pendência conhecida: verificar o domínio no Resend para melhorar a entrega."
        : "Sem RESEND_API_KEY. Opcional se o Gmail estiver ativo.",
    },
    {
      name: "WhatsApp (UAZAPI)",
      ok: !!process.env.UAZAPI_URL && !!process.env.UAZAPI_TOKEN,
      detail: process.env.UAZAPI_URL
        ? "Mensagens de boas-vindas por WhatsApp ativas no webhook."
        : "Sem UAZAPI_URL/UAZAPI_TOKEN — o webhook pula o disparo de WhatsApp.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Integrações</h1>
        <p className="mt-0.5 text-xs text-muted">
          Status das conexões externas. Chaves e senhas são configuradas nas variáveis de ambiente da Vercel — nunca aparecem aqui.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Webhook da Cakto</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Cadastre esta URL na Cakto (Configurações → Webhooks) para vendas, reembolsos e assinaturas
          entrarem sozinhas. O mapa produto → acesso fica em Receita → Produtos & Ofertas.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[11px] text-muted">
            {webhookUrl}
          </code>
          <CopyButton text={webhookUrl} label="Copiar" />
        </div>
      </div>

      <ul className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
        {integracoes.map((i) => (
          <StatusRow key={i.name} {...i} />
        ))}
      </ul>
    </div>
  );
}
