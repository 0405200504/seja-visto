import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes dos fluxos de autenticação: enumeração de usuário e rate limit.
 *
 * Nada aqui toca a internet nem o Supabase real — nenhum teste de força
 * bruta é executado contra produção.
 */

let estado: {
  erroSignUp: string | null;
  erroSignIn: string | null;
  erroReset: string | null;
  limites: Record<string, boolean>;
};

const chamadas = { signUp: 0, signIn: 0, reset: 0 };

function reset() {
  estado = { erroSignUp: null, erroSignIn: null, erroReset: null, limites: {} };
  chamadas.signUp = 0;
  chamadas.signIn = 0;
  chamadas.reset = 0;
}

vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async () => {
        chamadas.signIn++;
        return { error: estado.erroSignIn ? { message: estado.erroSignIn } : null };
      },
      signUp: async () => {
        chamadas.signUp++;
        return {
          data: { session: null },
          error: estado.erroSignUp ? { message: estado.erroSignUp } : null,
        };
      },
      resetPasswordForEmail: async () => {
        chamadas.reset++;
        return { error: estado.erroReset ? { message: estado.erroReset } : null };
      },
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checarRateLimit: async (bucket: string) => {
    const prefixo = bucket.split(":")[0];
    return estado.limites[prefixo] ?? true;
  },
  ipDoServerAction: async () => "9.9.9.9",
}));

function form(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  reset();
  vi.resetModules();
});

describe("enumeração de usuário", () => {
  it("cadastro com e-mail JÁ EXISTENTE devolve resposta idêntica a e-mail novo", async () => {
    const { signUp } = await import("./auth");
    const dados = { name: "Fulano", email: "novo@teste.com", password: "senha1234" };

    // caso 1: e-mail livre
    const novo = await signUp({}, form(dados));

    // caso 2: e-mail já cadastrado
    estado.erroSignUp = "User already registered";
    const existente = await signUp({}, form({ ...dados, email: "cliente@teste.com" }));

    // Byte a byte: nada na resposta distingue os dois casos.
    expect(JSON.stringify(existente)).toBe(JSON.stringify(novo));
    expect(existente.error).toBeUndefined();
  });

  it("login com e-mail inexistente e com senha errada devolvem a MESMA string", async () => {
    const { signIn } = await import("./auth");

    estado.erroSignIn = "Invalid login credentials";
    const senhaErrada = await signIn({}, form({ email: "cliente@teste.com", password: "errada1" }));

    estado.erroSignIn = "Email not confirmed";
    const naoConfirmado = await signIn({}, form({ email: "x@teste.com", password: "errada1" }));

    expect(senhaErrada.error).toBe(naoConfirmado.error);
    expect(senhaErrada.error).toBe("E-mail ou senha incorretos. Verifique e tente novamente.");
  });

  it("reset de senha não revela se o e-mail existe, nem quando o envio falha", async () => {
    const { resetPassword } = await import("./auth");

    const ok = await resetPassword({}, form({ email: "existe@teste.com" }));
    estado.erroReset = "User not found";
    const inexistente = await resetPassword({}, form({ email: "naoexiste@teste.com" }));

    expect(JSON.stringify(inexistente)).toBe(JSON.stringify(ok));
    expect(inexistente.error).toBeUndefined();
  });
});

describe("rate limit dos fluxos de autenticação", () => {
  it("login estourado por IP é barrado ANTES de tentar a senha", async () => {
    const { signIn } = await import("./auth");
    estado.limites["login-ip"] = false;

    const r = await signIn({}, form({ email: "a@teste.com", password: "senha1234" }));
    expect(r.error).toMatch(/Muitas tentativas de login/);
    // O ponto: nem chegou a consultar o Supabase.
    expect(chamadas.signIn).toBe(0);
  });

  it("cadastro estourado por IP é barrado (credential stuffing troca o e-mail, não o IP)", async () => {
    const { signUp } = await import("./auth");
    estado.limites["signup-ip"] = false;

    const r = await signUp({}, form({ name: "X", email: "novo@teste.com", password: "senha1234" }));
    expect(r.error).toMatch(/Muitas tentativas de cadastro/);
    expect(chamadas.signUp).toBe(0);
  });

  it("segundo reset seguido para o mesmo e-mail é bloqueado, mas responde como sucesso", async () => {
    const { resetPassword } = await import("./auth");
    estado.limites["reset"] = false;

    const r = await resetPassword({}, form({ email: "cliente@teste.com" }));
    // Nenhum e-mail foi disparado...
    expect(chamadas.reset).toBe(0);
    // ...e ainda assim a resposta é de sucesso, para não virar oráculo.
    expect(r.success).toBe("Enviamos um link de recuperação para o seu e-mail.");
    expect(r.error).toBeUndefined();
  });
});

describe("política de senha", () => {
  it.each([
    ["curta", "abc1"],
    ["só letras", "senhasenha"],
    ["só números", "12345678"],
    ["campeã de vazamento", "senha123"],
  ])("recusa senha %s", async (_rotulo, senha) => {
    const { signUp } = await import("./auth");
    const r = await signUp({}, form({ name: "X", email: "a@teste.com", password: senha }));
    expect(r.error).toBeTruthy();
    expect(chamadas.signUp).toBe(0);
  });
});
