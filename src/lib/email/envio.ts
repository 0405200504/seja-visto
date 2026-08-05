import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail, sanitizarErro, type Mensagem, type ResultadoEnvio } from "./mailer";

/**
 * Envio idempotente, com registro em banco.
 *
 * O webhook da Cakto reenvia o mesmo evento em timeout, retentativa e
 * reprocessamento manual. A tabela `email_sends` (migração 00023) garante
 * que o cliente receba o e-mail de acesso UMA vez, mesmo assim:
 *
 *   reservar (insert 'enviando')  →  enviar  →  confirmar ('enviado')
 *                                          ↘  falhar   ('falhou')
 *
 * O UNIQUE em `chave` faz a segunda entrega perder a corrida e desistir.
 * Uma falha nunca vira 'enviado': fica 'falhou' e a próxima tentativa
 * assume a linha — o cliente não paga e fica sem o link.
 */

type Db = ReturnType<typeof createAdminClient>;

export type TipoEmail = "acesso" | "bonus" | "teste" | "recuperacao";

type Reserva =
  | { seguir: true; id: number | null }
  | { seguir: false; motivo: "ja_enviado" | "em_andamento" };

/** Janela em que uma reserva 'enviando' é considerada viva. */
const RESERVA_VIVA_MS = 10 * 60 * 1000;

/** A tabela ainda não existe (migração 00023 não aplicada)? */
function tabelaAusente(erro: { code?: string; message?: string } | null): boolean {
  if (!erro) return false;
  const msg = erro.message ?? "";
  if (erro.code === "42P01" || erro.code === "PGRST205") return true;
  return /email_sends/.test(msg) && /(does not exist|not find|não existe)/i.test(msg);
}

/** Chave de idempotência do e-mail de acesso: um por conta criada. */
export function chaveAcesso(userId: string): string {
  return `acesso:user:${userId}`;
}

/** Chave do aviso de bônus: um por evento do gateway. */
export function chaveBonus(eventId: string): string {
  return `bonus:evento:${eventId}`;
}

/**
 * Tenta reservar o envio. `seguir: false` significa que outra execução já
 * enviou (ou está enviando agora) — não mande de novo.
 *
 * Se a tabela ainda não existir, devolve `{ seguir: true, id: null }`:
 * melhor mandar sem registro do que deixar um cliente pagante sem acesso
 * por causa de uma migração pendente.
 */
export async function reservarEnvio(
  db: Db,
  dados: { chave: string; tipo: TipoEmail; email: string; userId?: string | null }
): Promise<Reserva> {
  const { data, error } = await db
    .from("email_sends")
    .insert({
      chave: dados.chave,
      tipo: dados.tipo,
      email: dados.email,
      user_id: dados.userId ?? null,
      status: "enviando",
    })
    .select("id")
    .single<{ id: number }>();

  if (!error) return { seguir: true, id: data.id };

  if (tabelaAusente(error)) {
    console.warn(
      "[email] tabela email_sends ausente — enviando sem controle de duplicidade. " +
        "Aplique a migração 00023_email_envios.sql."
    );
    return { seguir: true, id: null };
  }

  // 23505: alguém já reservou esta chave.
  if (error.code !== "23505") {
    console.error("[email] falha ao reservar envio", { chave: dados.chave, code: error.code });
    // Sem conseguir registrar, seguimos: perder o e-mail de acesso é pior
    // do que arriscar uma duplicata rara.
    return { seguir: true, id: null };
  }

  const { data: anterior } = await db
    .from("email_sends")
    .select("id, status, tentativas, updated_at")
    .eq("chave", dados.chave)
    .maybeSingle<{ id: number; status: string; tentativas: number; updated_at: string }>();

  if (!anterior) return { seguir: true, id: null };
  if (anterior.status === "enviado") return { seguir: false, motivo: "ja_enviado" };

  const idade = Date.now() - new Date(anterior.updated_at).getTime();
  if (anterior.status === "enviando" && idade < RESERVA_VIVA_MS) {
    return { seguir: false, motivo: "em_andamento" };
  }

  /* Retomada: a tentativa anterior falhou (ou morreu no meio). O `.eq` no
   * status é o lock otimista — se outra execução retomar primeiro, o update
   * não pega linha nenhuma e esta aqui desiste. */
  const { data: retomada } = await db
    .from("email_sends")
    .update({
      status: "enviando",
      tentativas: anterior.tentativas + 1,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", anterior.id)
    .eq("status", anterior.status)
    .select("id")
    .maybeSingle<{ id: number }>();

  if (!retomada) return { seguir: false, motivo: "em_andamento" };
  return { seguir: true, id: retomada.id };
}

/** Marca a reserva como enviada. */
async function confirmar(db: Db, id: number | null, via: string | undefined): Promise<void> {
  if (id === null) return;
  const agora = new Date().toISOString();
  const { error } = await db
    .from("email_sends")
    .update({ status: "enviado", provedor: via ?? null, sent_at: agora, updated_at: agora, error_message: null })
    .eq("id", id);
  if (error) console.error("[email] envio saiu, mas não consegui marcar como enviado", error.message);
}

/** Marca a reserva como falha — libera uma nova tentativa. */
async function marcarFalha(db: Db, id: number | null, motivo: string): Promise<void> {
  if (id === null) return;
  await db
    .from("email_sends")
    .update({
      status: "falhou",
      error_message: sanitizarErro(motivo).slice(0, 400),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export type ResultadoRegistrado = ResultadoEnvio & { duplicado?: boolean };

/**
 * Reserva, envia e registra o desfecho.
 *
 * Devolve `{ enviado: true, duplicado: true }` quando o e-mail já tinha
 * saído: para quem chama, o efeito desejado está garantido — o cliente tem
 * o e-mail — sem mandar uma segunda cópia.
 */
export async function enviarEmailRegistrado(
  db: Db,
  reserva: { chave: string; tipo: TipoEmail; userId?: string | null },
  mensagem: Mensagem
): Promise<ResultadoRegistrado> {
  const vaga = await reservarEnvio(db, {
    chave: reserva.chave,
    tipo: reserva.tipo,
    email: mensagem.para,
    userId: reserva.userId,
  });

  if (!vaga.seguir) {
    return vaga.motivo === "ja_enviado"
      ? { enviado: true, duplicado: true, motivo: "e-mail já enviado antes" }
      : { enviado: false, duplicado: true, motivo: "outro envio deste e-mail está em andamento" };
  }

  const resultado = await enviarEmail(mensagem);

  if (resultado.enviado) {
    await confirmar(db, vaga.id, resultado.via);
  } else {
    await marcarFalha(db, vaga.id, resultado.motivo ?? "motivo desconhecido");
  }
  return resultado;
}
