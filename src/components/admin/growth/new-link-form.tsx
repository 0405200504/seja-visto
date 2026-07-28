"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Link2, Loader2, Plus, X } from "lucide-react";
import { createTrackingLinkAction2 } from "@/app/actions/admin/links";
import { useToast } from "@/components/admin/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewLinkModal({ siteUrl }: { siteUrl: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    destinationUrl: "",
    description: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  });

  useEffect(() => {
    if (sp.get("novo") === "1") {
      setOpen(true);
      const params = new URLSearchParams(sp.toString());
      params.delete("novo");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [sp, router, pathname]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Button size="sm" className="h-9" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> Novo link
      </Button>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border bg-surface p-5 shadow-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Novo link de rastreamento</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground" aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Slug *</label>
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs text-muted-2">{siteUrl}/l/</span>
                  <Input value={form.slug} onChange={(e) => set("slug")(e.target.value)} placeholder="bio-insta" className="h-10" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">URL de destino *</label>
                <Input value={form.destinationUrl} onChange={(e) => set("destinationUrl")(e.target.value)} placeholder="https://…" className="h-10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Descrição</label>
                <Input value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Ex: link da bio do Instagram" className="h-10" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted">UTMs (opcionais — entram no destino)</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={form.utmSource} onChange={(e) => set("utmSource")(e.target.value)} placeholder="source" className="h-9 text-xs" />
                  <Input value={form.utmMedium} onChange={(e) => set("utmMedium")(e.target.value)} placeholder="medium" className="h-9 text-xs" />
                  <Input value={form.utmCampaign} onChange={(e) => set("utmCampaign")(e.target.value)} placeholder="campaign" className="h-9 text-xs" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" className="h-9" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                size="sm"
                className="h-9"
                disabled={busy || !form.slug.trim() || !form.destinationUrl.trim()}
                onClick={async () => {
                  setBusy(true);
                  const res = await createTrackingLinkAction2(form);
                  setBusy(false);
                  toast({ title: res.message, kind: res.ok ? "success" : "error" });
                  if (res.ok) {
                    setOpen(false);
                    setForm({ slug: "", destinationUrl: "", description: "", utmSource: "", utmMedium: "", utmCampaign: "" });
                    router.refresh();
                  }
                }}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                Criar link
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
