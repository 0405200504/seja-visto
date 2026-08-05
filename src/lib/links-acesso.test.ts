import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes do link de definir senha.
 *
 * O que está sendo protegido aqui é o que quebrou na vida real: link que
 * vence antes da pessoa abrir o e-mail, e link que "some" quando o token
 * não é aceito. Nada toca o Supabase real.
 */

vi.mock("server-only", () => ({}));

type Resultado = { data?: unknown; error?: { message: string } | null };

/** Construtor de consulta falso: encadeia qualquer coisa e devolve `resultado`. */
function consulta(resultado: Resultado) {
  const alvo: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "is", "gte", "ilike", "update", "insert", "delete", "limit", "order"]) {
    alvo[metodo] = () => alvo;
  }
  alvo.maybeSingle = async () => resultado;
  alvo.single = async () => resultado;
  alvo.then = (ok: (v: Resultado) => unknown, falha: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(ok, falha);
  return alvo;
}

function bancoFalso(resultado: Resultado, linkSupabase?: string | null) {
  return {
    from: () => consulta(resultado),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      admin: {
        generateLink: async () => ({
          data: linkSupabase ? { properties: { action_link: linkSupabase } } : null,
          error: null,
        }),
      },
    },
  } as never;
}

const DAQUI_A_UM_MES = () => new Date(Date.now() + 30 * 864e5).toISOString();
const ONTEM = () => new Date(Date.now() - 864e5).toISOString();

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.manualpraticodooutfit.com.br";
});

describe("token do link", () => {
  it("nunca é guardado em claro — no banco vai o hash", async () => {
    const { hashToken } = await import("./links-acesso");
    const token = "abc123abc123abc123abc123";
    const hash = hashToken(token);

    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64); // sha-256 em hexadecimal
    expect(hashToken(token)).toBe(hash); // determinístico, senão nada valida
    expect(hashToken(token + "x")).not.toBe(hash);
  });
});

describe("geração do link", () => {
  it("vale 30 dias no e-mail de acesso — o problema que originou tudo isto", async () => {
    const { gerarLinkDeSenha } = await import("./links-acesso");

    const link = await gerarLinkDeSenha(bancoFalso({ error: null }), {
      userId: "u1",
      email: "aluno@teste.com",
      finalidade: "acesso",
    });

    expect(link?.proprio).toBe(true);
    expect(link?.url).toMatch(
      /^https:\/\/www\.manualpraticodooutfit\.com\.br\/definir-senha\/[A-Za-z0-9_-]{40,}$/
    );

    const dias = (link!.expiraEm.getTime() - Date.now()) / 864e5;
    expect(dias).toBeGreaterThan(29.9);
    expect(dias).toBeLessThan(30.1);
  });

  it("dois links seguidos nunca são iguais", async () => {
    const { gerarLinkDeSenha } = await import("./links-acesso");
    const db = bancoFalso({ error: null });
    const a = await gerarLinkDeSenha(db, { userId: "u1", email: "a@b.com", finalidade: "acesso" });
    const b = await gerarLinkDeSenha(db, { userId: "u1", email: "a@b.com", finalidade: "acesso" });
    expect(a?.url).not.toBe(b?.url);
  });

  it("com a tabela ausente, cai no link do Supabase em vez de deixar sem e-mail", async () => {
    const { gerarLinkDeSenha } = await import("./links-acesso");
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    const link = await gerarLinkDeSenha(
      bancoFalso({ error: { message: 'relation "access_links" does not exist' } }, "https://x.supabase.co/auth/v1/verify?token=t"),
      { userId: "u1", email: "aluno@teste.com", finalidade: "acesso" }
    );

    expect(link?.proprio).toBe(false);
    expect(link?.url).toContain("supabase.co");
    erro.mockRestore();
  });
});

describe("conferência do token", () => {
  it("aceita o token válido e diz de quem é", async () => {
    const { verificarToken } = await import("./links-acesso");
    const r = await verificarToken(
      bancoFalso({
        data: {
          user_id: "u1",
          email: "aluno@teste.com",
          finalidade: "acesso",
          expira_em: DAQUI_A_UM_MES(),
          usado_em: null,
        },
        error: null,
      }),
      "token-de-tamanho-suficiente-para-passar"
    );

    expect(r).toEqual({ ok: true, userId: "u1", email: "aluno@teste.com", finalidade: "acesso" });
  });

  it.each([
    ["vencido", { expira_em: ONTEM(), usado_em: null }, "expirado"],
    ["já usado", { expira_em: DAQUI_A_UM_MES(), usado_em: ONTEM() }, "usado"],
  ])("recusa token %s com o motivo certo", async (_rotulo, extra, motivo) => {
    const { verificarToken } = await import("./links-acesso");
    const r = await verificarToken(
      bancoFalso({
        data: { user_id: "u1", email: "aluno@teste.com", finalidade: "acesso", ...extra },
        error: null,
      }),
      "token-de-tamanho-suficiente-para-passar"
    );

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe(motivo);
      // O e-mail volta para a tela já preencher o campo de "quero outro link".
      expect(r.email).toBe("aluno@teste.com");
    }
  });

  it("token inexistente e token curto demais nem chegam ao banco como válidos", async () => {
    const { verificarToken } = await import("./links-acesso");
    const db = bancoFalso({ data: null, error: null });

    expect(await verificarToken(db, "token-de-tamanho-suficiente-para-passar")).toEqual({
      ok: false,
      motivo: "invalido",
    });
    expect(await verificarToken(db, "curto")).toEqual({ ok: false, motivo: "invalido" });
    expect(await verificarToken(db, "")).toEqual({ ok: false, motivo: "invalido" });
  });
});

describe("consumo do token", () => {
  it("quem chega primeiro leva; o segundo clique não passa", async () => {
    const { consumirToken } = await import("./links-acesso");

    // O UPDATE condicional atingiu uma linha: era um link vivo.
    expect(await consumirToken(bancoFalso({ data: [{ id: 1 }], error: null }), "t")).toBe(true);
    // Nenhuma linha: alguém já tinha usado (ou o link venceu no meio).
    expect(await consumirToken(bancoFalso({ data: [], error: null }), "t")).toBe(false);
  });
});
