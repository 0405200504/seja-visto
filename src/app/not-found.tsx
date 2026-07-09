import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Compass className="size-6" />
      </div>
      <h1 className="text-xl font-bold">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Voltar ao dashboard</Button>
      </Link>
    </div>
  );
}
