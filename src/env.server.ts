import "server-only";
import { z } from "zod";

/**
 * Leitura ÚNICA e validada das variáveis de ambiente do servidor.
 *
 * O `import "server-only"` no topo é a trava principal: se qualquer arquivo
 * com "use client" importar este módulo (direto ou por transitividade), o
 * BUILD FALHA. É o que impede um segredo de ser embutido no bundle por
 * acidente numa refatoração futura.
 *
 * A validação é preguiçosa de propósito. Um `schema.parse(process.env)` no
 * topo do módulo roda durante o `next build`, onde os segredos normalmente
 * não estão presentes (CI, lint, build de Preview) — e derrubaria o build por
 * um motivo que não é erro de verdade. Validando no primeiro acesso, o
 * comportamento é o desejado: a requisição que precisa do segredo falha na
 * hora, com mensagem clara, e nada que não precisa dele é afetado.
 */

const schema = z.object({
  // ---------- Públicas (também expostas ao navegador) ----------
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("precisa ser a URL do projeto Supabase"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),

  // ---------- SEGREDOS ----------
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20)
    .refine((v) => !v.startsWith("sb_publishable_"), {
      message:
        "isto é a chave PUBLICÁVEL, não a service role. Copie a chave 'secret' em Project Settings → API keys.",
    }),
  CAKTO_WEBHOOK_SECRET: z.string().min(16, "use um segredo de 16+ caracteres"),
  OPENAI_API_KEY: z.string().startsWith("sk-", "a chave da OpenAI começa com sk-"),
  CRON_SECRET: z.string().min(16).optional(),

  // ---------- Segredos opcionais (features degradam sem eles) ----------
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  // Senha SMTP do e-mail do domínio (suporte@manualpraticodooutfit.com.br).
  SMTP_PASSWORD: z.string().optional(),
  // Par legado do Gmail. Continua aceito, mas só envia se a conta for do
  // MESMO domínio do remetente — ver src/lib/email/config.ts.
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  UAZAPI_URL: z.string().url().optional(),
  UAZAPI_TOKEN: z.string().optional(),

  // ---------- Configuração não secreta ----------
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_WHATSAPP: z.string().optional(),
  WHATSAPP_GROUP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cache: ServerEnv | null = null;

/**
 * Variáveis do servidor, validadas. Lança erro descritivo se algo essencial
 * faltar ou estiver no formato errado.
 */
export function serverEnv(): ServerEnv {
  if (cache) return cache;

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problemas = parsed.error.issues
      .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Só o NOME da variável entra na mensagem — nunca o valor, senão o
    // segredo vaza no log de erro da Vercel.
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${problemas}\n` +
        `Configure em Vercel → Settings → Environment Variables (ou no .env.local).`
    );
  }

  cache = parsed.data;
  return cache;
}

/** Só para o painel de diagnóstico: diz SE existe, sem revelar o valor. */
export function segredoConfigurado(nome: keyof ServerEnv): boolean {
  const v = process.env[nome];
  return typeof v === "string" && v.length > 0;
}
