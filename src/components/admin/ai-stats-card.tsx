"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, Cpu, Coins, Edit2, Check, ArrowUpRight, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiStatsCardProps {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalPhotos: number;
  totalTexts: number;
}

export function AiStatsCard({
  totalPromptTokens,
  totalCompletionTokens,
  totalTokens,
  totalPhotos,
  totalTexts
}: AiStatsCardProps) {
  const [tokenBudget, setTokenBudget] = useState(1000000); // 1.000.000 tokens padrão
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");

  // Carrega orçamento do localStorage se disponível no navegador
  useEffect(() => {
    const saved = localStorage.getItem("mpo_ai_token_budget");
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num)) {
        setTokenBudget(num);
      }
    }
  }, []);

  const handleSaveBudget = () => {
    const parsed = parseInt(tempBudget, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTokenBudget(parsed);
      localStorage.setItem("mpo_ai_token_budget", parsed.toString());
      setIsEditingBudget(false);
    }
  };

  const startEditing = () => {
    setTempBudget(tokenBudget.toString());
    setIsEditingBudget(true);
  };

  // Preços gpt-4o-mini aproximados:
  // Input: $0.15 / 1M tokens
  // Output: $0.60 / 1M tokens
  const estimatedCostUsd = 
    (totalPromptTokens * 0.15) / 1000000 + 
    (totalCompletionTokens * 0.60) / 1000000;

  const usagePercentage = Math.min((totalTokens / tokenBudget) * 100, 100);
  const availableTokens = Math.max(tokenBudget - totalTokens, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Consumo de IA & Tokens</h3>
            <p className="text-[10px] text-muted">Acompanhe os custos e limites do consultor de estilo virtual (Fit Check)</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
            Status: Saudável
          </span>
        </div>
      </div>

      {/* Orçamento de Tokens e Progresso */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-muted font-medium">Orçamento de Tokens Disponível</p>
            {isEditingBudget ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-28 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs outline-none focus:border-accent"
                  placeholder="ex: 1000000"
                />
                <Button size="sm" className="h-7 px-2" onClick={handleSaveBudget}>
                  <Check className="size-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setIsEditingBudget(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-foreground">
                <span className="text-sm font-bold">{tokenBudget.toLocaleString("pt-BR")}</span>
                <button
                  onClick={startEditing}
                  className="text-muted hover:text-foreground transition-colors p-1 hover:bg-surface-2 rounded-lg"
                  title="Editar Orçamento"
                >
                  <Edit2 className="size-3" />
                </button>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-muted font-medium">Tokens Restantes</p>
            <p className="mt-1 font-bold text-foreground text-sm">
              {availableTokens.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercentage > 85 
                  ? "bg-danger" 
                  : usagePercentage > 60 
                  ? "bg-accent/80" 
                  : "bg-accent"
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted font-medium">
            <span>Usado: {totalTokens.toLocaleString("pt-BR")} ({usagePercentage.toFixed(1)}%)</span>
            <span>Orçamento: {tokenBudget.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 pt-1">
        
        {/* prompt tokens */}
        <div className="rounded-xl border border-border/30 bg-surface-2/20 p-3.5 space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted tracking-wider">
            <Brain className="size-3 text-accent" /> Prompt (Input)
          </p>
          <p className="text-base font-bold text-foreground truncate">
            {totalPromptTokens.toLocaleString("pt-BR")}
          </p>
          <p className="text-[9px] text-muted-2">Tokens de entrada da IA</p>
        </div>

        {/* completion tokens */}
        <div className="rounded-xl border border-border/30 bg-surface-2/20 p-3.5 space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted tracking-wider">
            <Cpu className="size-3 text-accent" /> Completion (Output)
          </p>
          <p className="text-base font-bold text-foreground truncate">
            {totalCompletionTokens.toLocaleString("pt-BR")}
          </p>
          <p className="text-[9px] text-muted-2">Tokens gerados na resposta</p>
        </div>

        {/* Total Usado */}
        <div className="rounded-xl border border-border/30 bg-surface-2/20 p-3.5 space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted tracking-wider">
            <Coins className="size-3 text-accent" /> Total de Tokens
          </p>
          <p className="text-base font-bold text-foreground truncate">
            {totalTokens.toLocaleString("pt-BR")}
          </p>
          <p className="text-[9px] text-muted-2">Soma total consumida</p>
        </div>

        {/* Custo Estimado */}
        <div className="rounded-xl border border-border/30 bg-surface-2/20 p-3.5 space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted tracking-wider">
            <ArrowUpRight className="size-3 text-success" /> Custo Estimado
          </p>
          <p className="text-base font-bold text-success truncate">
            ${estimatedCostUsd.toFixed(4)} <span className="text-[9px] font-normal text-muted">USD</span>
          </p>
          <p className="text-[9px] text-muted-2">Conversão direta da OpenAI</p>
        </div>
      </div>

      {/* Uso por Formato */}
      <div className="border-t border-border/40 pt-4 flex items-center justify-between text-xs text-muted-2">
        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Distribuição de envios</span>
        
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <Camera className="size-3.5 text-accent" />
            <strong className="text-foreground">{totalPhotos}</strong> fits analisados
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-3.5 text-accent" />
            <strong className="text-foreground">{totalTexts}</strong> dúvidas por texto
          </span>
        </div>
      </div>
      
    </div>
  );
}
