import { KeyRound, Link2, Plus, Trash2, Webhook } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  deleteCaktoMapping,
  grantEntitlementManually,
  upsertCaktoMapping,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BONUSES, BASE_ENTITLEMENT } from "@/lib/bonuses";

const ENTITLEMENT_OPTIONS = [
  { key: BASE_ENTITLEMENT, title: "Produto principal (acesso à plataforma)" },
  ...BONUSES.map((b) => ({ key: b.key, title: b.title })),
];

function entitlementTitle(key: string): string {
  return ENTITLEMENT_OPTIONS.find((o) => o.key === key)?.title ?? key;
}

export default async function AdminVendasPage() {
  const { supabase } = await requireAdmin();

  const { data: mappings } = await supabase
    .from("cakto_product_map")
    .select("cakto_id, entitlement, label")
    .order("created_at");

  const mapped = new Set((mappings ?? []).map((m) => m.entitlement));
  const missing = ENTITLEMENT_OPTIONS.filter((o) => !mapped.has(o.key));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://SEU-DOMINIO";
  const hasSecret = Boolean(process.env.CAKTO_WEBHOOK_SECRET);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="animate-fade-up space-y-10">
      <PageHeader
        title="Vendas (Cakto)"
        description="Conecte cada produto e order bump da Cakto ao acesso correspondente na plataforma."
      />

      {/* Status da integração */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Webhook className="size-4 text-accent" />
          Webhook
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Configure na Cakto (Configurações → Webhooks) apontando para:
        </p>
        <code className="mt-2 block overflow-x-auto rounded-xl bg-surface-2 px-4 py-3 text-xs text-foreground">
          {siteUrl}/api/webhooks/cakto
        </code>
        <p className="mt-2 text-xs text-muted-2">
          Marque os eventos de compra aprovada, reembolso e chargeback. O secret configurado
          na Cakto deve ser o mesmo da variável CAKTO_WEBHOOK_SECRET.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={hasSecret ? "success" : "outline"}>
            CAKTO_WEBHOOK_SECRET {hasSecret ? "configurado" : "pendente"}
          </Badge>
          <Badge variant={hasServiceRole ? "success" : "outline"}>
            SUPABASE_SERVICE_ROLE_KEY {hasServiceRole ? "configurada" : "pendente"}
          </Badge>
          <Badge variant={hasResend ? "success" : "outline"}>
            RESEND_API_KEY {hasResend ? "configurada" : "pendente"}
          </Badge>
        </div>
      </section>

      {/* Mapeamentos */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Link2 className="size-4 text-accent" />
          Produtos mapeados
        </h2>
        <p className="mb-4 text-sm text-muted">
          Cole o ID do produto (ou da oferta) gerado pela Cakto e escolha o que ele libera aqui
          na plataforma. Compras de produtos sem mapeamento liberam apenas o acesso base.
        </p>

        <form
          action={upsertCaktoMapping}
          className="mb-5 grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              ID na Cakto (produto ou oferta)
            </label>
            <input
              name="cakto_id"
              required
              placeholder="ex.: 3vkq8pt"
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Libera na plataforma</label>
            <select
              name="entitlement"
              required
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            >
              {ENTITLEMENT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">
              <Plus className="size-4" />
              Mapear
            </Button>
          </div>
        </form>

        <div className="space-y-2.5">
          {(mappings ?? []).map((m) => (
            <div
              key={m.cakto_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{entitlementTitle(m.entitlement)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  ID Cakto: <span className="font-mono text-foreground">{m.cakto_id}</span>
                </p>
              </div>
              <form action={deleteCaktoMapping}>
                <input type="hidden" name="cakto_id" value={m.cakto_id} />
                <Button variant="danger" size="sm" type="submit">
                  <Trash2 className="size-3.5" />
                  Remover
                </Button>
              </form>
            </div>
          ))}
          {(mappings ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
              Nenhum produto mapeado ainda. Crie o produto e os order bumps na Cakto e cole os
              IDs aqui.
            </p>
          )}
        </div>

        {missing.length > 0 && (mappings ?? []).length > 0 && (
          <p className="mt-3 text-xs text-muted-2">
            Ainda sem mapeamento: {missing.map((o) => o.title).join(" · ")}
          </p>
        )}
      </section>

      {/* Liberação manual */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4 text-accent" />
          Liberação manual
        </h2>
        <p className="mb-4 text-sm text-muted">
          Para suporte: libere um bônus direto para um aluno já cadastrado (por e-mail).
        </p>
        <form
          action={grantEntitlementManually}
          className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">E-mail do aluno</label>
            <input
              name="email"
              type="email"
              required
              placeholder="aluno@email.com"
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Liberar</label>
            <select
              name="entitlement"
              required
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            >
              {ENTITLEMENT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary">
              Liberar acesso
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
