import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { baseDoSite, urlDoSite, SITE_CANONICO } from "./site-url";

/**
 * O teste que faltava quando um link de acesso saiu apontando para
 * `http://localhost:3000` na caixa de entrada de um cliente.
 */

const original = { site: process.env.NEXT_PUBLIC_SITE_URL, vercel: process.env.VERCEL_URL, node: process.env.NODE_ENV };

function ambiente({ site, vercel, node }: { site?: string; vercel?: string; node?: string }) {
  if (site === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = site;
  if (vercel === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = vercel;
  // NODE_ENV é somente-leitura no tipo, mas em tempo de execução é uma
  // propriedade normal de process.env — e é justamente ela que decide se
  // um localhost pode virar link.
  if (node === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;
  else (process.env as Record<string, string | undefined>).NODE_ENV = node;
}

beforeEach(() => ambiente({}));
afterEach(() => ambiente({ site: original.site, vercel: original.vercel, node: original.node }));

describe("endereço público do site", () => {
  it("usa a variável configurada, sem a barra do fim", () => {
    ambiente({ site: "https://www.manualpraticodooutfit.com.br/", node: "production" });
    expect(baseDoSite()).toBe("https://www.manualpraticodooutfit.com.br");
  });

  it.each([
    ["http://localhost:3000"],
    ["http://127.0.0.1:3000"],
    ["http://localhost"],
  ])("NUNCA deixa %s virar link de e-mail fora do modo de desenvolvimento", (local) => {
    ambiente({ site: local, node: "production" });
    expect(baseDoSite()).toBe(SITE_CANONICO);

    // Script de suporte rodando na máquina de alguém: NODE_ENV nem existe.
    ambiente({ site: local, node: undefined });
    expect(baseDoSite()).toBe(SITE_CANONICO);
  });

  it("mantém o localhost em `next dev`, que é onde ele serve", () => {
    ambiente({ site: "http://localhost:3000", node: "development" });
    expect(baseDoSite()).toBe("http://localhost:3000");
  });

  it("sem variável nenhuma, cai no domínio oficial", () => {
    ambiente({ node: "production" });
    expect(baseDoSite()).toBe(SITE_CANONICO);
  });

  it("usa a URL da Vercel quando é só o que existe", () => {
    ambiente({ vercel: "mpo-abc123.vercel.app", node: "production" });
    expect(baseDoSite()).toBe("https://mpo-abc123.vercel.app");
  });

  it("monta o caminho com uma barra só", () => {
    ambiente({ site: "https://www.manualpraticodooutfit.com.br", node: "production" });
    expect(urlDoSite("/definir-senha/abc")).toBe("https://www.manualpraticodooutfit.com.br/definir-senha/abc");
    expect(urlDoSite("definir-senha/abc")).toBe("https://www.manualpraticodooutfit.com.br/definir-senha/abc");
  });
});
