/**
 * Quanto um aluno rendeu e quanto ele custou de IA — puro, sem banco.
 *
 * O custo de IA vem de duas fontes, e a ordem importa para não contar duas
 * vezes a mesma conversa:
 *
 *  1. `fit_check_requests` (o ledger, desde 03/08/2026) guarda o custo REAL
 *     em centavos, calculado com os tokens que a OpenAI devolveu. É a
 *     verdade e tem prioridade.
 *  2. `fit_check_logs` é mais antigo e não tem custo — só os tokens. Para as
 *     conversas anteriores ao ledger a gente estima pelo preço de tabela do
 *     modelo. Fica marcado como estimativa na tela, porque é o que é.
 *
 * O corte entre as duas é a data da primeira requisição DAQUELE aluno: log
 * mais antigo que isso é de antes do ledger existir para ele.
 */

import {
  custoChamadaCents,
  estimarTaxaCakto,
  GATEWAY_DEFAULTS,
  type FitCheckSettings,
  type GatewaySettings,
} from "./settings-shared";

export type VendaEconomia = {
  amount_cents: number;
  status: string;
  payment_method: string | null;
  /** taxa real informada pelo webhook da Cakto; null = a gente estima */
  gateway_fee_cents: number | null;
  is_test: boolean | null;
};

export type RequisicaoIA = {
  custo_cents: number | null;
  created_at: string;
};

export type LogIA = {
  kind: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
};

export type EconomiaAluno = {
  /** vendas aprovadas, sem as de teste */
  receitaBrutaCents: number;
  /** o que a Cakto fica */
  taxaGatewayCents: number;
  /** quanto entrou de fato na conta */
  receitaLiquidaCents: number;
  /** quanto da taxa é estimada (webhook não informou) */
  taxaEstimadaCents: number;
  /** vendas que voltaram atrás */
  reembolsadoCents: number;
  custoIaCents: number;
  custoIaRealCents: number;
  custoIaEstimadoCents: number;
  /** quantas conversas entraram por estimativa, para avisar na tela */
  chamadasEstimadas: number;
  /** receita líquida menos o custo de IA */
  lucroCents: number;
  /** lucro sobre receita líquida; null quando não houve receita */
  margemPct: number | null;
};

const REEMBOLSOS = new Set(["refunded", "chargeback", "refused"]);

export function calcularEconomiaAluno(entrada: {
  vendas: VendaEconomia[];
  requisicoes: RequisicaoIA[];
  logs: LogIA[];
  fitCheck: Pick<FitCheckSettings, "model" | "model_text">;
  gateway?: GatewaySettings;
}): EconomiaAluno {
  const { vendas, requisicoes, logs, fitCheck, gateway = GATEWAY_DEFAULTS } = entrada;

  /* ---------- receita ---------- */
  const reais = vendas.filter((v) => !v.is_test);

  let receitaBrutaCents = 0;
  let taxaGatewayCents = 0;
  let taxaEstimadaCents = 0;
  let reembolsadoCents = 0;

  for (const v of reais) {
    if (REEMBOLSOS.has(v.status)) {
      reembolsadoCents += v.amount_cents;
      continue;
    }
    if (v.status !== "approved") continue;

    receitaBrutaCents += v.amount_cents;
    if (v.gateway_fee_cents != null) {
      taxaGatewayCents += v.gateway_fee_cents;
    } else {
      const estimada = estimarTaxaCakto(v.amount_cents, v.payment_method ?? "", gateway);
      taxaGatewayCents += estimada;
      taxaEstimadaCents += estimada;
    }
  }

  const receitaLiquidaCents = receitaBrutaCents - taxaGatewayCents;

  /* ---------- custo de IA ---------- */
  const custoIaRealCents = requisicoes.reduce((a, r) => a + (r.custo_cents ?? 0), 0);

  // Marco do ledger para ESTE aluno: antes disso, só existe o log sem custo.
  const inicioLedger = requisicoes.reduce<string | null>(
    (menor, r) => (menor === null || r.created_at < menor ? r.created_at : menor),
    null
  );
  const anterioresAoLedger = logs.filter((l) => inicioLedger === null || l.created_at < inicioLedger);

  const custoIaEstimadoCents = anterioresAoLedger.reduce(
    (a, l) =>
      a +
      custoChamadaCents(
        l.kind === "photo" ? fitCheck.model : fitCheck.model_text,
        l.prompt_tokens ?? 0,
        l.completion_tokens ?? 0
      ),
    0
  );

  const custoIaCents = custoIaRealCents + custoIaEstimadoCents;
  const lucroCents = receitaLiquidaCents - custoIaCents;

  return {
    receitaBrutaCents,
    taxaGatewayCents,
    receitaLiquidaCents,
    taxaEstimadaCents,
    reembolsadoCents,
    custoIaCents,
    custoIaRealCents,
    custoIaEstimadoCents,
    chamadasEstimadas: anterioresAoLedger.length,
    lucroCents,
    margemPct:
      receitaLiquidaCents > 0 ? Math.round((lucroCents / receitaLiquidaCents) * 100) : null,
  };
}
