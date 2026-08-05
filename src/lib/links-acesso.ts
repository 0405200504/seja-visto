import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { baseDoSite } from "@/lib/site-url";

/**
 * Link de "criar/redefinir senha" próprio do projeto.
 *
 * Antes o link vinha do `admin.generateLink` do Supabase, e ele tem um
 * limite que não dá para negociar: o OTP expira em no máximo 24 horas
 * (86400s é o teto do serviço, e o projeto já está nele). Quem comprava
 * na sexta e abria o e-mail no sábado caía em "link expirado" — foi
 * exatamente o que aconteceu com um membro criado pelo /admin.
 *
 * Aqui o token é nosso, então o prazo é decisão nossa: 30 dias para o
 * e-mail de acesso, 7 para a recuperação de senha. Continua sendo de uso
 * único e continua sendo revogável (basta apagar a linha).
 *
 * Duas regras que valem para qualquer mudança neste arquivo:
 *
 *  1. o token em claro só existe dentro do link; no banco fica o SHA-256.
 *     Um dump da tabela não devolve nenhum link utilizável;
 *  2. o consumo é um UPDATE condicional (`usado_em is null`), não um
 *     "leia, decida, grave". Dois cliques ao mesmo tempo no mesmo link —
 *     e o pré-carregador de link do Gmail faz isso — só deixam um passar.
 */

type Db = ReturnType<typeof createAdminClient>;

export type Finalidade = "acesso" | "recuperacao";

/** Prazo do link que vai no e-mail de acesso (compra ou cadastro pelo admin). */
export const DIAS_LINK_ACESSO = 30;
/** Prazo do link de "esqueci minha senha" — pedido pela própria pessoa, agora. */
export const DIAS_LINK_RECUPERACAO = 7;

export function diasDaFinalidade(finalidade: Finalidade): number {
  return finalidade === "acesso" ? DIAS_LINK_ACESSO : DIAS_LINK_RECUPERACAO;
}

/* O endereço público do site mora em @/lib/site-url — inclusive a trava que
 * impede um link `localhost` de sair em e-mail. Reexportado aqui porque
 * meio projeto já pedia `baseDoSite` deste módulo. */
export { baseDoSite };

/** O que fica guardado no lugar do token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 32 bytes de aleatoriedade criptográfica em base64url — 256 bits. */
function novoToken(): string {
  return randomBytes(32).toString("base64url");
}

export type LinkGerado = {
  url: string;
  expiraEm: Date;
  /** `false` quando caiu no plano B do Supabase (migração 00026 ainda não aplicada). */
  proprio: boolean;
};

/**
 * Gera o link que vai no e-mail.
 *
 * Se a tabela `access_links` ainda não existir (migração 00026 pendente),
 * cai no link do Supabase em vez de deixar um comprador sem acesso — a
 * mesma escolha que o registro de e-mails já faz. O prazo curto volta
 * junto, e é por isso que o retorno diz qual dos dois caminhos foi usado:
 * o texto do e-mail muda conforme a validade real.
 */
export async function gerarLinkDeSenha(
  db: Db,
  {
    userId,
    email,
    finalidade,
  }: { userId: string; email: string; finalidade: Finalidade }
): Promise<LinkGerado | null> {
  const token = novoToken();
  const dias = diasDaFinalidade(finalidade);
  const expiraEm = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  const { error } = await db.from("access_links").insert({
    token_hash: hashToken(token),
    user_id: userId,
    email: email.trim().toLowerCase(),
    finalidade,
    expira_em: expiraEm.toISOString(),
  });

  if (!error) {
    // Aproveita a visita para tirar da tabela o que já venceu faz tempo.
    void db.rpc("limpar_links_acesso_vencidos").then(
      () => {},
      () => {}
    );
    return { url: `${baseDoSite()}/definir-senha/${token}`, expiraEm, proprio: true };
  }

  console.error("[links-acesso] não consegui gravar o link:", error.message);

  /* Plano B: o link antigo do Supabase. Vale 24h e some se o e-mail for
   * pré-carregado por um antivírus, mas é melhor que e-mail nenhum. */
  const { data: link } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${baseDoSite()}/nova-senha` },
  });
  const url = link?.properties?.action_link;
  if (!url) return null;

  return { url, expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000), proprio: false };
}

/* Mensagens de link ruim. Ficam aqui, e não no arquivo da Server Action,
 * porque um módulo "use server" só pode exportar função assíncrona. */
export const LINK_INVALIDO =
  "Este link não é válido. Peça um novo em Recuperar senha — chega no mesmo e-mail.";
export const LINK_EXPIRADO =
  "Este link venceu. Peça um novo em Recuperar senha — chega no mesmo e-mail.";
export const LINK_USADO =
  "Este link já foi usado. Se foi você, entre com a senha que criou; se não lembra, peça um link novo.";

export function mensagemDoMotivo(motivo: "invalido" | "expirado" | "usado"): string {
  if (motivo === "expirado") return LINK_EXPIRADO;
  if (motivo === "usado") return LINK_USADO;
  return LINK_INVALIDO;
}

export type Verificacao =
  | { ok: true; userId: string; email: string; finalidade: Finalidade }
  | { ok: false; motivo: "invalido" | "expirado" | "usado"; email?: string };

/**
 * Confere o token SEM gastá-lo — é o que a página usa para decidir se
 * mostra o formulário ou a tela de "peça um link novo".
 */
export async function verificarToken(db: Db, token: string): Promise<Verificacao> {
  if (!token || token.length < 20 || token.length > 200) {
    return { ok: false, motivo: "invalido" };
  }

  const { data, error } = await db
    .from("access_links")
    .select("user_id, email, finalidade, expira_em, usado_em")
    .eq("token_hash", hashToken(token))
    .maybeSingle<{
      user_id: string;
      email: string;
      finalidade: Finalidade;
      expira_em: string;
      usado_em: string | null;
    }>();

  if (error || !data) return { ok: false, motivo: "invalido" };
  if (data.usado_em) return { ok: false, motivo: "usado", email: data.email };
  if (new Date(data.expira_em).getTime() < Date.now()) {
    return { ok: false, motivo: "expirado", email: data.email };
  }

  return { ok: true, userId: data.user_id, email: data.email, finalidade: data.finalidade };
}

/**
 * Gasta o token. Devolve `true` só para quem chegou primeiro: a condição
 * `usado_em is null` está no próprio UPDATE, então a corrida é resolvida
 * pelo Postgres e não por duas leituras que se cruzam.
 */
export async function consumirToken(db: Db, token: string): Promise<boolean> {
  const { data, error } = await db
    .from("access_links")
    .update({ usado_em: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("usado_em", null)
    .gte("expira_em", new Date().toISOString())
    .select("id");

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/**
 * Invalida os links pendentes de um usuário.
 *
 * Chamado depois que a senha é definida: se três e-mails de acesso saíram
 * (compra, reenvio manual, "esqueci minha senha"), os dois links que
 * sobraram na caixa de entrada param de valer no mesmo instante.
 */
export async function invalidarLinksPendentes(db: Db, userId: string): Promise<void> {
  await db
    .from("access_links")
    .update({ usado_em: new Date().toISOString() })
    .eq("user_id", userId)
    .is("usado_em", null);
}
