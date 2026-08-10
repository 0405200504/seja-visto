import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Lembrete de aluno inativo.
 *
 * Os testes daqui cobrem os casos em que a mensagem seria uma MENTIRA ou
 * um incômodo: quem voltou a acessar, quem nunca acessou, quem perdeu o
 * acesso, quem pediu PARAR e quem já recebeu o lembrete há pouco.
 */

process.env.WHATSAPP_QUEUE_ENABLED = "true";
process.env.WHATSAPP_INACTIVITY_ENABLED = "true";
process.env.WHATSAPP_AUTOMATION_TEST_MODE = "false";
process.env.NEXT_PUBLIC_SITE_URL = "https://www.manualpraticodooutfit.com.br";

vi.mock("./uazapi", () => ({
  enviarTexto: async () => ({ ok: true, providerMessageId: "msg-1", codigo: 200 }),
  statusInstancia: async () => ({ conectada: true, estado: "connected" }),
  logEnvio: () => {},
}));

const { buscarAlunosInativos, continuaInativo } = await import("./inatividade");
const { agendarLembretesInatividade } = await import("./automacoes");
const { conferirAntesDeEnviar } = await import("./fila");
const { textoInatividade } = await import("./templates");

/* ---------- banco de mentira ---------- */
type Linha = Record<string, unknown> & { id: number };
let tabelas: Record<string, Linha[]>;
let proximoId: number;

function construtor(nome: string) {
  const filtros: { col: string; op: string; val: unknown }[] = [];
  let acao: "select" | "insert" = "select";
  let novo: Linha | null = null;

  const casa = (l: Linha) =>
    filtros.every((f) => {
      const v = l[f.col];
      if (f.op === "eq") return v === f.val;
      if (f.op === "in") return (f.val as unknown[]).includes(v);
      if (f.op === "gte") return typeof v === "string" && v >= (f.val as string);
      if (f.op === "lte") return typeof v === "string" && v <= (f.val as string);
      if (f.op === "is-null") return v === null || v === undefined;
      if (f.op === "not-null") return v !== null && v !== undefined;
      return true;
    });

  const exec = () => {
    const linhas = tabelas[nome] ?? (tabelas[nome] = []);
    if (acao === "insert") {
      if (nome === "whatsapp_messages" && linhas.some((l) => l.dedupe_key === novo!.dedupe_key)) {
        return { data: null, error: { code: "23505", message: "duplicate" } };
      }
      linhas.push(novo!);
      return { data: { ...novo! }, error: null };
    }
    return { data: linhas.filter(casa).map((l) => ({ ...l })), error: null };
  };

  const api = {
    insert(v: Record<string, unknown>) {
      acao = "insert";
      novo = { id: proximoId++, attempts: 0, created_at: new Date().toISOString(), ...v } as Linha;
      return api;
    },
    select: () => api,
    eq(col: string, val: unknown) {
      filtros.push({ col, op: "eq", val });
      return api;
    },
    in(col: string, val: unknown[]) {
      filtros.push({ col, op: "in", val });
      return api;
    },
    gte(col: string, val: unknown) {
      filtros.push({ col, op: "gte", val });
      return api;
    },
    lte(col: string, val: unknown) {
      filtros.push({ col, op: "lte", val });
      return api;
    },
    is(col: string) {
      filtros.push({ col, op: "is-null", val: null });
      return api;
    },
    not(col: string) {
      filtros.push({ col, op: "not-null", val: null });
      return api;
    },
    single: async () => {
      const r = exec();
      return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error };
    },
    maybeSingle: async () => {
      const r = exec();
      return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error };
    },
    then: (res: (v: unknown) => unknown) => Promise.resolve(exec()).then(res),
  };
  return api;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => ({ from: (nome: string) => construtor(nome) }) as any;

const diasAtras = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const CONTATO = {
  id: 1,
  phone: "5515988300526",
  name: "Maria Silva",
  email: "maria@exemplo.com",
  user_id: "u1",
  opted_out_at: null,
  consent_granted_at: diasAtras(40),
};

beforeEach(() => {
  proximoId = 100;
  tabelas = {
    whatsapp_contacts: [{ ...CONTATO } as unknown as Linha],
    // Parada há 5 dias: dentro da janela de 3 a 30.
    users_profile: [{ id: 1, user_id: "u1", email: "maria@exemplo.com", last_seen_at: diasAtras(5) } as Linha],
    user_entitlements: [{ id: 1, user_id: "u1", entitlement: "base", expires_at: null } as Linha],
    whatsapp_messages: [],
  };
});

describe("quem entra na janela", () => {
  it("aluno com acesso ativo e 5 dias parado entra", async () => {
    const inativos = await buscarAlunosInativos(db());
    expect(inativos).toHaveLength(1);
    expect(inativos[0].contato.id).toBe(1);
    expect(inativos[0].diasParado).toBe(5);
  });

  it("quem acessou ontem não entra", async () => {
    tabelas.users_profile[0].last_seen_at = diasAtras(1);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("quem NUNCA acessou não entra — a mensagem diria uma mentira", async () => {
    tabelas.users_profile[0].last_seen_at = null;
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("quem sumiu há 60 dias não entra — é outra conversa", async () => {
    tabelas.users_profile[0].last_seen_at = diasAtras(60);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("quem pediu PARAR não entra", async () => {
    tabelas.whatsapp_contacts[0].opted_out_at = diasAtras(2);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("contato sem consentimento registrado não entra", async () => {
    tabelas.whatsapp_contacts[0].consent_granted_at = null;
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("acesso expirado não entra — quem perdeu acesso é caso da renovação", async () => {
    tabelas.user_entitlements[0].expires_at = diasAtras(1);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("contato sem user_id é achado pelo e-mail do perfil", async () => {
    tabelas.whatsapp_contacts[0].user_id = null;
    const inativos = await buscarAlunosInativos(db());
    expect(inativos).toHaveLength(1);
    expect(inativos[0].userId).toBe("u1");
  });
});

describe("descanso entre lembretes", () => {
  it("não repete para quem recebeu há 5 dias", async () => {
    tabelas.whatsapp_messages.push({
      id: 50,
      contact_id: 1,
      message_type: "inactivity_nudge",
      status: "sent",
      created_at: diasAtras(5),
    } as Linha);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("volta a valer depois do intervalo", async () => {
    tabelas.whatsapp_messages.push({
      id: 50,
      contact_id: 1,
      message_type: "inactivity_nudge",
      status: "sent",
      created_at: diasAtras(20),
    } as Linha);
    expect(await buscarAlunosInativos(db())).toHaveLength(1);
  });

  it("lembrete ainda agendado também segura o próximo", async () => {
    tabelas.whatsapp_messages.push({
      id: 50,
      contact_id: 1,
      message_type: "inactivity_nudge",
      status: "scheduled",
      created_at: diasAtras(1),
    } as Linha);
    expect(await buscarAlunosInativos(db())).toHaveLength(0);
  });

  it("mensagem de outro tipo não conta como lembrete", async () => {
    tabelas.whatsapp_messages.push({
      id: 50,
      contact_id: 1,
      message_type: "cart_recovery_1",
      status: "sent",
      created_at: diasAtras(1),
    } as Linha);
    expect(await buscarAlunosInativos(db())).toHaveLength(1);
  });
});

describe("agendamento", () => {
  it("agenda um lembrete e o mesmo dia não gera outro", async () => {
    const primeiro = await agendarLembretesInatividade(db());
    expect(primeiro).toMatchObject({ candidatos: 1, agendadas: 1 });
    expect(tabelas.whatsapp_messages).toHaveLength(1);
    expect(tabelas.whatsapp_messages[0].message_type).toBe("inactivity_nudge");

    // Segunda rodada no mesmo dia: o descanso já barra antes de tentar.
    const segundo = await agendarLembretesInatividade(db());
    expect(segundo.agendadas).toBe(0);
    expect(tabelas.whatsapp_messages).toHaveLength(1);
  });

  it("desligada, não agenda nada", async () => {
    process.env.WHATSAPP_INACTIVITY_ENABLED = "false";
    const r = await agendarLembretesInatividade(db());
    process.env.WHATSAPP_INACTIVITY_ENABLED = "true";
    expect(r.agendadas).toBe(0);
    expect(tabelas.whatsapp_messages).toHaveLength(0);
  });

  it("respeita o teto por rodada", async () => {
    process.env.WHATSAPP_INACTIVITY_BATCH = "2";
    for (const n of [2, 3, 4]) {
      tabelas.whatsapp_contacts.push({
        ...CONTATO,
        id: n,
        phone: `551598830052${n}`,
        user_id: `u${n}`,
        email: `aluno${n}@exemplo.com`,
      } as unknown as Linha);
      tabelas.users_profile.push({
        id: n,
        user_id: `u${n}`,
        email: `aluno${n}@exemplo.com`,
        last_seen_at: diasAtras(5 + n),
      } as Linha);
      tabelas.user_entitlements.push({ id: n, user_id: `u${n}`, entitlement: "base", expires_at: null } as Linha);
    }

    const r = await agendarLembretesInatividade(db());
    delete process.env.WHATSAPP_INACTIVITY_BATCH;

    expect(r.candidatos).toBe(4);
    expect(r.agendadas).toBe(2);
    // Corta quem está parado há menos tempo: esse volta a caber amanhã.
    expect(tabelas.whatsapp_messages.map((m) => m.contact_id)).toEqual([4, 3]);
  });
});

describe("reconferência no instante do envio", () => {
  const mensagem = {
    id: 1,
    dedupe_key: "1:sem-origem:inactivity_nudge:2026-08-10",
    message_type: "inactivity_nudge" as const,
    contact_id: 1,
    cart_id: null,
    subscription_id: null,
    plan: null,
    body: "oi",
    scheduled_for: diasAtras(0),
    status: "processing",
    attempts: 1,
  };

  it("quem voltou a acessar depois do agendamento não recebe", async () => {
    tabelas.users_profile[0].last_seen_at = new Date().toISOString();
    expect(await conferirAntesDeEnviar(db(), mensagem)).toEqual({
      enviar: false,
      motivo: "aluno voltou a acessar",
    });
  });

  it("quem continua parado recebe", async () => {
    expect(await conferirAntesDeEnviar(db(), mensagem)).toEqual({ enviar: true });
  });

  it("quem perdeu o acesso no meio do caminho não recebe", async () => {
    tabelas.user_entitlements[0].expires_at = diasAtras(1);
    expect(await conferirAntesDeEnviar(db(), mensagem)).toEqual({ enviar: false, motivo: "acesso expirado" });
  });

  it("continuaInativo exige um aluno do outro lado do telefone", async () => {
    expect(await continuaInativo(db(), { user_id: null, email: null })).toEqual({
      enviar: false,
      motivo: "contato não está ligado a nenhum aluno",
    });
  });
});

describe("texto", () => {
  const texto = () => textoInatividade({ nome: "Maria Silva" });

  it("chama pelo primeiro nome e identifica o MPO", () => {
    expect(texto()).toContain("Olá, Maria!");
    expect(texto()).toContain("Manual Prático do Outfit");
  });

  it("não tem emoji", () => {
    expect(texto()).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("leva para o app, não para checkout — quem recebe já é aluno", () => {
    expect(texto()).toContain("https://www.manualpraticodooutfit.com.br/dashboard");
    expect(texto()).not.toContain("pay.cakto.com.br");
    expect(texto()).not.toMatch(/R\$|assine|renove/i);
  });

  it("oferece a saída na própria mensagem", () => {
    expect(texto()).toContain('responda "PARAR"');
  });
});
