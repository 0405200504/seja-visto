import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  REMETENTE_EMAIL,
  cabecalhoDe,
  configSmtp,
  diagnosticoRemetente,
  dominioDe,
  parseRemetente,
  remetente,
  replyTo,
} from "./config";

/**
 * Regras de remetente. O que estes testes protegem, na prática: nenhuma
 * mudança futura de variável de ambiente pode fazer o e-mail do MPO voltar
 * a sair de um endereço pessoal.
 */

const AMBIENTE = { ...process.env };

function limpar() {
  for (const k of [
    "EMAIL_FROM",
    "EMAIL_REPLY_TO",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_SECURE",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
    "RESEND_API_KEY",
  ]) {
    delete process.env[k];
  }
}

beforeEach(limpar);
afterEach(() => {
  limpar();
  Object.assign(process.env, AMBIENTE);
});

describe("remetente", () => {
  it("usa o endereço do domínio quando EMAIL_FROM não está configurado", () => {
    expect(remetente().email).toBe(REMETENTE_EMAIL);
    expect(replyTo()).toBe(REMETENTE_EMAIL);
  });

  it("aceita EMAIL_FROM de um domínio profissional", () => {
    process.env.EMAIL_FROM = "MPO | Manual Prático do Outfit <contato@manualpraticodooutfit.com.br>";
    expect(remetente()).toEqual({
      nome: "MPO | Manual Prático do Outfit",
      email: "contato@manualpraticodooutfit.com.br",
    });
  });

  it("IGNORA EMAIL_FROM apontando para e-mail pessoal", () => {
    process.env.EMAIL_FROM = "Equipe <equiperaphaelpereira@gmail.com>";
    expect(remetente().email).toBe(REMETENTE_EMAIL);
  });

  it("IGNORA EMAIL_REPLY_TO pessoal", () => {
    process.env.EMAIL_REPLY_TO = "equiperaphaelpereira@gmail.com";
    expect(replyTo()).toBe(REMETENTE_EMAIL);
  });

  it("codifica o nome com acento no cabeçalho De:", () => {
    const cab = cabecalhoDe({ nome: "MPO | Manual Prático do Outfit", email: "suporte@x.com.br" });
    expect(cab).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <suporte@x\.com\.br>$/);
    const b64 = /=\?UTF-8\?B\?([^?]+)\?=/.exec(cab)![1];
    expect(Buffer.from(b64, "base64").toString("utf8")).toBe("MPO | Manual Prático do Outfit");
  });

  it("mantém nome ASCII entre aspas", () => {
    expect(cabecalhoDe({ nome: "MPO | Suporte", email: "a@b.com" })).toBe('"MPO | Suporte" <a@b.com>');
  });

  it("entende as duas formas de escrita do remetente", () => {
    expect(parseRemetente("a@b.com")?.email).toBe("a@b.com");
    expect(parseRemetente('"Nome" <a@b.com>')?.nome).toBe("Nome");
    expect(parseRemetente("texto sem e-mail")).toBeNull();
    expect(parseRemetente(undefined)).toBeNull();
  });

  it("extrai o domínio", () => {
    expect(dominioDe("Suporte@Manualpraticodooutfit.COM.BR")).toBe("manualpraticodooutfit.com.br");
  });
});

describe("configSmtp", () => {
  it("lê as variáveis genéricas SMTP_*", () => {
    process.env.SMTP_HOST = "smtp.zoho.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "suporte@manualpraticodooutfit.com.br";
    process.env.SMTP_PASSWORD = "abcd efgh ijkl mnop";
    process.env.SMTP_SECURE = "false";

    expect(configSmtp()).toEqual({
      host: "smtp.zoho.com",
      port: 587,
      secure: false,
      user: "suporte@manualpraticodooutfit.com.br",
      senha: "abcdefghijklmnop", // espaços da senha de app são removidos
    });
  });

  it("mantém o par legado GMAIL_USER/GMAIL_APP_PASSWORD funcionando", () => {
    process.env.GMAIL_USER = "suporte@manualpraticodooutfit.com.br";
    process.env.GMAIL_APP_PASSWORD = "senha-de-app";
    expect(configSmtp()).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true });
  });

  it("devolve null sem credencial", () => {
    process.env.SMTP_HOST = "smtp.zoho.com";
    expect(configSmtp()).toBeNull();
  });
});

describe("diagnosticoRemetente", () => {
  it("aprova SMTP do mesmo domínio do remetente", () => {
    process.env.SMTP_HOST = "smtp.zoho.com";
    process.env.SMTP_USER = "suporte@manualpraticodooutfit.com.br";
    process.env.SMTP_PASSWORD = "x";
    expect(diagnosticoRemetente()).toMatchObject({ pronto: true, via: "smtp" });
  });

  it("bloqueia Gmail pessoal assinando como o domínio, sem reserva", () => {
    process.env.GMAIL_USER = "equiperaphaelpereira@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "x";
    const d = diagnosticoRemetente();
    expect(d.pronto).toBe(false);
    expect(d.detalhe).toMatch(/não é do domínio/);
  });

  it("cai para o Resend quando o SMTP é de outro domínio", () => {
    process.env.GMAIL_USER = "equiperaphaelpereira@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "x";
    process.env.RESEND_API_KEY = "re_teste";
    expect(diagnosticoRemetente()).toMatchObject({ pronto: true, via: "resend" });
  });

  it("avisa quando não há nenhum meio de envio", () => {
    expect(diagnosticoRemetente()).toMatchObject({ pronto: false, via: null });
  });
});
