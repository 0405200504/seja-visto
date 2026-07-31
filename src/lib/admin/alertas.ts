import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting, FIT_CHECK_DEFAULTS, type FitCheckSettings } from "@/lib/admin/settings";

/**
 * Motor de alertas do painel.
 *
 * Tudo aqui é calculado NA HORA, direto do banco — nada é lido de uma tabela
 * de "alertas gravados". É de propósito: alerta guardado envelhece e vira
 * ruído (você vê "compra sem acesso" que já foi resolvida há dois dias). O
 * que importa é o que está errado AGORA.
 *
 * Cada verificação é independente e falha sozinha: se uma consulta quebrar,
 * as outras continuam aparecendo, e a que quebrou vira um alerta dizendo
 * isso — em vez de derrubar a página inteira.
 */

export type Severidade = "critico" | "atencao" | "ok";

export type Alerta = {
  id: string;
  severidade: Severidade;
  titulo: string;
  /** o que está acontecendo, em português de gente */
  detalhe: string;
  /** o que fazer a respeito */
  acao?: string;
  href?: string;
  /** número que resume o alerta (contagem, valor) */
  valor?: string;
  /** linhas de exemplo, quando ajudam a agir */
  itens?: string[];
};

export type PainelAlertas = {
  alertas: Alerta[];
  geradoEm: string;
  resumo: { criticos: number; atencao: number };
};

type DB = ReturnType<typeof createAdminClient>;

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const hAtras = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Roda uma verificação isolando o erro dela. */
async function checar(
  id: string,
  nome: string,
  fn: () => Promise<Alerta | null>
): Promise<Alerta | null> {
  try {
    return await fn();
  } catch (err) {
    return {
      id: `${id}-erro`,
      severidade: "atencao",
      titulo: `Não consegui verificar: ${nome}`,
      detalhe:
        err instanceof Error ? err.message : "Erro desconhecido ao consultar o banco.",
      acao: "Se persistir, o banco pode estar fora do ar.",
    };
  }
}

// ---------------------------------------------------------------- dinheiro

/** Cliente pagou e não recebeu acesso. O alerta mais caro que existe. */
async function compraSemAcesso(db: DB): Promise<Alerta | null> {
  const { data: vendas } = await db
    .from("sales")
    .select("id, email, user_id, amount_cents, created_at")
    .eq("status", "approved")
    .eq("is_test", false)
    .not("user_id", "is", null)
    // 15 min de tolerância: o webhook pode estar a caminho
    .lt("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .gte("created_at", hAtras(72))
    .limit(100);

  if (!vendas?.length) return null;

  const ids = [...new Set(vendas.map((v) => v.user_id as string))];
  const { data: acessos } = await db
    .from("user_entitlements")
    .select("user_id")
    .eq("entitlement", "base")
    .in("user_id", ids);

  const comAcesso = new Set((acessos ?? []).map((a) => a.user_id));
  const semAcesso = vendas.filter((v) => !comAcesso.has(v.user_id as string));
  if (!semAcesso.length) return null;

  return {
    id: "compra-sem-acesso",
    severidade: "critico",
    titulo: "Cliente pagou e está sem acesso",
    valor: String(semAcesso.length),
    detalhe:
      `${semAcesso.length} compra(s) aprovada(s) há mais de 15 minutos sem o acesso liberado. ` +
      `Essa pessoa pagou e não está conseguindo entrar.`,
    acao: "Libere manualmente em /admin/alunos e depois veja por que o webhook não rodou.",
    href: "/admin/alunos",
    itens: semAcesso
      .slice(0, 6)
      .map((v) => `${v.email} — ${brl(v.amount_cents)}`),
  };
}

/** Webhook da Cakto falhando = venda que não vira acesso. */
async function webhooksComFalha(db: DB): Promise<Alerta | null> {
  const { data } = await db
    .from("webhook_events")
    .select("event_type, user_email, error_message, created_at")
    .eq("status", "failed")
    .gte("created_at", hAtras(24))
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data?.length) return null;

  return {
    id: "webhook-falha",
    severidade: "critico",
    titulo: "Webhook da Cakto com falha",
    valor: String(data.length),
    detalhe:
      `${data.length} evento(s) falharam nas últimas 24h. Cada um pode ser uma venda ` +
      `que não liberou acesso.`,
    acao: "Veja o erro em /admin/sistema/webhooks e reprocesse.",
    href: "/admin/sistema/webhooks",
    itens: data
      .slice(0, 6)
      .map((f) => `${f.user_email ?? "sem e-mail"} — ${f.error_message ?? f.event_type}`),
  };
}

// ---------------------------------------------------------------- custo de IA

/** Gasto de IA contra os dois tetos, e o estado do kill switch. */
async function orcamentoIA(db: DB, s: FitCheckSettings): Promise<Alerta[]> {
  const out: Alerta[] = [];

  if (s.ai_enabled === false) {
    out.push({
      id: "ia-desligada",
      severidade: "critico",
      titulo: "O Fit Check está DESLIGADO",
      detalhe:
        "A chave geral está em 'desligado'. Nenhum aluno consegue usar o consultor de IA — " +
        "só você, como admin.",
      acao: "Se não foi de propósito, religue agora.",
      href: "/admin/sistema/ia",
    });
  }

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [dia, mes] = await Promise.all([
    db.rpc("fit_check_gasto_cents", { p_desde: inicioDia.toISOString() }),
    db.rpc("fit_check_gasto_cents", { p_desde: inicioMes.toISOString() }),
  ]);

  const gastoDia = typeof dia.data === "number" ? dia.data : 0;
  const gastoMes = typeof mes.data === "number" ? mes.data : 0;

  const avaliar = (
    id: string,
    rotulo: string,
    gasto: number,
    tetoReais: number,
    onde: string
  ): Alerta | null => {
    if (tetoReais <= 0) return null;
    const teto = tetoReais * 100;
    const pct = Math.round((gasto / teto) * 100);

    if (gasto >= teto) {
      return {
        id,
        severidade: "critico",
        titulo: `Teto ${rotulo} de IA ESTOURADO — o Fit Check parou`,
        valor: `${pct}%`,
        detalhe:
          `Já foram gastos ${brl(gasto)} de um teto de R$ ${tetoReais}. ` +
          `Nenhum aluno consegue usar o consultor ${onde}.`,
        acao: `Aumente o teto em /admin/sistema/ia se o gasto for legítimo.`,
        href: "/admin/sistema/ia",
      };
    }
    if (pct >= 80) {
      return {
        id,
        severidade: "atencao",
        titulo: `Gasto de IA ${rotulo} em ${pct}% do teto`,
        valor: `${pct}%`,
        detalhe: `${brl(gasto)} gastos de R$ ${tetoReais}. No ritmo atual o teto estoura ${onde}.`,
        acao: "Confira se é uso normal ou se alguém está abusando.",
        href: "/admin/sistema/ia",
      };
    }
    return null;
  };

  const a = avaliar("teto-dia", "do DIA", gastoDia, s.daily_budget_reais, "até a meia-noite");
  const b = avaliar("teto-mes", "do MÊS", gastoMes, s.monthly_budget_reais, "antes de virar o mês");
  if (a) out.push(a);
  if (b) out.push(b);

  return out;
}

/** Chamadas de IA que falharam — pode ser a OpenAI fora do ar. */
async function errosDeIA(db: DB): Promise<Alerta | null> {
  const { data } = await db
    .from("fit_check_requests")
    .select("erro, created_at")
    .eq("status", "estornado")
    .gte("created_at", hAtras(2))
    .limit(50);

  if (!data || data.length < 3) return null;

  return {
    id: "ia-erros",
    severidade: "critico",
    titulo: "Fit Check falhando em série",
    valor: String(data.length),
    detalhe:
      `${data.length} análises falharam nas últimas 2 horas e os tokens foram devolvidos. ` +
      `Costuma ser chave inválida, saldo zerado na OpenAI ou instabilidade deles.`,
    acao: "Confira saldo e chave em platform.openai.com.",
    itens: [...new Set(data.map((d) => d.erro ?? "sem detalhe"))].slice(0, 4),
  };
}

/** Requisição travada em 'reservado' = aluno preso sem conseguir usar. */
async function analisesTravadas(db: DB): Promise<Alerta | null> {
  const { data } = await db
    .from("fit_check_requests")
    .select("user_id, created_at")
    .eq("status", "reservado")
    .lt("created_at", new Date(Date.now() - 10 * 60_000).toISOString())
    .limit(50);

  if (!data?.length) return null;

  return {
    id: "ia-travada",
    severidade: "atencao",
    titulo: "Análises travadas no meio",
    valor: String(data.length),
    detalhe:
      `${data.length} análise(s) começaram há mais de 10 minutos e nunca terminaram. ` +
      `O aluno pode ter perdido o token sem receber resposta.`,
    acao: "O lock libera sozinho em 2 minutos; se o número só cresce, algo está quebrando no meio.",
  };
}

// ---------------------------------------------------------------- segurança

/** Pico de falha de login = alguém tentando entrar à força. */
async function ataqueDeLogin(db: DB): Promise<Alerta | null> {
  const { data, error } = await db
    .from("auth_attempts")
    .select("ip_hash, email_hash, acao")
    .eq("sucesso", false)
    .gte("created_at", hAtras(1))
    .limit(1000);

  // A tabela existe mas ainda não é alimentada — não vale poluir o painel.
  if (error || !data?.length) return null;
  if (data.length < 20) return null;

  const ips = new Set(data.map((d) => d.ip_hash)).size;
  const emails = new Set(data.map((d) => d.email_hash)).size;

  return {
    id: "ataque-login",
    severidade: "critico",
    titulo: "Possível ataque de login em andamento",
    valor: String(data.length),
    detalhe:
      `${data.length} tentativas falharam na última hora, vindas de ${ips} IP(s) contra ` +
      `${emails} e-mail(s). ` +
      (emails > ips * 3
        ? "Muitos e-mails por IP: parece teste de senha em massa."
        : "Poucos e-mails e muitas tentativas: parece ataque a uma conta específica."),
    acao: "Se persistir, ative o CAPTCHA no Supabase e aperte os rate limits.",
  };
}

// ---------------------------------------------------------------- operação

async function fitsNaModeracao(db: DB): Promise<Alerta | null> {
  const { count } = await db
    .from("community_fits")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", hAtras(24));

  if (!count) return null;

  return {
    id: "fits-moderacao",
    severidade: "atencao",
    titulo: "Fits esperando sua aprovação",
    valor: String(count),
    detalhe: `${count} fit(s) parados há mais de 24h. O aluno enviou e está esperando aparecer.`,
    acao: "Aprove em /admin/comunidade.",
    href: "/admin/comunidade",
  };
}

async function acessosVencendo(db: DB): Promise<Alerta | null> {
  const { count } = await db
    .from("user_entitlements")
    .select("*", { count: "exact", head: true })
    .eq("entitlement", "base")
    .not("expires_at", "is", null)
    .gt("expires_at", new Date().toISOString())
    .lt("expires_at", new Date(Date.now() + 7 * 24 * 3600_000).toISOString());

  if (!count) return null;

  return {
    id: "acessos-vencendo",
    severidade: "atencao",
    titulo: "Acessos vencendo em 7 dias",
    valor: String(count),
    detalhe: `${count} aluno(s) perdem o acesso na próxima semana.`,
    acao: "Boa hora para disparar mensagem de renovação.",
    href: "/admin/alunos",
  };
}

/** Não é problema — é venda esperando acontecer. */
async function alunosSemToken(db: DB): Promise<Alerta | null> {
  const { count } = await db
    .from("fit_check_credits")
    .select("*", { count: "exact", head: true })
    .eq("balance", 0);

  if (!count) return null;

  return {
    id: "sem-token",
    severidade: "ok",
    titulo: "Alunos sem token de imagem",
    valor: String(count),
    detalhe: `${count} aluno(s) zeraram os tokens. São os mais propensos a comprar um pacote.`,
    acao: "Oportunidade de oferta, não é um problema.",
    href: "/admin/alunos",
  };
}

// ---------------------------------------------------------------- montagem

export async function carregarAlertas(): Promise<PainelAlertas> {
  const db = createAdminClient();
  const settings = await getSetting<FitCheckSettings>("fit_check", FIT_CHECK_DEFAULTS);

  /* Cada verificação devolve 0, 1 ou vários alertas. Normalizar tudo para
   * lista deixa o orçamento (que gera um do dia e um do mês) igual aos
   * outros, sem tratamento especial. */
  const unico = (
    id: string,
    nome: string,
    fn: () => Promise<Alerta | null>
  ): Promise<Alerta[]> => checar(id, nome, fn).then((a) => (a ? [a] : []));

  const grupos = await Promise.all([
    unico("compra-sem-acesso", "compras sem acesso", () => compraSemAcesso(db)),
    unico("webhook-falha", "webhooks da Cakto", () => webhooksComFalha(db)),
    orcamentoIA(db, settings).catch(() => []),
    unico("ia-erros", "erros de IA", () => errosDeIA(db)),
    unico("ia-travada", "análises travadas", () => analisesTravadas(db)),
    unico("ataque-login", "tentativas de login", () => ataqueDeLogin(db)),
    unico("fits-moderacao", "moderação de fits", () => fitsNaModeracao(db)),
    unico("acessos-vencendo", "acessos vencendo", () => acessosVencendo(db)),
    unico("sem-token", "alunos sem token", () => alunosSemToken(db)),
  ]);

  const alertas = grupos.flat();
  const ordem: Record<Severidade, number> = { critico: 0, atencao: 1, ok: 2 };
  alertas.sort((a, b) => ordem[a.severidade] - ordem[b.severidade]);

  return {
    alertas,
    geradoEm: new Date().toISOString(),
    resumo: {
      criticos: alertas.filter((a) => a.severidade === "critico").length,
      atencao: alertas.filter((a) => a.severidade === "atencao").length,
    },
  };
}

/**
 * Contagem enxuta para o selo da barra lateral.
 *
 * NÃO chama carregarAlertas(): o selo aparece no layout, que roda em toda
 * página do admin, e o motor completo faz ~10 consultas. Aqui só entram as
 * duas verificações de dinheiro parado, ambas com `head: true` (contagem
 * pura, sem trazer linha). É o suficiente para o selo — o detalhe fica na
 * página de alertas.
 */
export async function contarAlertasCriticos(): Promise<number> {
  try {
    const db = createAdminClient();
    const { count } = await db
      .from("webhook_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", hAtras(24));

    return count ?? 0;
  } catch {
    return 0;
  }
}
