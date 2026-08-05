import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes da tela que faltava: definir a senha pelo link do e-mail.
 *
 * Cobrem o caminho feliz (senha salva, link gasto, entra direto) e as três
 * formas de o link não servir — cada uma com uma mensagem que diz o que
 * fazer, em vez de devolver a pessoa para o login sem explicação.
 */

let estado: {
  verificacao: unknown;
  consumiu: boolean;
  erroUpdate: string | null;
  erroLogin: string | null;
  limites: Record<string, boolean>;
};

const chamadas = { update: 0, login: 0, invalidou: 0 };
let senhaSalva = "";

function reset() {
  estado = {
    verificacao: { ok: true, userId: "u1", email: "aluno@teste.com", finalidade: "acesso" },
    consumiu: true,
    erroUpdate: null,
    erroLogin: null,
    limites: {},
  };
  chamadas.update = 0;
  chamadas.login = 0;
  chamadas.invalidou = 0;
  senhaSalva = "";
}

vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async () => {
        chamadas.login++;
        return { error: estado.erroLogin ? { message: estado.erroLogin } : null };
      },
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        updateUserById: async (_id: string, dados: { password: string }) => {
          chamadas.update++;
          senhaSalva = dados.password;
          return { error: estado.erroUpdate ? { message: estado.erroUpdate } : null };
        },
      },
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checarRateLimit: async (bucket: string) => estado.limites[bucket.split(":")[0]] ?? true,
  ipDoServerAction: async () => "9.9.9.9",
}));

vi.mock("@/lib/links-acesso", async () => {
  const real = await vi.importActual<typeof import("@/lib/links-acesso")>("@/lib/links-acesso");
  return {
    ...real,
    verificarToken: async () => estado.verificacao,
    consumirToken: async () => estado.consumiu,
    invalidarLinksPendentes: async () => {
      chamadas.invalidou++;
    },
  };
});

vi.mock("server-only", () => ({}));

function form(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const VALIDA = { token: "t".repeat(40), password: "minhasenha1", confirmacao: "minhasenha1" };

beforeEach(() => {
  reset();
  vi.resetModules();
});

describe("definir senha pelo link", () => {
  it("salva a senha, gasta o link e já entra na plataforma", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");

    await expect(definirSenhaComToken({}, form(VALIDA))).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    );

    expect(chamadas.update).toBe(1);
    expect(senhaSalva).toBe("minhasenha1");
    expect(chamadas.login).toBe(1);
    // Os outros links que ficaram na caixa de entrada morrem junto.
    expect(chamadas.invalidou).toBe(1);
  });

  it("link vencido explica o que houve e NÃO troca senha nenhuma", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");
    estado.verificacao = { ok: false, motivo: "expirado", email: "aluno@teste.com" };

    const r = await definirSenhaComToken({}, form(VALIDA));

    expect(r.error).toMatch(/venceu/i);
    expect(r.error).toMatch(/Recuperar senha/);
    expect(chamadas.update).toBe(0);
  });

  it("link já usado é recusado mesmo se a conferência tinha acabado de passar", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");
    // O clique paralelo (ou o pré-carregador do e-mail) gastou o link
    // entre a conferência e o consumo.
    estado.consumiu = false;

    const r = await definirSenhaComToken({}, form(VALIDA));

    expect(r.error).toMatch(/já foi usado/i);
    expect(chamadas.update).toBe(0);
  });

  it("recusa senha fora da política antes de encostar no link", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");

    const curta = await definirSenhaComToken({}, form({ ...VALIDA, password: "abc1", confirmacao: "abc1" }));
    expect(curta.error).toMatch(/8 caracteres/);

    const soLetras = await definirSenhaComToken(
      {},
      form({ ...VALIDA, password: "senhasenha", confirmacao: "senhasenha" })
    );
    expect(soLetras.error).toMatch(/letra e um número/);

    expect(chamadas.update).toBe(0);
  });

  it("cobra a confirmação igual — erro de digitação não vira senha desconhecida", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");
    const r = await definirSenhaComToken({}, form({ ...VALIDA, confirmacao: "minhasenha2" }));

    expect(r.error).toMatch(/iguais/);
    expect(chamadas.update).toBe(0);
  });

  it("rate limit por IP barra a tentativa em série antes de tudo", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");
    estado.limites["definir-senha-ip"] = false;

    const r = await definirSenhaComToken({}, form(VALIDA));

    expect(r.error).toMatch(/Muitas tentativas/);
    expect(chamadas.update).toBe(0);
  });

  it("se o login automático falhar, a senha continua salva e a tela diz para entrar", async () => {
    const { definirSenhaComToken } = await import("./definir-senha");
    estado.erroLogin = "sessão indisponível";
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await definirSenhaComToken({}, form(VALIDA));

    expect(chamadas.update).toBe(1);
    expect(r.success).toMatch(/Senha criada/);
    expect(r.error).toBeUndefined();
    erro.mockRestore();
  });
});
