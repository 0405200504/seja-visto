import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { configWhatsApp, type ConfigWhatsApp } from "./config";
import type { Contato } from "./fila";

/**
 * Quem sumiu do app.
 *
 * Este módulo só CONSULTA: descobre quem está inativo e responde se uma
 * pessoa continua inativa. Quem agenda é automacoes.ts, quem envia é a
 * fila. A separação existe para a fila poder reconferir no instante do
 * envio sem depender do módulo que agendou.
 *
 * O sinal de atividade é o `last_seen_at` do perfil, escrito pelo layout
 * do app (no máximo 1x a cada 30 min). Quem nunca acessou tem
 * `last_seen_at` NULO e NÃO entra aqui: "faz alguns dias que você não
 * abre" seria mentira para quem nunca abriu — esse caso é o segmento
 * "pagaram e nunca acessaram", que pede outra conversa.
 */

type Db = ReturnType<typeof createAdminClient>;

const DIA = 24 * 60 * 60 * 1000;

/** Contato com o que a seleção precisa para achar o perfil do aluno. */
export type ContatoAluno = Contato & {
  user_id: string | null;
  email: string | null;
};

export type AlunoInativo = {
  contato: Contato;
  userId: string;
  ultimoAcesso: string;
  diasParado: number;
};

/** Janela de inatividade em ISO: [maisAntigo, maisRecente]. */
function janela(cfg: ConfigWhatsApp, agora = Date.now()) {
  return {
    maisAntigo: new Date(agora - cfg.inatividadeMaxDias * DIA).toISOString(),
    maisRecente: new Date(agora - cfg.inatividadeDias * DIA).toISOString(),
  };
}

/** Acesso pago vigente? Sem isto, o lembrete iria para quem já perdeu o acesso. */
function acessoVigente(expiraEm: string | null | undefined): boolean {
  return !expiraEm || new Date(expiraEm) > new Date();
}

/**
 * Alunos que podem receber o lembrete agora.
 *
 * O filtro é acumulativo e todo elo é obrigatório:
 *  1. contato com consentimento e sem opt-out;
 *  2. perfil com `last_seen_at` dentro da janela (inativo há N dias, mas
 *     não sumido há mais de M);
 *  3. acesso "base" ainda válido;
 *  4. nenhum lembrete de inatividade nos últimos `inatividadeIntervaloDias`.
 */
export async function buscarAlunosInativos(
  db: Db,
  cfg = configWhatsApp()
): Promise<AlunoInativo[]> {
  const agora = Date.now();
  const { maisAntigo, maisRecente } = janela(cfg, agora);

  /* 1) Contatos elegíveis. A tabela é pequena (uma linha por telefone de
   *    comprador), então partir daqui evita varrer todos os perfis. */
  const { data: contatos } = await db
    .from("whatsapp_contacts")
    .select("id, phone, name, email, user_id, opted_out_at, consent_granted_at")
    .is("opted_out_at", null)
    .not("consent_granted_at", "is", null);

  const lista = (contatos ?? []) as ContatoAluno[];
  if (lista.length === 0) return [];

  /* 2) Perfis. O contato guarda o user_id quando a compra já tinha conta;
   *    quando não tinha, o e-mail é o único elo — daí a segunda busca. */
  const userIds = lista.map((c) => c.user_id).filter((id): id is string => !!id);
  const emails = lista
    .filter((c) => !c.user_id && c.email)
    .map((c) => c.email!.toLowerCase());

  type Perfil = { user_id: string; email: string | null; last_seen_at: string | null };
  const semDados = { data: [] as Perfil[] };

  const [porUser, porEmail] = await Promise.all([
    userIds.length
      ? db
          .from("users_profile")
          .select("user_id, email, last_seen_at")
          .in("user_id", userIds)
          .gte("last_seen_at", maisAntigo)
          .lte("last_seen_at", maisRecente)
      : semDados,
    emails.length
      ? db
          .from("users_profile")
          .select("user_id, email, last_seen_at")
          .in("email", emails)
          .gte("last_seen_at", maisAntigo)
          .lte("last_seen_at", maisRecente)
      : semDados,
  ]);

  const perfisPorUser = new Map<string, Perfil>();
  const perfisPorEmail = new Map<string, Perfil>();
  for (const p of [...((porUser.data ?? []) as Perfil[]), ...((porEmail.data ?? []) as Perfil[])]) {
    perfisPorUser.set(p.user_id, p);
    if (p.email) perfisPorEmail.set(p.email.toLowerCase(), p);
  }

  const candidatos: AlunoInativo[] = [];
  for (const c of lista) {
    const perfil = c.user_id
      ? perfisPorUser.get(c.user_id)
      : c.email
        ? perfisPorEmail.get(c.email.toLowerCase())
        : undefined;
    if (!perfil?.last_seen_at) continue;

    candidatos.push({
      contato: {
        id: c.id,
        phone: c.phone,
        name: c.name,
        opted_out_at: c.opted_out_at,
        consent_granted_at: c.consent_granted_at,
      },
      userId: perfil.user_id,
      ultimoAcesso: perfil.last_seen_at,
      diasParado: Math.floor((agora - new Date(perfil.last_seen_at).getTime()) / DIA),
    });
  }
  if (candidatos.length === 0) return [];

  /* 3) Acesso vigente. Quem perdeu o acesso não recebe "está tudo lá" —
   *    esse cliente é assunto da automação de renovação. */
  const { data: acessos } = await db
    .from("user_entitlements")
    .select("user_id, expires_at")
    .eq("entitlement", "base")
    .in("user_id", candidatos.map((c) => c.userId));

  const comAcesso = new Set(
    ((acessos ?? []) as { user_id: string; expires_at: string | null }[])
      .filter((e) => acessoVigente(e.expires_at))
      .map((e) => e.user_id)
  );

  const comAcessoValido = candidatos.filter((c) => comAcesso.has(c.userId));
  if (comAcessoValido.length === 0) return [];

  /* 4) Descanso entre lembretes. O cron roda todo dia e a inatividade
   *    continua verdadeira todo dia — sem esta trava, quem sumiu receberia
   *    a mesma mensagem diariamente. */
  const desde = new Date(agora - cfg.inatividadeIntervaloDias * DIA).toISOString();
  const { data: recentes } = await db
    .from("whatsapp_messages")
    .select("contact_id")
    .eq("message_type", "inactivity_nudge")
    .in("contact_id", comAcessoValido.map((c) => c.contato.id))
    .in("status", ["scheduled", "processing", "sent"])
    .gte("created_at", desde);

  const jaAvisados = new Set(((recentes ?? []) as { contact_id: number }[]).map((m) => m.contact_id));

  return comAcessoValido
    .filter((c) => !jaAvisados.has(c.contato.id))
    // Quem está parado há mais tempo primeiro: se o teto da rodada cortar,
    // corta quem acabou de entrar na janela e volta a caber amanhã.
    .sort((a, b) => b.diasParado - a.diasParado);
}

export type VeredictoInatividade = { enviar: true } | { enviar: false; motivo: string };

/**
 * A pessoa continua inativa AGORA?
 *
 * Chamado pela fila no instante do envio. É o que impede mandar "faz
 * alguns dias que você não abre" para quem entrou no app depois que a
 * mensagem foi agendada — inclusive para quem entrou por causa de outra
 * mensagem nossa.
 */
export async function continuaInativo(
  db: Db,
  contato: { user_id: string | null; email: string | null },
  cfg = configWhatsApp()
): Promise<VeredictoInatividade> {
  const { maisAntigo, maisRecente } = janela(cfg);

  let q = db.from("users_profile").select("user_id, last_seen_at");
  if (contato.user_id) q = q.eq("user_id", contato.user_id);
  else if (contato.email) q = q.eq("email", contato.email.toLowerCase());
  else return { enviar: false, motivo: "contato não está ligado a nenhum aluno" };

  const { data: perfil } = await q.maybeSingle<{ user_id: string; last_seen_at: string | null }>();

  if (!perfil) return { enviar: false, motivo: "aluno não encontrado" };
  if (!perfil.last_seen_at) return { enviar: false, motivo: "aluno nunca acessou" };
  if (perfil.last_seen_at > maisRecente) return { enviar: false, motivo: "aluno voltou a acessar" };
  if (perfil.last_seen_at < maisAntigo) return { enviar: false, motivo: "inativo há tempo demais para este lembrete" };

  const { data: acesso } = await db
    .from("user_entitlements")
    .select("expires_at")
    .eq("entitlement", "base")
    .eq("user_id", perfil.user_id)
    .maybeSingle<{ expires_at: string | null }>();

  if (!acesso) return { enviar: false, motivo: "aluno não tem mais acesso" };
  if (!acessoVigente(acesso.expires_at)) return { enviar: false, motivo: "acesso expirado" };

  return { enviar: true };
}
