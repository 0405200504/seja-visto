"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, CircleCheck, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitFit } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.85;

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Arquivo de imagem inválido."));
    el.src = dataUrl;
  });
}

/** Redimensiona a foto no navegador antes do upload (economiza banda e storage). */
async function resizeToJpeg(file: File): Promise<{ blob: Blob; preview: string }> {
  const img = await fileToImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Não foi possível processar a imagem.");
  return { blob, preview: canvas.toDataURL("image/jpeg", 0.7) };
}

export function FitUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, startTransition] = useTransition();

  function reset() {
    setPhoto(null);
    setCaption("");
    setError(null);
    setDone(false);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setPhoto(await resizeToJpeg(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler essa foto.");
    }
  }

  function handleSubmit() {
    if (!photo || sending) return;
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão expirada. Entre novamente.");

        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("fits")
          .upload(path, photo.blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error("Falha no upload da foto. Tente novamente.");

        await submitFit(path, caption);
        setDone(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível enviar agora.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => { reset(); setOpen(true); }}>
        <Camera className="size-4" />
        Enviar meu fit
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Enviar meu fit</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => !sending && setOpen(false)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CircleCheck className="size-10 text-success" />
                <p className="font-medium">Fit enviado!</p>
                <p className="max-w-xs text-sm text-muted">
                  Sua foto está em análise e aparece para a comunidade assim que for aprovada.
                </p>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {photo ? (
                  <div className="relative mx-auto aspect-[4/5] w-48 overflow-hidden rounded-xl border border-border">
                    <Image src={photo.preview} alt="Prévia do fit" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-x-0 bottom-0 cursor-pointer bg-black/60 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    >
                      Trocar foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-10 text-muted transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    <Upload className="size-6" />
                    <span className="text-sm font-medium">Escolher foto do seu look</span>
                    <span className="text-xs">A foto passa por aprovação antes de aparecer</span>
                  </button>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fit-caption">Legenda (opcional)</Label>
                  <Textarea
                    id="fit-caption"
                    rows={2}
                    maxLength={300}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ex.: look pro trabalho com as peças do módulo 2"
                  />
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <Button onClick={handleSubmit} disabled={!photo || sending} className="w-full">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  {sending ? "Enviando…" : "Enviar para aprovação"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
