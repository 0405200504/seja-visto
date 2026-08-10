import "server-only";
import { normalizarTelefone } from "./phone";
import { baseDoSite } from "@/lib/site-url";

/**
 * Configuração das automações de WhatsApp.
 *
 * Tudo por variável de ambiente, com padrão seguro: se a variável não
 * existir, a automação fica DESLIGADA e o modo de teste fica LIGADO.
 * Ninguém liga um disparo em massa por esquecimento de configuração.
 *
 * Nenhum valor secreto é exportado daqui — só as credenciais lidas na
 * hora do envio, dentro de lib/whatsapp/uazapi.ts.
 */

function num(nome: string, padrao: number): number {
  const v = Number(process.env[nome]);
  return Number.isFinite(v) && v >= 0 ? v : padrao;
}

function flag(nome: string, padrao: boolean): boolean {
  const v = process.env[nome]?.trim().toLowerCase();
  if (v === undefined || v === "") return padrao;
  return v === "true" || v === "1" || v === "sim";
}

export type ConfigWhatsApp = ReturnType<typeof configWhatsApp>;

export function configWhatsApp() {
  const appUrl = baseDoSite();

  return {
    // ---------- Chaves gerais ----------
    /** Nenhuma automação envia nada com isto desligado. */
    filaAtiva: flag("WHATSAPP_QUEUE_ENABLED", false),
    carrinhoAtivo: flag("WHATSAPP_CART_RECOVERY_ENABLED", false),
    renovacaoAtiva: flag("WHATSAPP_RENEWAL_ENABLED", false),
    inatividadeAtiva: flag("WHATSAPP_INACTIVITY_ENABLED", false),

    /** Em teste, só os números da lista recebem. Padrão: LIGADO. */
    modoTeste: flag("WHATSAPP_AUTOMATION_TEST_MODE", true),
    numerosDeTeste: (process.env.WHATSAPP_TEST_NUMBERS ?? "")
      .split(",")
      .map((n) => normalizarTelefone(n))
      .filter((t): t is { ok: true; numero: string; pais: "BR" | "EX" } => t.ok)
      .map((t) => t.numero),

    // ---------- Ritmo do carrinho abandonado ----------
    carrinhoPrimeiraEmMin: num("WHATSAPP_CART_FIRST_DELAY_MINUTES", 30),
    carrinhoSegundaEmHoras: num("WHATSAPP_CART_SECOND_DELAY_HOURS", 24),
    carrinhoTerceiraEmHoras: num("WHATSAPP_CART_THIRD_DELAY_HOURS", 72),

    // ---------- Ritmo da renovação ----------
    lembreteMensalDias: num("WHATSAPP_MONTHLY_REMINDER_DAYS", 3),
    lembreteAnualPrimeiroDias: num("WHATSAPP_ANNUAL_FIRST_REMINDER_DAYS", 15),
    lembreteAnualSegundoDias: num("WHATSAPP_ANNUAL_SECOND_REMINDER_DAYS", 3),
    cobrancaMensalPendenteDias: num("WHATSAPP_MONTHLY_PENDING_DAYS", 3),
    cobrancaAnualPendenteDias: num("WHATSAPP_ANNUAL_PENDING_DAYS", 5),

    // ---------- Ritmo do lembrete de inatividade ----------
    /** Dias sem abrir o app para virar candidato ao lembrete. */
    inatividadeDias: num("WHATSAPP_INACTIVITY_DAYS", 3),
    /**
     * Teto da janela. Quem sumiu há mais tempo que isto não recebe: um
     * "senti sua falta" no terceiro mês é outra conversa, não este lembrete.
     */
    inatividadeMaxDias: num("WHATSAPP_INACTIVITY_MAX_DAYS", 30),
    /**
     * Intervalo mínimo entre dois lembretes para a MESMA pessoa. Sem isto,
     * o cron diário mandaria a mesma mensagem todo dia para quem sumiu.
     */
    inatividadeIntervaloDias: num("WHATSAPP_INACTIVITY_COOLDOWN_DAYS", 14),
    /** Teto de lembretes agendados por rodada, para não virar disparo em massa. */
    inatividadeMaxPorRodada: num("WHATSAPP_INACTIVITY_BATCH", 25),

    // ---------- Fila ----------
    /** Intervalo técnico entre envios. Não é aleatório de propósito. */
    intervaloEnvioMs: num("WHATSAPP_SEND_INTERVAL_MS", 5000),
    maxPorRodada: num("WHATSAPP_QUEUE_BATCH", 10),
    maxTentativas: num("WHATSAPP_MAX_RETRIES", 3),
    /** Espera da 1ª retentativa; as seguintes multiplicam (30s, 2min, 10min). */
    retryInicialMs: num("WHATSAPP_RETRY_INITIAL_DELAY_MS", 30000),

    // ---------- Links usados nas mensagens ----------
    appUrl,
    /** Página nossa que identifica o aluno e leva ao checkout certo. */
    linkRenovar: `${appUrl}/renovar`,
    /** Porta de entrada de quem já é aluno — usada no lembrete de inatividade. */
    linkApp: `${appUrl}/dashboard`,
    linkCancelamento: `${appUrl}/renovar#cancelar`,
    checkoutMensal: process.env.CHECKOUT_MENSAL_URL ?? "https://pay.cakto.com.br/zkkrorx_973168",
    checkoutAnual: process.env.CHECKOUT_ANUAL_URL ?? "https://pay.cakto.com.br/3dmtwv7",
    suporteEmail: "suporte@manualpraticodooutfit.com.br",
  };
}

/**
 * O número pode receber agora?
 *
 * Em modo de teste, só a lista autorizada passa — é o que impede uma
 * automação recém-ligada de alcançar cliente real antes da hora.
 */
export function podeEnviarPara(numero: string, cfg = configWhatsApp()): { ok: boolean; motivo?: string } {
  if (!cfg.filaAtiva) return { ok: false, motivo: "fila desligada (WHATSAPP_QUEUE_ENABLED)" };
  if (cfg.modoTeste && !cfg.numerosDeTeste.includes(numero)) {
    return { ok: false, motivo: "modo de teste: número fora da lista autorizada" };
  }
  return { ok: true };
}
