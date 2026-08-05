import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import {
  baseDoSite,
  diasDaFinalidade,
  gerarLinkDeSenha,
  type LinkGerado,
} from "@/lib/links-acesso";
import { emailAcessoLiberado, emailRecuperacaoSenha } from "./templates";
import { enviarEmailRegistrado, type ResultadoRegistrado } from "./envio";

/**
 * Os dois e-mails que carregam link de senha, em um lugar só.
 *
 * Antes cada origem (webhook da Cakto, venda manual, cadastro pelo admin,
 * reenvio) montava o link e o e-mail por conta própria, com quatro cópias
 * do mesmo trecho. Quando o prazo do link mudou, uma delas ficaria para
 * trás — e o e-mail prometeria um prazo que o banco não cumpre.
 */

type Db = ReturnType<typeof createAdminClient>;

export type ResultadoAcesso = ResultadoRegistrado & { link?: LinkGerado };

/**
 * Manda o e-mail de "seu acesso está liberado", com link para criar a senha.
 *
 * `chave` é a trava de idempotência do registro de envios: use
 * `acesso:user:<id>` para o envio automático (uma vez por conta) e uma
 * chave com carimbo de hora para o reenvio manual, que é uma decisão do
 * admin e não pode ficar presa na trava.
 */
export async function enviarEmailDeAcesso(
  db: Db,
  {
    userId,
    email,
    nome,
    chave,
  }: { userId: string; email: string; nome: string | null; chave: string }
): Promise<ResultadoAcesso> {
  const link = await gerarLinkDeSenha(db, { userId, email, finalidade: "acesso" });
  if (!link) {
    return { enviado: false, motivo: "não consegui gerar o link de acesso" };
  }

  const siteUrl = baseDoSite();
  const msg = emailAcessoLiberado({
    nome: nome || "aluno",
    email,
    linkAcesso: link.url,
    siteUrl,
    // O texto do e-mail anuncia o prazo real: 30 dias no caminho normal,
    // 24h quando o link teve de vir do Supabase (ver gerarLinkDeSenha).
    validadeDias: link.proprio ? diasDaFinalidade("acesso") : 1,
  });

  const envio = await enviarEmailRegistrado(
    db,
    { chave, tipo: "acesso", userId },
    { para: email, assunto: msg.assunto, html: msg.html, texto: msg.texto }
  );

  return { ...envio, link };
}

/**
 * Manda o e-mail de "esqueci minha senha".
 *
 * Quem chama NÃO deve variar a resposta conforme o resultado daqui: dizer
 * "não achei esse e-mail" transforma o formulário num verificador de quem
 * tem conta no projeto.
 */
export async function enviarEmailDeRecuperacao(
  db: Db,
  { userId, email, nome }: { userId: string; email: string; nome: string | null }
): Promise<ResultadoRegistrado> {
  const link = await gerarLinkDeSenha(db, { userId, email, finalidade: "recuperacao" });
  if (!link) return { enviado: false, motivo: "não consegui gerar o link de recuperação" };

  const msg = emailRecuperacaoSenha({
    nome: nome || "aluno",
    email,
    linkAcesso: link.url,
    siteUrl: baseDoSite(),
    validadeDias: link.proprio ? diasDaFinalidade("recuperacao") : 1,
  });

  /* A chave leva a hora: recuperação é um pedido consciente e repetível.
   * Quem pede duas vezes com uma hora de diferença precisa receber os dois
   * e-mails — o limite de frequência já está no formulário. */
  return enviarEmailRegistrado(
    db,
    { chave: `recuperacao:user:${userId}:${Date.now()}`, tipo: "recuperacao", userId },
    { para: email, assunto: msg.assunto, html: msg.html, texto: msg.texto }
  );
}
