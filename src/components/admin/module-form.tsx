import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertModule } from "@/app/actions/admin";
import type { Module } from "@/lib/types";

export function ModuleForm({ module: mod }: { module?: Module }) {
  return (
    <form action={upsertModule} className="max-w-2xl space-y-5">
      {mod && <input type="hidden" name="id" value={mod.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" defaultValue={mod?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order_index">Ordem</Label>
          <Input
            id="order_index"
            name="order_index"
            type="number"
            defaultValue={mod?.order_index ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={mod?.description ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image_url">URL da capa</Label>
        <Input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          defaultValue={mod?.cover_image_url ?? ""}
          placeholder="https://…"
        />
      </div>

      <Button type="submit">{mod ? "Salvar módulo" : "Criar módulo"}</Button>
    </form>
  );
}
