import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Cenários de negócio da fila.
 *
 * Cada teste aqui corresponde a um dos casos obrigatórios da especificação
 * — em especial os que causam dano real se falharem: cobrar quem já pagou,
 * mandar mensagem para quem pediu PARAR, e repetir para sempre um número
 * inválido.
 */

process.env.WHATSAPP_QUEUE_ENABLED = "true";
process.env.WHATSAPP_AUTOMATION_TEST_MODE = "false";

/* ---------- uazapi de mentira ---------- */
const enviados: { numero: string; texto: string }[] = [];
let respostaEnvio: { ok: boolean; categoria?: string; codigo?: number | null; motivo?: string; providerMessageId?: string };
let instanciaConectada = true;

vi.mock("./uazapi", () => ({
  enviarTexto: async (numero: string, texto: string) => {
    enviados.push({ numero, texto });
    return respostaEnvio.ok
      ? { ok: true, providerMessageId: "msg-" + enviados.length, codigo: 200 }
      : respostaEnvio;
  },
  statusInstancia: async () =>
    instanciaConectada
      ? { conectada: true, estado: "connected" }
      : { conectada: false, estado: "disconnected", motivo: "instância caiu" },
  logEnvio: () => {},
}));

const { agendarMensagem, cancelarPendentes, chaveMensagem, conferirAntesDeEnviar, processarFila, proximaTentativaMs } =
  await import("./fila");

/* ---------- banco de mentira ---------- */
type Linha = Record<string, unknown> & { id: number };
let tabelas: Record<string, Linha[]>;
let proximoId: number;

function construtor(nome: string) {
  const filtros: { col: string; op: string; val: unknown }[] = [];
  let acao: "select" | "insert" | "update" = "select";
  let patch: Record<string, unknown> = {};
  let novo: Linha | null = null;

  const casa = (l: Linha) =>
    filtros.every((f) => {
      const v = l[f.col];
      if (f.op === "eq") return v === f.val;
      if (f.op === "neq") return v !== f.val;
      if (f.op === "in") return (f.val as unknown[]).includes(v);
      if (f.op === "lt") return typeof v === "string" && v < (f.val as string);
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
    if (acao === "update") {
      const alvos = linhas.filter(casa);
      for (const l of alvos) Object.assign(l, patch);
      return { data: alvos.map((l) => ({ ...l })), error: null };
    }
    const achados = linhas.filter(casa);
    return { data: achados.map((l) => ({ ...l })), error: null };
  };

  const api = {
    insert(v: Record<string, unknown>) {
      acao = "insert";
      // Reproduz os DEFAULT das colunas da migração 00024.
      const padroes =
        nome === "whatsapp_messages"
          ? { attempts: 0, next_attempt_at: null, sent_at: null, error_message: null, skip_reason: null }
          : {};
      novo = { id: proximoId++, ...padroes, ...v } as Linha;
      return api;
    },
    update(v: Record<string, unknown>) {
      acao = "update";
      patch = v;
      return api;
    },
    select() {
      return api;
    },
    eq(col: string, val: unknown) {
      filtros.push({ col, op: "eq", val });
      return api;
    },
    neq(col: string, val: unknown) {
      filtros.push({ col, op: "neq", val });
      return api;
    },
    in(col: string, val: unknown[]) {
      filtros.push({ col, op: "in", val });
      return api;
    },
    lt(col: string, val: unknown) {
      filtros.push({ col, op: "lt", val });
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

function fakeDb() {
  return {
    from: (nome: string) => construtor(nome),
    // Reproduz a função do banco: pega o que está na hora, uma por contato.
    rpc: async (_fn: string, args: { p_limite: number }) => {
      const agora = new Date().toISOString();
      const vistos = new Set<number>();
      const prontas = (tabelas.whatsapp_messages ?? [])
        .filter(
          (m) =>
            (m.scheduled_for as string) <= agora &&
            (m.status === "scheduled" ||
              (m.status === "failed" && m.next_attempt_at !== null && (m.next_attempt_at as string) <= agora))
        )
        .sort((a, b) => String(a.scheduled_for).localeCompare(String(b.scheduled_for)))
        .filter((m) => {
          if (vistos.has(m.contact_id as number)) return false;
          vistos.add(m.contact_id as number);
          return true;
        })
        .slice(0, args.p_limite);
      for (const m of prontas) {
        m.status = "processing";
        m.attempts = (m.attempts as number) + 1;
      }
      return { data: prontas.map((m) => ({ ...m })), error: null };
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => fakeDb() as any;

const CONTATO = {
  id: 1,
  phone: "5515988300526",
  name: "Maria Silva",
  opted_out_at: null as string | null,
  consent_granted_at: "2026-07-01T00:00:00.000Z",
};

const ontem = () => new Date(Date.now() - 60_000);

beforeEach(() => {
  tabelas = {
    whatsapp_messages: [],
    whatsapp_contacts: [{ ...CONTATO } as unknown as Linha],
    whatsapp_carts: [{ id: 10, status: "aberto", expires_at: null } as unknown as Linha],
    subscriptions: [{ id: 20, status: "ativa", plan: "mensal" } as unknown as Linha],
  };
  proximoId = 100;
  enviados.length = 0;
  respostaEnvio = { ok: true };
  instanciaConectada = true;
});

describe("idempotência", () => {
  it("a mesma chave não entra duas vezes (webhook duplicado)", async () => {
    const base = { contato: CONTATO, tipo: "cart_recovery_1" as const, corpo: "oi", quando: ontem(), cartId: 10 };
    const a = await agendarMensagem(db(), base);
    const b = await agendarMensagem(db(), base);
    expect(a.agendada).toBe(true);
    expect(b).toEqual({ agendada: false, motivo: "já agendada (chave repetida)" });
    expect(tabelas.whatsapp_messages).toHaveLength(1);
  });

  it("a chave inclui contato, origem, tipo e dia", () => {
    const quando = new Date("2026-08-06T15:00:00Z");
    expect(chaveMensagem({ contactId: 7, cartId: 3, tipo: "cart_recovery_2", quando })).toBe(
      "7:cart:3:cart_recovery_2:2026-08-06"
    );
    expect(chaveMensagem({ contactId: 7, subscriptionId: 9, tipo: "monthly_payment_failed", quando })).toBe(
      "7:sub:9:monthly_payment_failed:2026-08-06"
    );
  });
});

describe("consentimento e opt-out", () => {
  it("não agenda para quem pediu PARAR", async () => {
    const r = await agendarMensagem(db(), {
      contato: { ...CONTATO, opted_out_at: "2026-07-20T00:00:00.000Z" },
      tipo: "cart_recovery_1",
      corpo: "oi",
      quando: ontem(),
      cartId: 10,
    });
    expect(r).toEqual({ agendada: false, motivo: "contato pediu para parar" });
  });

  it("não agenda sem consentimento registrado", async () => {
    const r = await agendarMensagem(db(), {
      contato: { ...CONTATO, consent_granted_at: null },
      tipo: "cart_recovery_1",
      corpo: "oi",
      quando: ontem(),
      cartId: 10,
    });
    expect(r).toEqual({ agendada: false, motivo: "sem consentimento registrado" });
  });

  it("opt-out DEPOIS do agendamento ainda barra o envio", async () => {
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });
    tabelas.whatsapp_contacts[0].opted_out_at = new Date().toISOString();

    const resumo = await processarFila(db());
    expect(enviados).toHaveLength(0);
    expect(resumo.ignoradas).toBe(1);
    expect(tabelas.whatsapp_messages[0].skip_reason).toMatch(/parar/);
  });
});

describe("pagamento antes da mensagem", () => {
  it("carrinho pago entre o agendamento e o envio não recebe cobrança", async () => {
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_2", corpo: "oi", quando: ontem(), cartId: 10 });
    tabelas.whatsapp_carts[0].status = "pago";

    const resumo = await processarFila(db());
    expect(enviados).toHaveLength(0);
    expect(resumo.ignoradas).toBe(1);
    expect(tabelas.whatsapp_messages[0].skip_reason).toMatch(/pago/);
  });

  it("PIX ainda no prazo não é abandono", async () => {
    tabelas.whatsapp_carts[0].expires_at = new Date(Date.now() + 20 * 60_000).toISOString();
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });

    const resumo = await processarFila(db());
    expect(enviados).toHaveLength(0);
    expect(tabelas.whatsapp_messages[0].skip_reason).toMatch(/prazo/);
    expect(resumo.ignoradas).toBe(1);
  });

  it("pagamento aprovado cancela toda a sequência pendente", async () => {
    for (const tipo of ["cart_recovery_1", "cart_recovery_2", "cart_recovery_3"] as const) {
      await agendarMensagem(db(), { contato: CONTATO, tipo, corpo: "oi", quando: new Date(Date.now() + 86400000), cartId: 10 });
    }
    const n = await cancelarPendentes(db(), { cartId: 10 }, "compra aprovada");
    expect(n).toBe(3);
    expect(tabelas.whatsapp_messages.every((m) => m.status === "cancelled")).toBe(true);
  });
});

describe("estado da assinatura", () => {
  it("não diz 'acesso suspenso' para quem está com a assinatura ativa", async () => {
    await agendarMensagem(db(), {
      contato: CONTATO,
      tipo: "monthly_access_suspended",
      corpo: "suspenso",
      quando: ontem(),
      subscriptionId: 20,
      plano: "mensal",
    });
    const veredito = await conferirAntesDeEnviar(db(), tabelas.whatsapp_messages[0] as never);
    expect(veredito).toEqual({ enviar: false, motivo: 'assinatura está "ativa", mensagem não faz mais sentido' });
  });

  it("assinatura cancelada barra qualquer mensagem", async () => {
    tabelas.subscriptions[0].status = "cancelada";
    await agendarMensagem(db(), {
      contato: CONTATO,
      tipo: "monthly_payment_failed",
      corpo: "x",
      quando: ontem(),
      subscriptionId: 20,
      plano: "mensal",
    });
    const veredito = await conferirAntesDeEnviar(db(), tabelas.whatsapp_messages[0] as never);
    expect(veredito).toEqual({ enviar: false, motivo: "assinatura cancelada" });
  });

  it("plano trocado invalida a mensagem antiga", async () => {
    tabelas.subscriptions[0].plan = "anual";
    await agendarMensagem(db(), {
      contato: CONTATO,
      tipo: "monthly_renewal_reminder",
      corpo: "x",
      quando: ontem(),
      subscriptionId: 20,
      plano: "mensal",
    });
    const veredito = await conferirAntesDeEnviar(db(), tabelas.whatsapp_messages[0] as never);
    expect(veredito).toEqual({ enviar: false, motivo: "plano mudou de mensal para anual" });
  });
});

describe("envio e falhas", () => {
  it("envia e registra o id devolvido pela uazapi", async () => {
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });
    const resumo = await processarFila(db());

    expect(resumo.enviadas).toBe(1);
    expect(enviados[0]).toEqual({ numero: "5515988300526", texto: "oi" });
    expect(tabelas.whatsapp_messages[0]).toMatchObject({ status: "sent", provider_message_id: "msg-1", response_code: 200 });
  });

  it("falha temporária agenda nova tentativa", async () => {
    respostaEnvio = { ok: false, categoria: "temporario", codigo: 503, motivo: "uazapi fora do ar" };
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });
    await processarFila(db());

    const m = tabelas.whatsapp_messages[0];
    expect(m.status).toBe("failed");
    expect(m.error_category).toBe("temporario");
    expect(m.next_attempt_at).not.toBeNull();
  });

  it("falha permanente NÃO repete (número inválido, credencial)", async () => {
    respostaEnvio = { ok: false, categoria: "permanente", codigo: 401, motivo: "credencial inválida" };
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });
    await processarFila(db());
    expect(tabelas.whatsapp_messages[0].next_attempt_at).toBeNull();

    // Segunda rodada não deve repescar.
    enviados.length = 0;
    await processarFila(db());
    expect(enviados).toHaveLength(0);
  });

  it("para de tentar depois do limite de tentativas", async () => {
    respostaEnvio = { ok: false, categoria: "temporario", codigo: 500, motivo: "erro" };
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });

    /* Cada volta simula o tempo passando até a próxima tentativa — sem
     * forçar de volta uma mensagem que o sistema já desistiu de mandar. */
    for (let i = 0; i < 5; i++) {
      const m = tabelas.whatsapp_messages[0];
      if (m.next_attempt_at) m.next_attempt_at = ontem().toISOString();
      await processarFila(db());
    }

    const m = tabelas.whatsapp_messages[0];
    expect(m.next_attempt_at).toBeNull();
    // 3 tentativas (WHATSAPP_MAX_RETRIES) e para — não fica repetindo.
    expect(m.attempts).toBe(3);
    expect(enviados).toHaveLength(3);
  });

  it("espera cresce a cada tentativa: 30s, 2min, 10min", () => {
    expect(proximaTentativaMs(1, 30_000)).toBe(30_000);
    expect(proximaTentativaMs(2, 30_000)).toBe(120_000);
    expect(proximaTentativaMs(3, 30_000)).toBe(600_000);
  });

  it("instância desconectada para a rodada sem consumir tentativa", async () => {
    instanciaConectada = false;
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "oi", quando: ontem(), cartId: 10 });

    const resumo = await processarFila(db());
    expect(resumo.parouPor).toMatch(/disconnected/);
    expect(enviados).toHaveLength(0);
    expect(tabelas.whatsapp_messages[0].status).toBe("scheduled");
    expect(tabelas.whatsapp_messages[0].attempts).toBe(0);
  });
});

describe("ritmo", () => {
  it("manda no máximo uma mensagem por contato em cada rodada", async () => {
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_1", corpo: "1", quando: ontem(), cartId: 10 });
    await agendarMensagem(db(), { contato: CONTATO, tipo: "cart_recovery_2", corpo: "2", quando: ontem(), cartId: 10 });

    await processarFila(db());
    expect(enviados).toHaveLength(1);
  });
});
