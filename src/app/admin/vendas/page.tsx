import { 
  CreditCard, 
  DollarSign, 
  KeyRound, 
  Link2, 
  Percent, 
  Plus, 
  Receipt, 
  ShoppingBag, 
  Trash2, 
  TrendingUp, 
  Webhook 
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  deleteCaktoMapping,
  createManualSaleAction,
  upsertCaktoMapping,
} from "@/app/actions/admin";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BONUSES, BASE_ENTITLEMENT } from "@/lib/bonuses";

const ENTITLEMENT_OPTIONS = [
  { key: BASE_ENTITLEMENT, title: "Produto principal (acesso à plataforma)" },
  ...BONUSES.map((b) => ({ key: b.key, title: b.title })),
  { key: "tokens-50", title: "Fit Check: Pacote de 50 tokens de IA" },
  { key: "tokens-200", title: "Fit Check: Pacote de 200 tokens de IA" },
];

function entitlementTitle(key: string): string {
  return ENTITLEMENT_OPTIONS.find((o) => o.key === key)?.title ?? key;
}

export default async function AdminVendasPage() {
  const { supabase } = await requireAdmin();

  // Busca dados de mapeamentos e histórico de vendas
  const [
    { data: mappings }, 
    { data: sales }
  ] = await Promise.all([
    supabase
      .from("cakto_product_map")
      .select("cakto_id, entitlement, label, validity_days")
      .order("created_at"),
    supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
  ]);

  const mapped = new Set((mappings ?? []).map((m) => m.entitlement));
  const missing = ENTITLEMENT_OPTIONS.filter((o) => !mapped.has(o.key));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app";
  const hasSecret = Boolean(process.env.CAKTO_WEBHOOK_SECRET);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasEmail = Boolean(
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || process.env.RESEND_API_KEY
  );

  // Cálculos Financeiros (CRM)
  const approvedSales = sales?.filter((s) => s.status === "approved") ?? [];
  const refundedSales = sales?.filter((s) => s.status === "refunded") ?? [];
  
  const totalGross = approvedSales.reduce((acc, s) => acc + s.amount_cents, 0) / 100;
  const totalRefunded = refundedSales.reduce((acc, s) => acc + s.amount_cents, 0) / 100;
  const totalNet = totalGross - totalRefunded;
  
  const ticketMedio = approvedSales.length ? (totalGross / approvedSales.length) : 0;
  const totalTransactions = sales?.length ?? 0;
  const refundRate = totalTransactions ? Math.round((refundedSales.length / totalTransactions) * 100) : 0;

  // Mapeia método de pagamento amigável
  const getPaymentBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m === "pix") return <Badge variant="success" className="bg-success/5 border-success/20 text-success text-[10px]">Pix</Badge>;
    if (m === "credit_card" || m === "cartao" || m === "credit") return <Badge variant="accent" className="bg-accent/5 border-accent/20 text-accent text-[10px]">Cartão</Badge>;
    if (m === "boleto") return <Badge variant="default" className="text-[10px]">Boleto</Badge>;
    return <Badge variant="outline" className="text-[10px]">Manual / Webhook</Badge>;
  };

  return (
    <div className="animate-fade-up space-y-10">
      <PageHeader
        title="CRM & Financeiro"
        description="Acompanhe as vendas da sua operação, faça liberações manuais e gerencie integrações."
      />

      {/* Grid de KPIs Financeiros */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <DollarSign className="size-3.5 text-success" /> Faturamento Líquido
          </p>
          <p className="mt-2 text-xl font-bold text-foreground">
            {totalNet.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <span className="text-[9px] text-muted-2 block mt-1">Bruto: R$ {totalGross.toFixed(2)}</span>
        </div>
        
        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <ShoppingBag className="size-3.5 text-accent" /> Vendas Aprovadas
          </p>
          <p className="mt-2 text-xl font-bold text-foreground">{approvedSales.length}</p>
          <span className="text-[9px] text-muted-2 block mt-1">Transações: {totalTransactions}</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <TrendingUp className="size-3.5 text-accent" /> Ticket Médio
          </p>
          <p className="mt-2 text-xl font-bold text-foreground">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <span className="text-[9px] text-muted-2 block mt-1">Faturamento bruto / vendas</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <Percent className="size-3.5 text-danger" /> Taxa de Reembolso
          </p>
          <p className="mt-2 text-xl font-bold text-foreground">{refundRate}%</p>
          <span className="text-[9px] text-muted-2 block mt-1">Reembolsados: {refundedSales.length}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        
        {/* Lado Esquerdo: Histórico de Vendas (CRM) */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Receipt className="size-4 text-accent" />
            Histórico de Transações
          </h2>
          
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 text-[10px] uppercase tracking-wider text-muted font-semibold">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(sales ?? []).map((sale) => (
                  <tr key={sale.id} className="hover:bg-surface-2/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[140px]">{sale.name || "Aluno"}</p>
                      <p className="text-[10px] text-muted truncate max-w-[140px]">{sale.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {(sale.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3">
                      {getPaymentBadge(sale.payment_method)}
                    </td>
                    <td className="px-4 py-3">
                      {sale.status === "approved" ? (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          Aprovada
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                          Reembolsada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {new Date(sale.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </td>
                  </tr>
                ))}
                {(sales ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      Nenhuma venda registrada ainda no CRM.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lado Direito: Liberação Manual (CRM) */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="size-4 text-accent" />
            Lançamento Manual (CRM)
          </h2>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Use este formulário para lançar compras feitas fora da Cakto (Pix direto, etc.). 
              Isso soma o valor no Financeiro e **cria a conta / libera o acesso** do aluno ao mesmo tempo.
            </p>
            <form action={createManualSaleAction} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">E-mail do Aluno</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="aluno@email.com"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">Nome do Aluno (se for novo)</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted">Valor Pago (R$)</label>
                  <input
                    name="amount"
                    type="text"
                    required
                    placeholder="97,00"
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted">Forma de Pagamento</label>
                  <select
                    name="payment_method"
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                  >
                    <option value="pix">Pix</option>
                    <option value="credit_card">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="manual">Manual / Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">Acesso a Liberar</label>
                <select
                  name="entitlement"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                >
                  {ENTITLEMENT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full h-10 text-xs">
                Registrar Venda & Liberar
              </Button>
            </form>
          </div>
        </section>
      </div>

      {/* Mapeamentos da Cakto */}
      <section className="border-t border-border/40 pt-10 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Link2 className="size-4 text-accent" />
              Mapeamento de Produtos (Cakto)
            </h2>
            <p className="text-xs text-muted mt-1 max-w-xl">
              Cole o ID do produto ou oferta gerado pela Cakto e escolha qual bônus/acesso ele libera automaticamente na plataforma.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-[10px]">
            <Badge variant={hasSecret ? "success" : "outline"}>
              Webhook Secret: {hasSecret ? "Configurado" : "Pendente"}
            </Badge>
            <Badge variant={hasServiceRole ? "success" : "outline"}>
              Service Role Key: {hasServiceRole ? "Configurada" : "Pendente"}
            </Badge>
            <Badge variant={hasEmail ? "success" : "outline"}>
              E-mails: {hasEmail ? "Configurados" : "Pendentes"}
            </Badge>
          </div>
        </div>

        <form
          action={upsertCaktoMapping}
          className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1.2fr_1.2fr_0.6fr_auto]"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              ID na Cakto (produto ou oferta)
            </label>
            <input
              name="cakto_id"
              required
              placeholder="ex.: 3vkq8pt"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Libera na plataforma</label>
            <select
              name="entitlement"
              required
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
            >
              {ENTITLEMENT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Validade (dias)</label>
            <input
              name="validity_days"
              type="number"
              min="1"
              placeholder="Vitalício"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-10 px-4 text-xs font-medium">
              <Plus className="size-3.5" />
              Mapear
            </Button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          {(mappings ?? []).map((m: any) => (
            <div
              key={m.cakto_id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">{entitlementTitle(m.entitlement)}</p>
                <p className="mt-1 text-[10px] text-muted">
                  ID Cakto: <span className="font-mono text-foreground">{m.cakto_id}</span>
                  {m.validity_days && (
                    <>
                      <span className="mx-1.5">•</span>
                      Validade: <span className="text-foreground">{m.validity_days} dias</span>
                    </>
                  )}
                </p>
              </div>
              <form action={deleteCaktoMapping}>
                <input type="hidden" name="cakto_id" value={m.cakto_id} />
                <Button variant="danger" size="sm" type="submit" className="h-8 text-[11px] font-semibold">
                  <Trash2 className="size-3 mr-1" />
                  Excluir
                </Button>
              </form>
            </div>
          ))}
          {(mappings ?? []).length === 0 && (
            <p className="sm:col-span-2 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-xs text-muted">
              Nenhum produto mapeado ainda. Crie o produto na Cakto e cole o ID acima para mapear.
            </p>
          )}
        </div>

        {missing.length > 0 && (mappings ?? []).length > 0 && (
          <p className="text-[10px] text-muted-2">
            Acessos sem mapeamento: {missing.map((o) => o.title).join(" · ")}
          </p>
        )}

        <div className="rounded-2xl border border-border bg-surface p-5 text-xs text-muted leading-relaxed">
          <p className="flex items-center gap-1.5 font-semibold text-foreground mb-2">
            <Webhook className="size-4 text-accent" />
            Configurando o Webhook da Cakto
          </p>
          Configure o endpoint de webhook na sua conta Cakto (Configurações → Webhooks) apontando para a URL abaixo. Certifique-se de marcar os eventos de compra aprovada, reembolso e chargeback:
          <code className="mt-2 block overflow-x-auto rounded-xl bg-surface-2 px-3 py-2 text-xs font-mono text-foreground border border-border/30">
            {siteUrl}/api/webhooks/cakto
          </code>
        </div>
      </section>
    </div>
  );
}

