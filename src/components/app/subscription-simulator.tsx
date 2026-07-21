"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriptionSimulator({ name }: { name: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("simular_expirado") === "true") {
        setActive(true);
        // Desfoca o container principal da página
        const container = document.getElementById("app-layout-container");
        if (container) {
          container.classList.add("filter", "blur-md", "select-none", "pointer-events-none");
        }
      }
    }
  }, []);

  if (!active) return null;

  const renewUrl = process.env.NEXT_PUBLIC_RENEW_URL ?? "https://manualpraticodooutfit.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center shadow-2xl animate-zoom-in">
        {/* Brilho superior de gradiente */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-blue-500 to-indigo-600" />
        
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning">
          <AlertCircle className="size-6" />
        </div>

        <h2 className="mt-4 text-base font-bold text-foreground">
          Acesso Expirado (Simulação)
        </h2>
        
        <p className="mt-2.5 text-xs leading-relaxed text-muted">
          Olá, <strong className="text-foreground">{(name || "Aluno").split(" ")[0]}</strong>. 
          Seu período de acesso ao <strong className="text-foreground">Manual Prático do Outfit (MPO)</strong> expirou. 
          Renove sua assinatura para liberar imediatamente toda a plataforma, looks e o consultor de IA.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a href={renewUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-11 text-xs font-semibold gap-1.5 shadow-lg shadow-accent/20">
              <RefreshCw className="size-3.5" />
              Renovar Assinatura
            </Button>
          </a>

          <form action={signOut}>
            <Button variant="ghost" type="submit" className="w-full h-10 text-xs font-medium text-muted hover:text-foreground gap-1.5">
              <LogOut className="size-3.5" />
              Sair da Conta
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
