import type { Metadata } from "next";
import { Link2, Plus, MousePointerClick, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/admin/copy-button";
import { 
  createTrackingLinkAction, 
  deleteTrackingLinkAction 
} from "@/app/actions/admin";

export const metadata: Metadata = { title: "Rastreamento de Links - Admin" };

export default async function AdminLinksPage() {
  const { supabase } = await requireAdmin();

  // Busca todos os links de rastreamento do banco
  const { data: links } = await supabase
    .from("tracking_links")
    .select("*")
    .order("created_at", { ascending: false });

  const trackingLinks = links ?? [];
  const totalClicks = trackingLinks.reduce((acc, l) => acc + (l.clicks_count ?? 0), 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manualpraticodooutfit.vercel.app";

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Rastreamento de Links"
        description="Gere links curtos para campanhas ou parcerias e acompanhe o número de cliques em tempo real."
      />

      {/* KPIs de Cliques */}
      <div className="grid gap-3.5 grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <MousePointerClick className="size-3.5 text-accent" /> Cliques Acumulados (Total)
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalClicks}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <p className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <Link2 className="size-3.5 text-accent" /> Links Ativos
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{trackingLinks.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        
        {/* Lado Esquerdo: Criar Novo Link */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="size-4 text-accent" />
            Criar Link de Rastreamento
          </h2>
          
          <div className="rounded-2xl border border-border bg-surface p-5">
            <form action={createTrackingLinkAction} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">Slug do Link (Identificador)</label>
                <div className="flex rounded-xl border border-border bg-surface-2 overflow-hidden items-center">
                  <span className="bg-surface-3 px-3 py-2.5 text-xs text-muted font-medium border-r border-border/80">/l/</span>
                  <input
                    name="slug"
                    type="text"
                    required
                    placeholder="ex: instagram-bio"
                    className="w-full bg-transparent px-3 py-2.5 text-xs outline-none focus:text-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-2 mt-1">Apenas letras minusculas, números, traço e underline.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">URL de Destino Final</label>
                <input
                  name="destination_url"
                  type="url"
                  required
                  placeholder="https://pay.cakto.com.br/xxxxx"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-xs outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted">Descrição (Origem / Evento)</label>
                <textarea
                  name="description"
                  placeholder="ex: Link de checkout com desconto usado na bio do Instagram"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs outline-none resize-none focus:border-accent"
                />
              </div>

              <Button type="submit" className="w-full h-10 text-xs">
                Gerar Link Curto
              </Button>
            </form>
          </div>
        </section>

        {/* Lado Direito: Listagem dos Links */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4 text-accent" />
            Links Gerados
          </h2>

          <div className="space-y-3">
            {trackingLinks.map((link) => {
              const fullShortLink = `${siteUrl}/l/${link.slug}`;
              return (
                <div 
                  key={link.id}
                  className="rounded-2xl border border-border bg-surface p-4.5 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">/l/{link.slug}</p>
                      <p className="text-[10px] text-muted-2 truncate mt-1">
                        Destino: <span className="text-foreground font-mono">{link.destination_url}</span>
                      </p>
                      {link.description && (
                        <p className="text-[10px] text-muted mt-1.5 italic">“{link.description}”</p>
                      )}
                    </div>
                    
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {link.clicks_count ?? 0} {link.clicks_count === 1 ? "clique" : "cliques"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <CopyButton text={fullShortLink} label="Copiar Link" />
                    
                    <form action={deleteTrackingLinkAction}>
                      <input type="hidden" name="id" value={link.id} />
                      <Button 
                        variant="danger" 
                        size="sm" 
                        type="submit" 
                        className="h-8 text-[11px] font-semibold"
                      >
                        <Trash2 className="size-3 mr-1" />
                        Remover
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}

            {trackingLinks.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-xs text-muted">
                Nenhum link de rastreamento gerado ainda. Use o formulário ao lado para criar o primeiro!
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
