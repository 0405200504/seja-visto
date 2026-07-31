import { describe, it, expect, vi, beforeEach } from "vitest";
import { FIT_CHECK_DEFAULTS } from "./settings-shared";

/**
 * Testes do motor de alertas.
 *
 * O que importa provar aqui não é a consulta (isso foi conferido rodando o
 * SQL no banco real), e sim as DECISÕES: o que vira crítico, o que vira
 * atenção, em que ordem aparece, e se uma verificação quebrada derruba as
 * outras — que é o pior defeito possível numa página de alertas.
 */

type Linhas = Record<string, unknown[]>;

let tabelas: Linhas;
let gastoDia: number;
let gastoMes: number;
let settings: Record<string, unknown>;
let quebrar: string | null;

function reset() {
  tabelas = {
    sales: [],
    user_entitlements: [],
    webhook_events: [],
    fit_check_requests: [],
    auth_attempts: [],
    community_fits: [],
    fit_check_credits: [],
  };
  gastoDia = 0;
  gastoMes = 0;
  settings = { ...FIT_CHECK_DEFAULTS };
  quebrar = null;
}

/** Encadeamento do supabase-js, devolvendo as linhas da tabela pedida. */
function tabelaMock(nome: string) {
  if (quebrar === nome) throw new Error("banco fora do ar");

  const linhas = tabelas[nome] ?? [];
  const resultado = { data: linhas, error: null, count: linhas.length };

  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    gt: () => chain,
    lt: () => chain,
    not: () => chain,
    in: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    then: (r: (v: unknown) => unknown) => Promise.resolve(resultado).then(r),
  };
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (n: string) => tabelaMock(n),
    rpc: async (_fn: string, args: { p_desde: string }) => {
      const desde = new Date(args.p_desde);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      // Distingue a chamada do dia da do mês pela data pedida.
      return { data: desde.getTime() <= inicioMes.getTime() ? gastoMes : gastoDia, error: null };
    },
  }),
}));

vi.mock("@/lib/admin/settings", async () => {
  const shared = await import("./settings-shared");
  return { ...shared, getSetting: async () => settings };
});

async function carregar() {
  const { carregarAlertas } = await import("./alertas");
  return carregarAlertas();
}

beforeEach(() => {
  reset();
  vi.resetModules();
});

describe("quando está tudo certo", () => {
  it("não inventa alerta nenhum", async () => {
    const { alertas, resumo } = await carregar();
    expect(alertas).toHaveLength(0);
    expect(resumo).toEqual({ criticos: 0, atencao: 0 });
  });
});

describe("dinheiro parado", () => {
  it("cliente que pagou e está sem acesso vira CRÍTICO", async () => {
    tabelas.sales = [
      { id: "1", email: "aluno@teste.com", user_id: "u1", amount_cents: 2700 },
    ];
    tabelas.user_entitlements = []; // ninguém com acesso

    const { alertas, resumo } = await carregar();
    const a = alertas.find((x) => x.id === "compra-sem-acesso");

    expect(a?.severidade).toBe("critico");
    expect(a?.itens?.[0]).toContain("aluno@teste.com");
    expect(a?.itens?.[0]).toContain("R$ 27,00");
    expect(resumo.criticos).toBe(1);
  });

  it("não alerta quando a venda já teve o acesso liberado", async () => {
    tabelas.sales = [{ id: "1", email: "ok@teste.com", user_id: "u1", amount_cents: 2700 }];
    tabelas.user_entitlements = [{ user_id: "u1" }];

    const { alertas } = await carregar();
    expect(alertas.find((x) => x.id === "compra-sem-acesso")).toBeUndefined();
  });

  it("webhook com falha vira CRÍTICO e mostra o erro", async () => {
    tabelas.webhook_events = [
      { event_type: "purchase", user_email: "x@teste.com", error_message: "timeout" },
    ];
    const { alertas } = await carregar();
    const a = alertas.find((x) => x.id === "webhook-falha");
    expect(a?.severidade).toBe("critico");
    expect(a?.itens?.[0]).toContain("timeout");
  });
});

describe("teto de gasto de IA", () => {
  it("80% do teto diário vira ATENÇÃO", async () => {
    settings = { ...FIT_CHECK_DEFAULTS, daily_budget_reais: 100 };
    gastoDia = 8000; // R$ 80 de R$ 100

    const { alertas } = await carregar();
    const a = alertas.find((x) => x.id === "teto-dia");
    expect(a?.severidade).toBe("atencao");
    expect(a?.valor).toBe("80%");
  });

  it("teto estourado vira CRÍTICO e avisa que o Fit Check parou", async () => {
    settings = { ...FIT_CHECK_DEFAULTS, daily_budget_reais: 100 };
    gastoDia = 10_000;

    const { alertas } = await carregar();
    const a = alertas.find((x) => x.id === "teto-dia");
    expect(a?.severidade).toBe("critico");
    expect(a?.titulo).toMatch(/parou/i);
  });

  it("gasto normal não gera alerta", async () => {
    settings = { ...FIT_CHECK_DEFAULTS, daily_budget_reais: 100 };
    gastoDia = 1500; // 15%

    const { alertas } = await carregar();
    expect(alertas.find((x) => x.id === "teto-dia")).toBeUndefined();
  });

  it("teto zerado desliga a verificação em vez de dividir por zero", async () => {
    settings = { ...FIT_CHECK_DEFAULTS, daily_budget_reais: 0, monthly_budget_reais: 0 };
    gastoDia = 99_999;

    const { alertas } = await carregar();
    expect(alertas.find((x) => x.id === "teto-dia")).toBeUndefined();
    expect(alertas.find((x) => x.id === "teto-mes")).toBeUndefined();
  });

  it("kill switch desligado aparece como CRÍTICO", async () => {
    settings = { ...FIT_CHECK_DEFAULTS, ai_enabled: false };
    const { alertas } = await carregar();
    const a = alertas.find((x) => x.id === "ia-desligada");
    expect(a?.severidade).toBe("critico");
  });
});

describe("segurança e operação", () => {
  it("poucas falhas de login não viram alerta (evita ruído)", async () => {
    tabelas.auth_attempts = Array.from({ length: 5 }, () => ({
      ip_hash: "a",
      email_hash: "b",
      acao: "login",
    }));
    const { alertas } = await carregar();
    expect(alertas.find((x) => x.id === "ataque-login")).toBeUndefined();
  });

  it("muitos e-mails por IP é reconhecido como teste de senha em massa", async () => {
    tabelas.auth_attempts = Array.from({ length: 40 }, (_, i) => ({
      ip_hash: "mesmo-ip",
      email_hash: `email-${i}`,
      acao: "login",
    }));
    const { alertas } = await carregar();
    const a = alertas.find((x) => x.id === "ataque-login");
    expect(a?.severidade).toBe("critico");
    expect(a?.detalhe).toMatch(/senha em massa/i);
  });

  it("alunos sem token entram como informativo, não como problema", async () => {
    tabelas.fit_check_credits = [{ balance: 0 }, { balance: 0 }];
    const { alertas, resumo } = await carregar();
    const a = alertas.find((x) => x.id === "sem-token");
    expect(a?.severidade).toBe("ok");
    expect(resumo.criticos).toBe(0);
    expect(resumo.atencao).toBe(0);
  });
});

describe("robustez", () => {
  it("uma verificação quebrada não derruba as outras", async () => {
    quebrar = "community_fits"; // essa consulta vai lançar exceção
    tabelas.webhook_events = [{ event_type: "x", user_email: "a@b.c", error_message: "erro" }];

    const { alertas } = await carregar();

    // O webhook continua sendo reportado...
    expect(alertas.find((x) => x.id === "webhook-falha")?.severidade).toBe("critico");
    // ...e a que quebrou vira um alerta avisando disso.
    const falha = alertas.find((x) => x.id === "fits-moderacao-erro");
    expect(falha?.severidade).toBe("atencao");
    expect(falha?.titulo).toMatch(/não consegui verificar/i);
  });

  it("crítico sempre aparece antes de atenção e de informativo", async () => {
    tabelas.webhook_events = [{ event_type: "x", user_email: "a@b.c", error_message: "e" }];
    tabelas.community_fits = [{ id: 1 }];
    tabelas.fit_check_credits = [{ balance: 0 }];

    const { alertas } = await carregar();
    const ordem = alertas.map((a) => a.severidade);
    const esperada = [...ordem].sort(
      (a, b) =>
        ["critico", "atencao", "ok"].indexOf(a) - ["critico", "atencao", "ok"].indexOf(b)
    );
    expect(ordem).toEqual(esperada);
    expect(ordem[0]).toBe("critico");
  });
});
