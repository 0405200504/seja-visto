import type { Metadata } from "next";
import { LogOut, RefreshCcw } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { updateProfileName, redoOnboarding } from "@/app/actions/user";
import { signOut } from "@/app/actions/auth";
import { STYLE_GOALS, STYLES, MAIN_DIFFICULTIES, ACTION_PLAN_DAYS } from "@/lib/constants";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const { supabase, user, profile } = await requireProfile();

  const [{ count: totalLessons }, { count: doneLessons }, { count: planDays }, { count: favorites }] =
    await Promise.all([
      supabase.from("lessons").select("*", { count: "exact", head: true }),
      supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true),
      supabase
        .from("action_plan_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true),
      supabase
        .from("user_favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("kind", "favorite"),
    ]);

  const overallPct = totalLessons ? Math.round(((doneLessons ?? 0) / totalLessons) * 100) : 0;

  const styleInfo = [
    { label: "Objetivo de estilo", value: STYLE_GOALS[profile.style_goal ?? ""] ?? "—" },
    { label: "Estilo que mais combina", value: STYLES[profile.preferred_style ?? ""] ?? "—" },
    { label: "Maior dificuldade", value: MAIN_DIFFICULTIES[profile.main_difficulty ?? ""] ?? "—" },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Sua conta"
        title="Perfil"
        description="Seus dados, seu perfil de estilo e seu progresso na plataforma."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Dados */}
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
            <CardDescription>Atualize seu nome de exibição.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfileName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={profile.name ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={user.email ?? ""} disabled />
              </div>
              <Button type="submit" variant="secondary">
                Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Perfil de estilo */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil de estilo</CardTitle>
            <CardDescription>
              Definido no seu onboarding — usado para personalizar suas recomendações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3">
              {styleInfo.map((info) => (
                <div
                  key={info.label}
                  className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 px-4 py-3"
                >
                  <dt className="text-sm text-muted">{info.label}</dt>
                  <dd className="text-right text-sm font-medium">{info.value}</dd>
                </div>
              ))}
            </dl>
            <form action={redoOnboarding}>
              <Button type="submit" variant="outline" size="sm">
                <RefreshCcw className="size-3.5" />
                Refazer onboarding
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle>Seu progresso</CardTitle>
            <CardDescription>Uma visão geral da sua evolução.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Método</span>
                <span className="font-medium">
                  {doneLessons ?? 0}/{totalLessons ?? 0} aulas · {overallPct}%
                </span>
              </div>
              <Progress value={overallPct} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Plano de 7 dias</span>
                <span className="font-medium">{planDays ?? 0}/{ACTION_PLAN_DAYS.length} dias</span>
              </div>
              <Progress value={((planDays ?? 0) / ACTION_PLAN_DAYS.length) * 100} />
            </div>
            <p className="text-sm text-muted">
              <span className="font-display text-lg font-semibold text-foreground">
                {favorites ?? 0}
              </span>{" "}
              looks favoritados
            </p>
          </CardContent>
        </Card>

        {/* Sessão */}
        <Card>
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
            <CardDescription>Sair da sua conta neste dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" variant="danger">
                <LogOut className="size-4" />
                Sair da conta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
