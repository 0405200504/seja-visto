"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Uploader de imagem com drag-and-drop para o Supabase Storage
 * (bucket "content"). Substitui o campo "URL da imagem" digitado.
 */
export function ImageUploader({
  value,
  folder,
  onChange,
  aspectHint,
  className,
}: {
  value: string | null;
  /** subpasta no bucket: "looks", "pecas", "modulos" */
  folder: string;
  onChange: (url: string | null) => void | Promise<void>;
  /** ex: "Proporção ideal: 4:5 (vertical)" */
  aspectHint?: string;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const upload = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast({ title: "Formato inválido.", description: "Use JPG, PNG ou WebP.", kind: "error" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Imagem muito pesada.", description: "O limite é 8 MB.", kind: "error" });
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("content").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("content").getPublicUrl(path);
      await onChange(data.publicUrl);
      toast({ title: "Imagem enviada." });
    } catch (err) {
      toast({
        title: "Erro no upload.",
        description: err instanceof Error ? err.message : undefined,
        kind: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagem atual" className="max-h-64 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 rounded-lg bg-danger/20 px-3 py-1.5 text-xs font-semibold text-danger"
            >
              <Trash2 className="size-3.5" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 transition-colors",
            dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-surface-2 hover:border-accent/50"
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-muted" />
          ) : (
            <UploadCloud className="size-6 text-muted" />
          )}
          <span className="text-xs font-medium text-muted">
            {uploading ? "Enviando…" : "Arraste uma imagem ou clique para escolher"}
          </span>
          <span className="text-[11px] text-muted-2">
            JPG, PNG ou WebP · até 8 MB{aspectHint ? ` · ${aspectHint}` : ""}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
