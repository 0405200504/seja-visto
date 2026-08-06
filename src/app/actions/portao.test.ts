import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes do portão de pré-lançamento.
 *
 * O que importa aqui é o par de garantias que sustenta o lançamento: senha
 * errada não passa de jeito nenhum, e a senha certa grava um cookie que o
 * middleware aceita — o mesmo cookie, calculado pela mesma função.
 */

const cookiesGravados: Array<{ nome: string; valor: string; opcoes: Record<string, unknown> }> = [];

vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (nome: string, valor: string, opcoes: Record<string, unknown>) => {
      cookiesGravados.push({ nome, valor, opcoes });
    },
  }),
}));

import { abrirPortao } from "./portao";
import {
  COOKIE_PORTAO,
  VENDAS_ABREM_EM,
  VENDAS_SENHA,
  assinaturaDoPortao,
  assinaturasIguais,
  vendasAbertas,
} from "@/lib/lancamento";

function form(senha: string): FormData {
  const fd = new FormData();
  fd.set("senha", senha);
  return fd;
}

beforeEach(() => {
  cookiesGravados.length = 0;
});

describe("portão de pré-lançamento", () => {
  it("recusa senha errada sem gravar cookie", async () => {
    const r = await abrirPortao({}, form("chutando"));
    expect(r.error).toMatch(/incorreta/i);
    expect(cookiesGravados).toHaveLength(0);
  });

  it("recusa campo vazio", async () => {
    const r = await abrirPortao({}, form("   "));
    expect(r.error).toMatch(/digite/i);
    expect(cookiesGravados).toHaveLength(0);
  });

  it("aceita a senha certa, grava o cookie e manda para a página de vendas", async () => {
    await expect(abrirPortao({}, form(VENDAS_SENHA))).rejects.toThrow("NEXT_REDIRECT:/");

    expect(cookiesGravados).toHaveLength(1);
    const [cookie] = cookiesGravados;
    expect(cookie.nome).toBe(COOKIE_PORTAO);
    // O cookie guarda o hash, nunca a senha em texto puro.
    expect(cookie.valor).not.toContain(VENDAS_SENHA);
    expect(cookie.valor).toBe(await assinaturaDoPortao());
    expect(cookie.opcoes.httpOnly).toBe(true);
  });

  it("ignora espaços em volta da senha (colar do WhatsApp costuma trazer)", async () => {
    await expect(abrirPortao({}, form(`  ${VENDAS_SENHA}  `))).rejects.toThrow("NEXT_REDIRECT:/");
    expect(cookiesGravados).toHaveLength(1);
  });
});

describe("data de abertura", () => {
  it("fica fechado antes da data e abre sozinho depois", () => {
    const abertura = new Date(VENDAS_ABREM_EM).getTime();
    expect(Number.isNaN(abertura)).toBe(false); // data escrita errada trava tudo fechado
    expect(vendasAbertas(new Date(abertura - 60_000))).toBe(false);
    expect(vendasAbertas(new Date(abertura))).toBe(true);
    expect(vendasAbertas(new Date(abertura + 86_400_000))).toBe(true);
  });
});

describe("comparação de assinaturas", () => {
  it("só aceita duas assinaturas idênticas", async () => {
    const certa = await assinaturaDoPortao();
    expect(assinaturasIguais(certa, certa)).toBe(true);
    expect(assinaturasIguais(certa, await assinaturaDoPortao("outra"))).toBe(false);
    expect(assinaturasIguais(certa, "")).toBe(false);
    expect(assinaturasIguais(certa, certa.slice(0, -1) + "0")).toBe(false);
  });
});
