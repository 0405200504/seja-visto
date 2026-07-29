/**
 * 05 — TESTE DE CARGA (k6)
 *
 * Simula o pico de um lançamento: 300 pessoas navegando ao mesmo tempo.
 *
 * COMO RODAR
 *   1. brew install k6
 *   2. Aponte para STAGING, nunca para produção com clientes dentro:
 *        export BASE_URL="https://staging-seusite.vercel.app"
 *        export EMAIL="aluno-de-teste@seudominio.com"
 *        export SENHA="a-senha-desse-aluno"
 *   3. k6 run auditoria/05-teste-de-carga.js
 *
 * ⚠️  AVISOS
 *   · NÃO inclui /api/fit-check — cada chamada gasta dinheiro real
 *     na OpenAI. Teste esse endpoint à mão, com poucas chamadas.
 *   · Rodar contra produção consome cota de banco e egress do
 *     Supabase e pode derrubar o site para clientes de verdade.
 *   · Use uma conta de teste com acesso liberado, e apague depois.
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const erros = new Rate("erros_de_navegacao");
const tempoLista = new Trend("tempo_lista_combinacoes");

export const options = {
  stages: [
    { duration: "1m", target: 50 },   // aquecimento
    { duration: "2m", target: 300 },  // o "anúncio no ar"
    { duration: "3m", target: 300 },  // segura o pico
    { duration: "1m", target: 0 },    // desaquece
  ],
  thresholds: {
    // Se qualquer um destes estourar, o k6 termina com erro.
    http_req_failed:   ["rate<0.01"],   // menos de 1% de falha
    http_req_duration: ["p(95)<2000"],  // 95% abaixo de 2s
    tempo_lista_combinacoes: ["p(95)<2500"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const EMAIL = __ENV.EMAIL;
const SENHA = __ENV.SENHA;

// Login uma vez, reaproveita o cookie de sessão em todos os usuários virtuais.
export function setup() {
  if (!EMAIL || !SENHA) {
    console.warn("Sem EMAIL/SENHA: testando só as páginas públicas.");
    return { cookies: null };
  }
  const res = http.post(`${BASE}/login`, { email: EMAIL, password: SENHA }, {
    redirects: 0,
  });
  return { cookies: res.cookies };
}

export default function (data) {
  const params = data.cookies
    ? { cookies: data.cookies, tags: { logado: "sim" } }
    : { tags: { logado: "nao" } };

  group("página de vendas (visitante)", () => {
    const r = http.get(`${BASE}/`);
    check(r, { "home 200": (x) => x.status === 200 }) || erros.add(1);
  });

  sleep(Math.random() * 2 + 1);

  group("área do aluno", () => {
    const dash = http.get(`${BASE}/dashboard`, params);
    check(dash, { "dashboard ok": (x) => x.status === 200 }) || erros.add(1);

    sleep(Math.random() * 3 + 1);

    // A rota mais pesada: carrega TODOS os ~190 looks de uma vez.
    const t0 = Date.now();
    const looks = http.get(`${BASE}/combinacoes`, params);
    tempoLista.add(Date.now() - t0);
    check(looks, { "combinações ok": (x) => x.status === 200 }) || erros.add(1);

    sleep(Math.random() * 4 + 2);

    const metodo = http.get(`${BASE}/metodo`, params);
    check(metodo, { "método ok": (x) => x.status === 200 }) || erros.add(1);

    sleep(Math.random() * 3 + 1);

    const bonus = http.get(`${BASE}/bonus`, params);
    check(bonus, { "bônus ok": (x) => x.status === 200 }) || erros.add(1);
  });

  sleep(Math.random() * 5 + 2);
}

/**
 * COMO LER O RESULTADO
 *
 * http_req_failed .......... % de requisições que falharam.
 *   > 1%  →  o banco ou a Vercel já está recusando conexão.
 *
 * http_req_duration p(95) .. tempo que 95% das pessoas esperaram.
 *   < 1s   →  ótimo
 *   1–2s   →  aceitável no pico
 *   > 3s   →  gente desistindo e pedindo reembolso
 *
 * tempo_lista_combinacoes .. isola a página mais pesada.
 *   Se ela for MUITO pior que o dashboard, o gargalo é o
 *   `select * from looks` sem paginação — pagine no servidor.
 *
 * O QUE OLHAR EM PARALELO, ENQUANTO RODA
 *   · Supabase → Reports → Database: "connections" chegando no
 *     limite do plano é o primeiro ponto de quebra.
 *   · Supabase → Logs → Postgres: erros "remaining connection
 *     slots are reserved" confirmam esgotamento de pool.
 *   · Vercel → Observability: função com duração subindo junto
 *     com a fila = espera por conexão de banco.
 *
 * SE QUEBRAR NAS CONEXÕES: ative o Supavisor em modo transaction
 * (porta 6543) e pagine as listas. Só depois pense em subir plano.
 */
