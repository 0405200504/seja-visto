"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar link:", err);
    }
  };

  return (
    <Button
      type="button"
      variant={copied ? "outline" : "secondary"}
      size="sm"
      className="h-8 gap-1.5 text-xs font-semibold"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="size-3 text-success" />
          {label ? "Copiado!" : ""}
        </>
      ) : (
        <>
          <Copy className="size-3 text-muted" />
          {label ?? "Copiar"}
        </>
      )}
    </Button>
  );
}
