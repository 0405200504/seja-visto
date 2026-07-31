import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Idempotência do e-mail de acesso.
 *
 * Cenários que estes testes cobrem, na ordem em que doem no cliente real:
 *  · webhook chega duas vezes  → um e-mail só;
 *  · provedor falha            → NÃO marca como enviado, e a retentativa vai;
 *  · duas entregas ao mesmo tempo → só uma manda;
 *  · migração 00023 não aplicada → manda mesmo assim, sem travar o acesso.
 */

const enviados: { para: string; assunto: string }[] = [];
let resultadoDoEnvio: { enviado: boolean; via?: "smtp" | "resend"; motivo?: string };

vi.mock("./mailer", () => ({
  enviarEmail: async (msg: { para: string; assunto: string }) => {
    enviados.push({ para: msg.para, assunto: msg.assunto });
    return resultadoDoEnvio;
  },
  sanitizarErro: (v: unknown) => String(v),
}));

const { chaveAcesso, enviarEmailRegistrado, reservarEnvio } = await import("./envio");

/* ---------- Supabase de mentira, só com a tabela email_sends ---------- */

type Linha = {
  id: number;
  chave: string;
  tipo: string;
  email: string;
  user_id: string | null;
  status: string;
  provedor: string | null;
  tentativas: number;
  error_message: string | null;
  updated_at: string;
  sent_at: string | null;
};

let tabela: Linha[];
let proximoId: number;
let tabelaExiste: boolean;

function fakeDb() {
  const erroTabelaAusente = {
    code: "42P01",
    message: 'relation "public.email_sends" does not exist',
  };

  return {
    from() {
      const filtros: [string, unknown][] = [];
      let acao: "select" | "insert" | "update" = "select";
      let patch: Partial<Linha> = {};
      let novo: Linha | null = null;

      const casa = (l: Linha) => filtros.every(([col, val]) => (l as never as Record<string, unknown>)[col] === val);

      const executar = () => {
        if (!tabelaExiste) return { data: null, error: erroTabelaAusente };

        if (acao === "insert") {
          if (tabela.some((l) => l.chave === novo!.chave)) {
            return { data: null, error: { code: "23505", message: "duplicate key" } };
          }
          tabela.push(novo!);
          return { data: { ...novo! }, error: null };
        }
        if (acao === "update") {
          const alvos = tabela.filter(casa);
          for (const l of alvos) Object.assign(l, patch);
          return { data: alvos.length ? { ...alvos[0] } : null, error: null };
        }
        const achado = tabela.find(casa);
        return { data: achado ? { ...achado } : null, error: null };
      };

      const construtor = {
        insert(valores: Partial<Linha>) {
          acao = "insert";
          novo = {
            id: proximoId++,
            provedor: null,
            tentativas: 1,
            error_message: null,
            sent_at: null,
            updated_at: new Date().toISOString(),
            user_id: null,
            status: "enviando",
            ...valores,
          } as Linha;
          return construtor;
        },
        update(valores: Partial<Linha>) {
          acao = "update";
          patch = valores;
          return construtor;
        },
        select() {
          return construtor;
        },
        eq(col: string, val: unknown) {
          filtros.push([col, val]);
          return construtor;
        },
        single: async () => executar(),
        maybeSingle: async () => executar(),
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(executar()).then(resolve),
      };
      return construtor;
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => fakeDb() as any;

const MENSAGEM = {
  para: "cliente@exemplo.com",
  assunto: "Seu acesso ao MPO está liberado",
  html: "<p>oi</p>",
  texto: "oi",
};
const RESERVA = { chave: chaveAcesso("user-1"), tipo: "acesso" as const, userId: "user-1" };

beforeEach(() => {
  tabela = [];
  proximoId = 1;
  tabelaExiste = true;
  enviados.length = 0;
  resultadoDoEnvio = { enviado: true, via: "smtp" };
});

describe("enviarEmailRegistrado", () => {
  it("envia uma vez e registra como enviado", async () => {
    const r = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);
    expect(r.enviado).toBe(true);
    expect(enviados).toHaveLength(1);
    expect(tabela[0]).toMatchObject({ status: "enviado", provedor: "smtp", tipo: "acesso" });
    expect(tabela[0].sent_at).not.toBeNull();
  });

  it("webhook recebido duas vezes manda UM e-mail só", async () => {
    await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);
    const segundo = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);

    expect(enviados).toHaveLength(1);
    expect(segundo).toMatchObject({ enviado: true, duplicado: true });
    expect(tabela).toHaveLength(1);
  });

  it("falha do provedor NÃO vira enviado e libera nova tentativa", async () => {
    resultadoDoEnvio = { enviado: false, motivo: "Resend 503: indisponível" };
    const primeiro = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);

    expect(primeiro.enviado).toBe(false);
    expect(tabela[0]).toMatchObject({ status: "falhou", sent_at: null });
    expect(tabela[0].error_message).toContain("503");

    // Retentativa da Cakto, agora com o provedor de volta.
    resultadoDoEnvio = { enviado: true, via: "resend" };
    const segundo = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);

    expect(segundo.enviado).toBe(true);
    expect(enviados).toHaveLength(2);
    expect(tabela).toHaveLength(1);
    expect(tabela[0]).toMatchObject({ status: "enviado", tentativas: 2, error_message: null });
  });

  it("não manda de novo enquanto o primeiro envio está em andamento", async () => {
    await reservarEnvio(db(), { ...RESERVA, email: MENSAGEM.para }); // reserva viva
    const concorrente = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);

    expect(concorrente.enviado).toBe(false);
    expect(concorrente.duplicado).toBe(true);
    expect(enviados).toHaveLength(0);
  });

  it("retoma uma reserva presa há mais de 10 minutos", async () => {
    await reservarEnvio(db(), { ...RESERVA, email: MENSAGEM.para });
    tabela[0].updated_at = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    const r = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);
    expect(r.enviado).toBe(true);
    expect(enviados).toHaveLength(1);
  });

  it("com a migração pendente, envia assim mesmo (cliente não fica sem acesso)", async () => {
    tabelaExiste = false;
    const r = await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);
    expect(r.enviado).toBe(true);
    expect(enviados).toHaveLength(1);
  });

  it("separa as chaves por usuário", async () => {
    await enviarEmailRegistrado(db(), RESERVA, MENSAGEM);
    await enviarEmailRegistrado(
      db(),
      { chave: chaveAcesso("user-2"), tipo: "acesso", userId: "user-2" },
      { ...MENSAGEM, para: "outro@exemplo.com" }
    );
    expect(enviados).toHaveLength(2);
    expect(tabela).toHaveLength(2);
  });
});
