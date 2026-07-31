import { describe, it, expect } from "vitest";
import { emailAcessoLiberado, emailBonusLiberado, emailTeste, esc, primeiroNome } from "./templates";

const BASE = {
  nome: "Maria Silva Souza",
  email: "maria@exemplo.com",
  linkAcesso: "https://projeto.supabase.co/auth/v1/verify?token=abc123&type=recovery",
  siteUrl: "https://manualpraticodooutfit.com.br/",
};

describe("e-mail de acesso", () => {
  const email = emailAcessoLiberado(BASE);

  it("usa o assunto combinado", () => {
    expect(email.assunto).toBe("Seu acesso ao MPO está liberado");
  });

  it("tem versão em texto com o link, para quem bloqueia HTML", () => {
    expect(email.texto).toContain(BASE.linkAcesso);
    expect(email.texto).toContain("E-mail de acesso: maria@exemplo.com");
    expect(email.texto).toContain("suporte@manualpraticodooutfit.com.br");
    expect(email.texto).not.toContain("<");
  });

  it("trata o cliente pelo primeiro nome", () => {
    expect(email.texto.startsWith("Olá, Maria!")).toBe(true);
    expect(primeiroNome("  ")).toBe("aluno");
  });

  it("tem UM único botão, com o texto pedido", () => {
    const botoes = email.html.match(/CRIAR MINHA SENHA E ACESSAR O MPO/g) ?? [];
    expect(botoes).toHaveLength(1);
    expect(email.html).toContain(`href="${BASE.linkAcesso.replace(/&/g, "&amp;")}"`);
  });

  it("respeita o layout pedido: 600px, fundo cinza, cartão branco, corpo 16px", () => {
    expect(email.html).toContain("max-width:600px");
    expect(email.html).toContain("background:#f1f3f6");
    expect(email.html).toContain("background:#ffffff");
    expect(email.html).toContain("font-size:16px");
  });

  it("mostra a logo pequena do projeto", () => {
    expect(email.html).toContain('src="https://manualpraticodooutfit.com.br/logo-mpo-192.png"');
    expect(email.html).toContain('width="40"');
  });

  it("não usa emoji nem linguagem de urgência", () => {
    const proibidas = /última chance|imperdível|abra agora|corre|urgente|garanta já/i;
    expect(proibidas.test(email.html)).toBe(false);
    expect(proibidas.test(email.texto)).toBe(false);
    // faixa de emoji e símbolos
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(email.html)).toBe(false);
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(email.texto)).toBe(false);
  });

  it("escapa o que veio do gateway — nome não pode injetar HTML", () => {
    const malicioso = emailAcessoLiberado({
      ...BASE,
      nome: '<script>alert(1)</script>',
      email: 'a"@b.com',
    });
    expect(malicioso.html).not.toContain("<script>");
    expect(malicioso.html).toContain("&lt;script&gt;");
    expect(esc(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("normaliza a barra final da URL do site", () => {
    expect(email.texto).toContain("https://manualpraticodooutfit.com.br\n");
    expect(email.html).not.toContain("com.br//");
  });
});

describe("e-mail de bônus", () => {
  it("aponta para a página de bônus e mantém a versão em texto", () => {
    const email = emailBonusLiberado({ nome: "João", bonus: "Grupo no WhatsApp", siteUrl: "https://x.com.br" });
    expect(email.html).toContain("https://x.com.br/bonus");
    expect(email.texto).toContain("https://x.com.br/bonus");
    expect(email.assunto).toBe("Seu bônus do MPO está liberado");
  });
});

describe("e-mail de teste", () => {
  it("é identificável no assunto e não carrega link de senha real", () => {
    const email = emailTeste({ siteUrl: "https://x.com.br", para: "eu@exemplo.com" });
    expect(email.assunto.startsWith("[TESTE]")).toBe(true);
    expect(email.html).toContain("https://x.com.br/login");
    expect(email.html).not.toContain("type=recovery");
  });
});
