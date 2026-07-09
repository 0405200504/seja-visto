import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertLook } from "@/app/actions/admin";
import { OCCASIONS, STYLES, CLIMATES, LEVELS, BASE_COLORS } from "@/lib/constants";
import type { Look } from "@/lib/types";

function Options({ options }: { options: Record<string, string> }) {
  return (
    <>
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  );
}

export function LookForm({ look }: { look?: Look }) {
  return (
    <form action={upsertLook} className="max-w-3xl space-y-5">
      {look && <input type="hidden" name="id" value={look.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Nome do look *</Label>
        <Input id="title" name="title" defaultValue={look?.title} required placeholder="Ex.: Casual Premium Noturno" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição / ocasião ideal</Label>
        <Textarea id="description" name="description" defaultValue={look?.description ?? ""} placeholder="Ex.: jantar, bar, encontro ou evento casual" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="occasion">Ocasião *</Label>
          <Select id="occasion" name="occasion" defaultValue={look?.occasion} required>
            <Options options={OCCASIONS} />
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="style">Estilo *</Label>
          <Select id="style" name="style" defaultValue={look?.style} required>
            <Options options={STYLES} />
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="climate">Clima *</Label>
          <Select id="climate" name="climate" defaultValue={look?.climate} required>
            <Options options={CLIMATES} />
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Nível *</Label>
          <Select id="level" name="level" defaultValue={look?.level} required>
            <Options options={LEVELS} />
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="base_color">Cor base *</Label>
          <Select id="base_color" name="base_color" defaultValue={look?.base_color} required>
            <Options options={BASE_COLORS} />
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image_url">URL da imagem</Label>
          <Input id="image_url" name="image_url" type="url" defaultValue={look?.image_url ?? ""} placeholder="https://…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pieces">Peças usadas (uma por linha)</Label>
        <Textarea
          id="pieces"
          name="pieces"
          rows={5}
          defaultValue={look?.pieces.join("\n")}
          placeholder={"camiseta preta lisa\ncalça reta escura\njaqueta de couro"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="why_it_works">Por que funciona</Label>
        <Textarea id="why_it_works" name="why_it_works" defaultValue={look?.why_it_works ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adaptations">Trocas possíveis (uma por linha)</Label>
        <Textarea
          id="adaptations"
          name="adaptations"
          rows={4}
          defaultValue={look?.adaptations.join("\n")}
          placeholder={"trocar bota por tênis branco premium\ntrocar jaqueta por camisa aberta"}
        />
      </div>

      <Button type="submit">{look ? "Salvar alterações" : "Criar look"}</Button>
    </form>
  );
}
