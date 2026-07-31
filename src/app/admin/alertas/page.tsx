import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { carregarAlertas, type Alerta, type Severidade } from "@/lib/admin/alertas";
import { AutoRefresh } from "@/components/admin/alertas/auto-refresh";
import { cn } from "@/lib/utils";

// Nunca cachear: uma página de alertas em cache é pior que não ter página.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ESTILO: Record<
  Severidade,
  { rotulo: string; icone: typeof AlertTriangle; card: string; selo: string }
> = {
  critico: {
    rotulo: "Crítico",
    icone: ShieldAlert,
    card: "border-danger/40 bg-danger/[0.04]",
    selo: "bg-danger/10 text-danger",
  },
  atencao: {
    rotulo: "Atenção",
    icone: AlertTriangle,
    card: "border-warning/40 bg-warning/[0.04]",
    selo: "bg-warning/10 text-warning",
  },
  ok: {
    rotulo: "Informativo",
    icone: Info,
    card: "border-border bg-surface",
    selo: "bg-surface-2 text-muted",
  },
};

function CardAlerta({ alerta }: { alerta: Alerta }) {
  const estilo = ESTILO[alerta.severidade];
  const Icone = estilo.icone;

  return (
    <div className={cn("rounded-xl border p-4", estilo.card)}>
      <div className="flex items-start gap-3">
        <Icone
          className={cn(
            "mt-0.5 size-4 shrink-0",
            alerta.severidade === "critico" && "text-danger",
            alerta.severidade === "atencao" && "text-warning",
            alerta.severidade === "ok" && "text-muted"
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                estilo.selo
              )}
            >
              {estilo.rotulo}
            </span>
            <h3 className="text-sm font-semibold text-foreground">{alerta.titulo}</h3>
            {alerta.valor && (
              <span className="ml-auto text-lg font-bold tabular-nums text-foreground">
                {alerta.valor}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{alerta.detalhe}</p>

          {alerta.itens && alerta.itens.length > 0 && (
            <ul className="mt-2 space-y-0.5 rounded-lg bg-surface-2/60 px-3 py-2">
              {alerta.itens.map((item, i) => (
                <li key={i} className="truncate font-mono text-[11px] text-muted">
                  {item}
                </li>
              ))}
            </ul>
          )}

          {alerta.acao && (
            <p className="mt-2 text-[13px] font-medium text-foreground">{alerta.acao}</p>
          )}

          {alerta.href && (
            <Link
              href={alerta.href}
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              Resolver agora <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AlertasPage() {
  await requireAdmin();
  const { alertas, geradoEm, resumo } = await carregarAlertas();

  const criticos = alertas.filter((a) => a.severidade === "critico");
  const atencao = alertas.filter((a) => a.severidade === "atencao");
  const infos = alertas.filter((a) => a.severidade === "ok");

  const tudoCerto = resumo.criticos === 0 && resumo.atencao === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Alertas</h1>
          <p className="mt-0.5 text-xs text-muted">
            Tudo que precisa da sua atenção agora. A página se atualiza sozinha.
          </p>
        </div>
        <AutoRefresh geradoEm={geradoEm} />
      </div>

      {tudoCerto ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-success/40 bg-success/[0.04] px-6 py-12 text-center">
          <CheckCircle2 className="size-7 text-success" />
          <p className="text-sm font-semibold text-foreground">Nada pedindo atenção</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-muted">
            Nenhuma compra travada, nenhum webhook com falha, gasto de IA dentro do teto.
            Se algo aparecer, surge aqui em até 30 segundos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">
              Críticos
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold tabular-nums",
                resumo.criticos > 0 ? "text-danger" : "text-foreground"
              )}
            >
              {resumo.criticos}
            </p>
            <p className="text-[11px] text-muted">custam dinheiro ou cliente agora</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">
              Atenção
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold tabular-nums",
                resumo.atencao > 0 ? "text-warning" : "text-foreground"
              )}
            >
              {resumo.atencao}
            </p>
            <p className="text-[11px] text-muted">resolva ainda hoje</p>
          </div>
        </div>
      )}

      {criticos.length > 0 && (
        <section className="space-y-2.5">
          {criticos.map((a) => (
            <CardAlerta key={a.id} alerta={a} />
          ))}
        </section>
      )}

      {atencao.length > 0 && (
        <section className="space-y-2.5">
          {atencao.map((a) => (
            <CardAlerta key={a.id} alerta={a} />
          ))}
        </section>
      )}

      {infos.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-2">
            Bom saber
          </h2>
          {infos.map((a) => (
            <CardAlerta key={a.id} alerta={a} />
          ))}
        </section>
      )}
    </div>
  );
}
