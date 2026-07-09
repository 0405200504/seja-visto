import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertWardrobeItem } from "@/app/actions/admin";
import { WARDROBE_CATEGORIES, PRIORITIES } from "@/lib/constants";
import type { WardrobeItem } from "@/lib/types";

export function WardrobeForm({ item }: { item?: WardrobeItem }) {
  return (
    <form action={upsertWardrobeItem} className="max-w-2xl space-y-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da peça *</Label>
        <Input id="name" name="name" defaultValue={item?.name} required placeholder="Ex.: Camiseta branca lisa" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select id="category" name="category" defaultValue={item?.category} required>
            {Object.entries(WARDROBE_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade *</Label>
          <Select id="priority" name="priority" defaultValue={item?.priority} required>
            {Object.entries(PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={item?.description ?? ""} placeholder="Ex.: Base para looks limpos, casuais e fáceis de combinar." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="how_to_use">Sugestão de como usar</Label>
        <Textarea id="how_to_use" name="how_to_use" defaultValue={item?.how_to_use ?? ""} placeholder="Ex.: combina com jeans, alfaiataria casual, jaquetas e tênis branco." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL da imagem</Label>
        <Input id="image_url" name="image_url" type="url" defaultValue={item?.image_url ?? ""} placeholder="https://…" />
      </div>

      <Button type="submit">{item ? "Salvar peça" : "Criar peça"}</Button>
    </form>
  );
}
