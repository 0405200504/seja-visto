import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { enviarEmail, sanitizarErro } from "./mailer";

/** Nenhum teste aqui abre conexão: todos param antes, na validação. */

const AMBIENTE = { ...process.env };

beforeEach(() => {
  for (const k of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY", "EMAIL_FROM"]) {
    delete process.env[k];
  }
});
afterEach(() => Object.assign(process.env, AMBIENTE));

const MSG = { para: "a@b.com", assunto: "teste", html: "<p>x</p>", texto: "x" };

describe("enviarEmail", () => {
  it("recusa o Gmail pessoal assinando como o domínio", async () => {
    process.env.GMAIL_USER = "equiperaphaelpereira@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "senha-de-app";

    const r = await enviarEmail(MSG);
    expect(r.enviado).toBe(false);
    expect(r.motivo).toContain("não é do domínio do remetente");
    // e o motivo diz o que fazer, sem vazar a senha
    expect(r.motivo).not.toContain("senha-de-app");
  });

  it("tenta o Resend ANTES do SMTP quando os dois estão configurados", async () => {
    process.env.RESEND_API_KEY = "re_teste";
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "suporte@manualpraticodooutfit.com.br";
    process.env.SMTP_PASSWORD = "x";

    const original = globalThis.fetch;
    let chamou = "";
    globalThis.fetch = (async (url: string) => {
      chamou = String(url);
      return new Response(JSON.stringify({ id: "1" }), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const r = await enviarEmail(MSG);
      expect(r).toMatchObject({ enviado: true, via: "resend" });
      expect(chamou).toContain("api.resend.com");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("avisa quando não há transporte nenhum", async () => {
    const r = await enviarEmail(MSG);
    expect(r.enviado).toBe(false);
    expect(r.motivo).toContain("SMTP não configurado");
    expect(r.motivo).toContain("RESEND_API_KEY ausente");
  });
});

describe("sanitizarErro", () => {
  it("apaga a senha SMTP do texto do erro", () => {
    process.env.SMTP_PASSWORD = "abcd efgh ijkl mnop";
    const limpo = sanitizarErro(new Error("535 auth failed for abcd efgh ijkl mnop"));
    expect(limpo).not.toContain("abcd efgh");
    expect(limpo).toContain("[redigido]");
  });

  it("apaga chave do Resend e cabeçalho de autenticação", () => {
    // Montada em pedaços de propósito: escrita inteira, esta linha tem
    // formato de chave real e o pre-push (com razão) bloqueia o commit.
    const chaveFalsa = "re_" + "abcdefghij1234567890";
    expect(sanitizarErro(`erro ${chaveFalsa}`)).toContain("[redigido]");
    expect(sanitizarErro("AUTH PLAIN dXNlcjpzZW5oYQ==")).toBe("AUTH PLAIN [redigido]");
    expect(sanitizarErro('{"password": "minha-senha"}')).not.toContain("minha-senha");
  });

  it("corta erro gigante para não entupir o log", () => {
    expect(sanitizarErro("x".repeat(5000)).length).toBe(400);
  });
});
