import "server-only";
import { mascararTelefone } from "./phone";

/**
 * Cliente da uazapi.
 *
 * Endpoints conferidos contra a instância real em 2026-07-31
 * (servidor uazapi 2.1.4, build 4747e1b34):
 *
 *   GET  /instance/status  → { instance: { status: "connected" | ... } }
 *   POST /send/text        → { messageid, id, status, chatid, ... }
 *
 * Autenticação: header `token` com o token DA INSTÂNCIA. O token nunca
 * aparece em log, em retorno de função ou em tela do admin.
 *
 * A doc pública (docs.uazapi.com) é uma SPA que não expõe a especificação,
 * então o contrato acima foi verificado chamando a API. Se a uazapi mudar,
 * o erro aparece como `categoria: "permanente"` no painel, não como
 * mensagem perdida em silêncio.
 */

export type CategoriaErro =
  | "temporario" // rede, 5xx, timeout — vale tentar de novo
  | "permanente" // número inválido, credencial errada — não adianta insistir
  | "desconectado"; // instância fora do ar — para tudo e avisa

export type EnvioOk = {
  ok: true;
  providerMessageId: string;
  codigo: number;
};

export type EnvioErro = {
  ok: false;
  categoria: CategoriaErro;
  codigo: number | null;
  motivo: string;
};

export type ResultadoUazapi = EnvioOk | EnvioErro;

function credenciais(): { url: string; token: string } | null {
  const url = (process.env.UAZAPI_URL ?? process.env.UAZAPI_BASE_URL)?.trim().replace(/\/$/, "");
  const token = process.env.UAZAPI_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

/** Tira do texto do erro qualquer coisa parecida com credencial. */
export function limparErro(bruto: unknown): string {
  const texto = bruto instanceof Error ? bruto.message : String(bruto);
  const token = process.env.UAZAPI_TOKEN?.trim();
  let limpo = texto;
  if (token && token.length >= 8) limpo = limpo.split(token).join("[redigido]");
  return limpo
    .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[redigido]"')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[uuid]")
    .slice(0, 300);
}

export type StatusInstancia = {
  conectada: boolean;
  estado: string;
  perfil?: string;
  motivo?: string;
};

/**
 * Estado da conexão do WhatsApp.
 *
 * A fila consulta isto ANTES de cada rodada: instância desconectada não
 * gera retentativa: gera parada e alerta. Ficar batendo numa instância
 * fora do ar é exatamente o comportamento que queima número.
 */
export async function statusInstancia(): Promise<StatusInstancia> {
  const cred = credenciais();
  if (!cred) return { conectada: false, estado: "sem_credencial", motivo: "UAZAPI_URL/UAZAPI_TOKEN ausentes" };

  try {
    const res = await fetch(`${cred.url}/instance/status`, {
      headers: { token: cred.token },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { conectada: false, estado: `http_${res.status}`, motivo: `instance/status devolveu ${res.status}` };
    }
    const corpo = (await res.json()) as { instance?: { status?: string; profileName?: string } };
    const estado = corpo.instance?.status ?? "desconhecido";
    return {
      conectada: estado === "connected",
      estado,
      perfil: corpo.instance?.profileName,
    };
  } catch (err) {
    return { conectada: false, estado: "erro", motivo: limparErro(err) };
  }
}

/**
 * Envia uma mensagem de texto.
 *
 * Devolve categoria do erro em vez de lançar: quem chama precisa decidir
 * entre repetir (temporário) e desistir (permanente).
 */
export async function enviarTexto(numero: string, texto: string): Promise<ResultadoUazapi> {
  const cred = credenciais();
  if (!cred) {
    return { ok: false, categoria: "permanente", codigo: null, motivo: "UAZAPI_URL/UAZAPI_TOKEN ausentes" };
  }

  try {
    const res = await fetch(`${cred.url}/send/text`, {
      method: "POST",
      headers: { token: cred.token, "Content-Type": "application/json" },
      body: JSON.stringify({ number: numero, text: texto }),
      signal: AbortSignal.timeout(20_000),
    });

    const bruto = await res.text();

    if (!res.ok) {
      /* 401/403 é credencial: insistir não resolve e ainda registra
       * tentativa inválida. 4xx de número/rota também é definitivo. */
      const categoria: CategoriaErro =
        res.status === 401 || res.status === 403
          ? "permanente"
          : res.status >= 500 || res.status === 429
            ? "temporario"
            : "permanente";
      return {
        ok: false,
        categoria,
        codigo: res.status,
        motivo: `uazapi ${res.status}: ${limparErro(bruto)}`,
      };
    }

    let corpo: { messageid?: string; id?: string; status?: string } = {};
    try {
      corpo = JSON.parse(bruto);
    } catch {
      return { ok: false, categoria: "temporario", codigo: res.status, motivo: "resposta não-JSON da uazapi" };
    }

    const id = corpo.messageid ?? corpo.id;
    if (!id) {
      return { ok: false, categoria: "temporario", codigo: res.status, motivo: "uazapi não devolveu messageid" };
    }
    return { ok: true, providerMessageId: id, codigo: res.status };
  } catch (err) {
    // Timeout e falha de rede são temporários por definição.
    return { ok: false, categoria: "temporario", codigo: null, motivo: limparErro(err) };
  }
}

/** Log seguro de envio: número mascarado, sem token e sem corpo completo. */
export function logEnvio(tipo: string, numero: string, resultado: ResultadoUazapi): void {
  const alvo = mascararTelefone(numero);
  if (resultado.ok) {
    console.info(`[whatsapp] ${tipo} → ${alvo} ok (${resultado.providerMessageId})`);
  } else {
    console.warn(`[whatsapp] ${tipo} → ${alvo} falhou (${resultado.categoria}): ${resultado.motivo}`);
  }
}
