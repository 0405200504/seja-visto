# Teste de ponta a ponta do funil da Cakto — MPO

**Data:** 03/08/2026 · **Branch:** `test/end-to-end-cakto-funnel` · **Commit:** `164fb04`
**Ambiente testado:** produção (`www.manualpraticodooutfit.com.br`) + servidor local com o código corrigido, ambos contra o Supabase de produção.

---

## 1. Resumo executivo

**O funil funciona.** Dos 85 cenários executados, 85 passam depois das correções. Dois defeitos foram encontrados e corrigidos, e ambos eram bloqueadores pelos seus próprios critérios.

| | |
|---|---|
| Testes executados | **85** |
| Aprovados | **85** |
| Reprovados após correção | **0** |
| Defeitos encontrados | 2 (ambos corrigidos e retestados) |
| Testes automatizados criados | 27 |
| Dados reais alterados | **nenhum** (snapshot antes = snapshot depois) |

**É seguro lançar?** O código está pronto. **Falta uma confirmação sua que eu não consigo fazer:** a tabela `webhook_events` está com **zero linhas** — nenhum webhook da Cakto chegou nunca. Ou a URL não está cadastrada no painel da Cakto, ou está apontando para o lugar errado. Enquanto isso não for confirmado, o funil está tecnicamente pronto mas operacionalmente não comprovado.

**Defeitos encontrados:**

1. 🔴 **Aprovação atrasada reativava conta reembolsada.** Um `purchase_approved` chegando depois do `refund` devolvia o acesso sozinho. Corrigido.
2. 🔴 **Cancelamento revogava o acesso na hora**, contrariando a seção 6 da sua página `/reembolso`, que promete acesso até o fim do período pago. Corrigido conforme sua decisão.

---

## 2. Mapa do fluxo

### Compra

```
Cakto (pay.cakto.com.br)
  │  purchase_approved / subscription_renewed
  ▼
POST /api/webhooks/cakto  (Vercel)
  │  1. rate limit por IP           (lib/rate-limit)
  │  2. segredo em tempo constante  (CAKTO_WEBHOOK_SECRET)
  │  3. grava webhook_events        ← trava de idempotência UNIQUE(provider,event_id)
  │  4. traduz produto              (cakto_product_map)
  │  5. TRAVA: aprovação atrasada?  ← NOVO
  ▼
Supabase
  │  auth.admin.createUser + generateLink(recovery, uso único)
  │  users_profile · user_entitlements · sales · subscriptions
  ▼
E-mail (Resend → SMTP do domínio como reserva)
  │  registrado em email_sends ← trava de duplicidade UNIQUE(chave)
  ▼
WhatsApp (UAZAPI, fila com retry) — fecha carrinho, agenda renovação
  ▼
Cliente abre o link → /nova-senha → define a senha → /dashboard
```

### Revogação

```
Cakto: refund · chargeback              Cakto: subscription_canceled
  ▼                                       ▼
webhook valida e registra               webhook valida e registra
  ▼                                       ▼
DELETE user_entitlements                 mantém o entitlement
sales.status = refunded                  subscriptions.status = cancelada
cancela fila de WhatsApp                 cancela lembretes de renovação
  ▼                                       ▼
acesso cai NA HORA                       acesso cai NA DATA DE VENCIMENTO
(sessão aberta perde na próxima          (regra da seção 6 de /reembolso)
 requisição · API paga devolve 403)
```

---

## 3. Matriz de testes

### Grupo A — autenticidade do endpoint (Fase 3)

| ID | Cenário | Esperado | Obtido | ✓ |
|---|---|---|---|---|
| A1 | POST sem segredo | 401 | 401 | ✅ |
| A2 | Segredo inválido (header e corpo) | 401, tempo constante | 401 | ✅ |
| A3 | Payload sem `data` | 400 | 400 | ✅ |
| A4 | Evento desconhecido | 200 ignorado, sem efeito | 200 `ignored` | ✅ |
| A5 | Compra aprovada sem e-mail do comprador | 400, nada liberado, alerta | 400 + alerta | ✅ |
| A6 | Evento sem identificador único | 400 | 400 | ✅ |
| A7 | Produto sem mapeamento | 200 pendente, nada liberado, registrado | 200 `pendente: sem_mapeamento` | ✅ |
| A8 | Nenhum teste do grupo criou conta | conta inexistente | nenhuma conta | ✅ |

Também verificado: JSON inválido → 400 · `GET` → 405 · `OPTIONS` → 204 (sem problema de CORS) · nenhum erro revela segredo · tempo de resposta 0,6–1,3 s nas rejeições.

### Grupo B — compra aprovada (Fases 5 e 6)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| B1 | `purchase_approved` do MPO Mensal | 200, 4,1 s | ✅ |
| B2 | Usuário criado no Supabase Auth | 1 usuário | ✅ |
| B3 | Perfil criado | 1 linha em `users_profile` | ✅ |
| B4 | `base` liberado com 30 dias | expira em 30 dias | ✅ |
| B5 | Plano correto, sem bônus de brinde | só `base` | ✅ |
| B6 | Venda no faturamento | approved, R$ 27,00 | ✅ |
| B7 | Evento marcado processado | `processed` | ✅ |
| B8 | E-mail de acesso enviado e registrado | `enviado` via resend | ✅ |
| B9 | Nenhuma senha/token no rastro gravado | nada encontrado | ✅ |
| B10 | Conta não nasce admin | `is_admin = false` | ✅ |
| B11 | Assinatura registrada ativa | mensal/ativa | ✅ |

### Grupo C — webhook duplicado (Fase 12)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| C1 | Reenvio do mesmo evento | 200 `duplicado` | ✅ |
| C2 | **5 entregas simultâneas** | todas 200 | ✅ |
| C3 | Não duplicou a conta | mesmo `user_id` | ✅ |
| C4 | Não duplicou o entitlement | contagem igual | ✅ |
| C5 | **Não esticou a validade** | `expires_at` inalterado | ✅ |
| C6 | Não duplicou a venda | contagem igual | ✅ |
| C7 | Não reenviou o e-mail | 1 registro, 1 tentativa | ✅ |

### Grupo D — pendente e recusado (Fases 10 e 11)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| D1 | `pix_gerado` (pendente) | carrinho registrado, acesso não liberado | ✅ |
| D2 | `purchase_refused` (cartão recusado) | acesso não liberado | ✅ |
| D3 | `checkout_abandonment` | sequência avaliada | ✅ |
| D4 | Não mexeram no acesso | entitlements inalterados | ✅ |
| D5 | Não lançaram venda | contagem igual | ✅ |
| D6 | Não dispararam e-mail | nenhum e-mail novo | ✅ |

### Grupo E — reembolso e chargeback (Fases 14 e 16)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| E1 | `refund` | 200 | ✅ |
| E2 | Acesso premium revogado | `base` removido | ✅ |
| E3 | **Conta NÃO apagada** | usuário e perfil mantidos | ✅ |
| E4 | Venda marcada reembolsada | `refunded` com data | ✅ |
| E5 | Reembolso repetido | 200 `duplicado`, sem efeito novo | ✅ |
| E6 | `chargeback` | 200 | ✅ |
| E7 | Após chargeback continua sem acesso | sem `base` | ✅ |

### Grupo F — eventos fora de ordem (Fase 13)

| ID | Cenário | Antes | Depois da correção | ✓ |
|---|---|---|---|---|
| F1 | **Aprovação antiga depois do reembolso** | 🔴 **acesso REATIVADO** | bloqueado, registrado, alerta | ✅ |
| F2 | Reembolso de compra inexistente | 200, tratado | 200 | ✅ |

### Grupo G — cancelamento (Fase 15)

| ID | Cenário | Antes | Depois da correção | ✓ |
|---|---|---|---|---|
| G1 | Cancelar mantém acesso até o fim do período | 🔴 **base removido na hora** | base mantido, mesma data | ✅ |
| G2 | Assinatura marcada cancelada | ok | `cancelada` com data | ✅ |
| G3 | Cancelamento não apaga a conta | ok | mantida | ✅ |

### Grupo H — renovação (Fase 17)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| H1 | `subscription_renewed` | 200 | ✅ |
| H2 | Não cria segunda conta | mesmo `user_id` | ✅ |
| H3 | **Soma 30 dias na validade existente** | +30 dias exatos | ✅ |
| H4 | Não reenvia o e-mail de primeiro acesso | 1 tentativa | ✅ |
| H5 | Lança a venda nova | +1 venda | ✅ |
| H6 | `subscription_renewal_refused` | assinatura pendente, acesso não cai na hora | ✅ |

### Grupo I — falhas parciais e retentativa (Fase 18)

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| I1 | Evento que falhou fica `failed` com motivo | registrado | ✅ |
| I2 | **Reenvio de evento falho passa pela idempotência** | 200, não tratado como duplicado | ✅ |
| I3 | Retentativa completa a liberação | `processed` + acesso liberado | ✅ |
| I4 | Retentativa não cria segunda conta | 1 usuário | ✅ |
| I5 | Retentativa não duplica o e-mail | 1 registro | ✅ |
| I6 | Falha de WhatsApp não derruba a compra | acesso liberado | ✅ |
| I7 | Tempo de resposta | 4,7 s (< 10 s) | ✅ |

### Grupo S — sessão real e revogação a quente (Fases 9 e 14)

Login de verdade, cookie do `@supabase/ssr`, contra **produção**.

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| S1 | Cliente define a própria senha | aceita | ✅ |
| S2 | Login com e-mail e senha | sessão emitida | ✅ |
| S3–S5 | Abre dashboard, método e Fit Check | 200 | ✅ |
| S6 | API paga com acesso ativo | não bloqueia | ✅ |
| S7 | Cliente comum **não** entra no `/admin` | redirecionado | ✅ |
| S9 | **Sessão aberta perde o dashboard após revogação** | → `/acesso-expirado` | ✅ |
| S10 | Sessão aberta perde o conteúdo pago | → `/acesso-expirado` | ✅ |
| S11 | **Chamada DIRETA à API paga bloqueada** | 403 `semAcesso` | ✅ |
| S12 | Logout encerra a sessão | 204 | ✅ |
| S13 | Cliente entra de novo depois do logout | nova sessão | ✅ |

### Grupo R — reteste das correções

14 cenários, todos aprovados. Destaques:

| ID | Cenário | Obtido | ✓ |
|---|---|---|---|
| R1.2 | Aprovação atrasada da mesma transação | bloqueada, acesso continua ausente | ✅ |
| R1.3 | Bloqueio registrado para auditoria | `failed` com motivo | ✅ |
| R1.4 | **Compra NOVA de quem foi reembolsado libera normalmente** | acesso concedido | ✅ |
| R2.1 | Cancelamento mantém acesso com a mesma data | preservado | ✅ |
| R2.5 | **Reembolso continua revogando na hora** | `base` removido | ✅ |
| R3.1 | Renovação soma 30 dias | +30 dias exatos | ✅ |

---

## 4. Dados criados durante o teste

Cliente de teste: `lui***@gmail.com` (`+mpoe2e`), telefone `5515*****0526` (já na lista `WHATSAPP_TEST_NUMBERS`).
Identificador: `TESTE-MPO-E2E-20260803`.

| Recurso | Criados | Removidos |
|---|---|---|
| Contas de auth | 2 | 2 |
| Perfis | 2 | 2 |
| Entitlements | 6 | 6 |
| Vendas | 8 | 8 |
| Eventos de webhook | 22 | 22 |
| Assinaturas | 3 | 3 |
| Registros de e-mail | 2 | 2 |
| Contatos/carrinhos/mensagens de WhatsApp | 9 | 9 |

**Nenhuma mensagem de WhatsApp foi enviada** (`sent_at` nulo em todas — a fila só roda no cron diário e está em modo de teste). **Dois e-mails reais** saíram para o endereço de teste.

**Conferência final:**

| Tabela | Antes | Depois |
|---|---|---|
| `webhook_events` | 0 | 0 |
| `sales` | 16 | 16 |
| `users_profile` | 9 | 9 |
| `user_entitlements` | 49 | 49 |
| `subscriptions` | 0 | 0 |
| `email_sends` | 1 | 1 |

Nenhum cliente real foi criado, alterado, apagado ou teve acesso mexido.

---

## 5. Correções realizadas

### 5.1 — Aprovação atrasada reativava conta reembolsada

**Gravidade:** crítica (bloqueia lançamento). **Impacto:** produto entregue de graça a quem recebeu o dinheiro de volta.

**Onde acontecia:** `src/app/api/webhooks/cakto/route.ts` — o caminho de `purchase_approved` não olhava para trás. Acontece em três situações reais: a Cakto reenvia um evento que deu timeout; alguém clica em "reprocessar" num evento antigo em `/admin/sistema/webhooks`; os dois eventos se cruzam na fila.

**Correção:** antes de liberar, a rota checa duas provas — a transação do payload já está marcada como `refunded` em `sales`, ou existe `refund`/`chargeback` registrado **depois** da data desta compra. Bloqueando, nada é criado, o evento vira `failed` com o motivo e você recebe alerta.

**Cuidado tomado:** compra **nova** de quem foi reembolsado antes continua liberando (teste R1.4). Bloquear ali seria negar produto a quem pagou.

**Arquivos:** `src/lib/cakto/regras.ts` (`motivoDeBloqueio`, `dataDoEvento`), `src/app/api/webhooks/cakto/route.ts` (`revogacaoPosterior` + trava no caminho da compra).

### 5.2 — Cancelamento revogava o acesso na hora

**Gravidade:** crítica (regra comercial + CDC). **Impacto:** cliente que pagasse 30 dias e cancelasse no dia 2 perdia 28 dias já pagos — contrariando a sua própria página `/reembolso`.

**Onde acontecia:** `subscription_canceled` estava dentro de `REVOKE_EVENTS`, junto de `refund` e `chargeback`.

**Correção (conforme sua decisão):** `subscription_canceled` ganhou lista própria, `CANCEL_EVENTS`. Cancelar agora só marca a assinatura como cancelada e derruba os lembretes de renovação. O acesso cai sozinho na data de vencimento, pelo `requirePaidAccess`. Reembolso e chargeback continuam cortando na hora.

**Caso de borda tratado:** se a conta tiver acesso **sem data de vencimento**, cancelar não tiraria nada e a pessoa ficaria com o MPO para sempre — nesse caso o sistema alerta você para definir a data em `/admin/alunos`.

**Nenhum texto enviado ao cliente foi alterado.**

### 5.3 — Regras extraídas para módulo testável

`src/lib/cakto/regras.ts` (novo) concentra as decisões puras; a rota faz só o I/O. `src/lib/cakto/regras.test.ts` (novo) traz 27 testes, incluindo a lista dos 14 eventos reais da Cakto — se uma refatoração futura derrubar um evento, o teste quebra.

### 5.4 — Rotina de conciliação

`scripts/conciliacao.mjs` (novo). Só lê, nunca corrige sozinho. Detecta: pagamento sem conta, pagamento sem acesso, usuário ativo após reembolso, conta ativa sem pagamento, cliente duplicado, acesso sem perfil, webhook não processado, e-mail não entregue, assinatura sem usuário, assinatura cancelada com acesso vitalício, acessos vencendo.

```bash
node scripts/conciliacao.mjs            # relatório na tela
node scripts/conciliacao.mjs --json     # para máquina (sai com código 1 se houver crítico)
```

### Como fazer rollback

```bash
git revert 164fb04     # desfaz as duas correções
# ou, para voltar só o cancelamento ao comportamento antigo:
# em src/lib/cakto/regras.ts, mover "subscription_canceled" de CANCEL_EVENTS para REVOKE_EVENTS
```

Nenhuma migração de banco foi criada — nada a desfazer no Supabase.

---

## 6. Pendências manuais

### 🔴 Cakto — bloqueia o lançamento

**Confirme que o webhook está cadastrado e para qual URL.** A tabela `webhook_events` está com zero linhas: nenhum evento chegou nunca. No painel da Cakto → Configurações → Webhooks:

1. URL deve ser exatamente `https://www.manualpraticodooutfit.com.br/api/webhooks/cakto`
   **Com `www`.** O domínio sem `www` responde 308 e depende da Cakto seguir redirecionamento em POST — não vale arriscar.
2. Segredo igual ao `CAKTO_WEBHOOK_SECRET` da Vercel (o do `.env.local` bate com o de produção, confirmado no teste).
3. Eventos marcados: `purchase_approved`, `refund`, `chargeback`, `subscription_created`, `subscription_canceled`, `subscription_renewed`, `subscription_renewal_refused`, `purchase_refused`, `initiate_checkout`, `checkout_abandonment`, `pix_gerado`, `boleto_gerado`.
4. Confirme que os 14 IDs de produto em `/admin/receita/produtos` são os IDs reais das suas ofertas. Um ID errado = compra que não libera nada.

Depois de cadastrar, faça **uma compra de teste real** (ou use o reenvio de evento da Cakto) e confira se aparece em `/admin/sistema/webhooks`.

### 🟠 Vercel — antes do lançamento

| Variável | Situação | Ação |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://manualpraticodooutfit.vercel.app` | trocar para `https://www.manualpraticodooutfit.com.br` — hoje o link de acesso do e-mail e as mensagens de WhatsApp levam o domínio da Vercel |
| `ADMIN_WHATSAPP` | **ausente** | cadastrar; sem ela todo alerta crítico só sai por e-mail |
| `NEXT_PUBLIC_RENEW_URL` | ausente | opcional |
| `CAKTO_WEBHOOK_SECRET` | só em Production | adicionar em Preview se quiser testar em deploy de preview |

### 🟠 Supabase

- **Link de acesso expira em 1 hora** (`mailer_otp_exp = 3600`). Quem comprar de manhã e abrir o e-mail à tarde vê "link inválido". Sugestão: subir para 24 h em Authentication → Email. O caminho de recuperação existe (`/recuperar-senha`), mas gera atrito.
- `Site URL` também aponta para `manualpraticodooutfit.vercel.app`. A lista de redirects já aceita os dois domínios.
- Cadastro aberto (`disable_signup = false`): qualquer um cria conta. Não é falha — quem se cadastra sem pagar cai em `/acesso-expirado` (comprovado no teste). Só saiba que existe.

### 🟠 E-mail e DNS

| Item | Situação |
|---|---|
| SPF | `v=spf1 include:_spf.google.com ~all` — **não inclui o Resend** |
| DKIM (Google) | ✅ presente |
| DKIM (Resend) | ✅ presente — é o que faz o DMARC passar |
| MX | ✅ `smtp.google.com` |
| DMARC | `p=none` (só monitora) — considere `p=quarantine` depois de acompanhar |
| Resend | chave é **send-only**, não dá para ler o log de entrega por API — confira no painel |

**Inconsistência:** a página `/reembolso` manda escrever para `equipe@manualpraticodooutfit.com.br`, mas o endereço oficial em todo o resto do sistema é `suporte@`. Confirme se `equipe@` existe; se não, corrija a página.

### 🟡 WhatsApp

As três automações estão ligadas **com modo de teste ativo** — só `5515*****0526` recebe. Antes do lançamento, decida quando desligar `WHATSAPP_AUTOMATION_TEST_MODE`. O cron roda 1×/dia (limite do plano Hobby); no Pro dá para baixar para 15 min.

---

## 7. Checklist final

### 🔴 Bloqueia o lançamento

- [ ] Confirmar que o webhook está cadastrado na Cakto, na URL com `www`, e ver o primeiro evento chegar em `/admin/sistema/webhooks`
- [ ] Confirmar que os 14 IDs de produto em `/admin/receita/produtos` são os reais
- [ ] Fazer merge desta branch (as duas correções estão nela, não em `main`)

### 🟠 Obrigatório antes do lançamento

- [ ] `NEXT_PUBLIC_SITE_URL` → domínio próprio
- [ ] Cadastrar `ADMIN_WHATSAPP` na Vercel
- [ ] Aumentar a validade do link de acesso para 24 h no Supabase
- [ ] Revisar as 7 contas com acesso ativo sem pagamento correspondente (`node scripts/conciliacao.mjs`) — são resquícios de desenvolvimento e uma liberação manual
- [ ] Confirmar o endereço `equipe@` da página de reembolso

### 🔵 Recomendado

- [ ] Incluir o Resend no SPF
- [ ] DMARC para `p=quarantine` depois de acompanhar um tempo
- [ ] `export const maxDuration` no webhook (a compra leva ~4,5 s; margem confortável, mas explícito é melhor)
- [ ] Plano Pro da Vercel para o cron rodar a cada 15 min em vez de 1×/dia
- [ ] Marcar `is_test = true` nas vendas de teste futuras (hoje o webhook não marca)

### ✅ Aprovado e comprovado

- Webhook autentica, rejeita falsificação e não vaza segredo
- Idempotência por `event_id`, inclusive com 5 entregas simultâneas
- Compra aprovada cria conta, libera o plano certo e manda o e-mail
- Duplicado não duplica conta, venda, validade nem e-mail
- Pendente e recusado não liberam nada
- Reembolso e chargeback revogam na hora, sem apagar a conta
- Sessão aberta perde o acesso na revogação; API paga devolve 403
- Evento antigo não reativa conta reembolsada *(corrigido)*
- Cancelamento respeita o período pago *(corrigido)*
- Renovação soma na validade, não cria conta nem reenvia primeiro acesso
- Evento falho é registrado, reprocessável e completa na retentativa
- Nenhuma senha, token ou segredo em log ou banco

---

## 8. Como repetir este teste

Antes de cada lançamento importante:

```bash
git checkout test/end-to-end-cakto-funnel   # ou main, depois do merge

# 1. estado anterior
node auditoria/e2e/snapshot.mjs antes

# 2. bateria (58 cenários) — contra produção ou local
node auditoria/e2e/bateria.mjs
E2E_BASE=http://localhost:3000 node auditoria/e2e/bateria.mjs   # com npm run dev aberto

# 3. sessão real e revogação a quente (13 cenários)
node auditoria/e2e/sessao.mjs

# 4. reteste dos defeitos já corrigidos (14 cenários)
node auditoria/e2e/reteste.mjs

# 5. limpeza — sempre confira a simulação antes
node auditoria/e2e/limpeza.mjs
node auditoria/e2e/limpeza.mjs --apagar

# 6. conferência: antes tem que ser igual a depois
node auditoria/e2e/snapshot.mjs depois

# 7. conciliação
node scripts/conciliacao.mjs

# 8. testes automatizados
npm run check:all
```

**Antes de rodar:** troque `MARCA` em `auditoria/e2e/lib.mjs` para a data do dia. É o que permite à limpeza achar 100% do que foi criado.

**Cuidado:** a bateria escreve no banco de produção (não existe Supabase separado para preview). Ela só toca linhas do e-mail de teste e da `MARCA`, e a limpeza remove tudo — mas confira o snapshot no fim.

---

## 9. Respostas diretas

| # | Pergunta | Resposta |
|---|---|---|
| 1 | O funil está funcionando completamente? | **Sim no código, comprovado em 85 testes.** Falta confirmar que a Cakto está entregando os webhooks. |
| 2 | Os webhooks da Cakto estão funcionando? | **O endpoint sim** — autentica, processa, rejeita falso. **A entrega, não sei:** zero eventos recebidos até hoje. Confirme o cadastro no painel. |
| 3 | O pagamento aprovado está sendo reconhecido? | **Sim.** `purchase_approved` e `subscription_renewed` reconhecidos, valor conferido contra o preço cadastrado. |
| 4 | A conta é criada corretamente? | **Sim.** Uma única conta, sem senha em texto puro, sem privilégio de admin, com link de acesso de uso único. |
| 5 | O plano é liberado corretamente? | **Sim.** Só o que foi comprado, com a validade certa (30/365 dias). Bônus avulso não entrega mais o MPO junto. |
| 6 | O e-mail chega corretamente? | **Sai corretamente** — remetente do domínio, DKIM válido, registrado em `email_sends`, sem duplicar. A confirmação de entrega tem que ser vista no painel do Resend (a chave é send-only). |
| 7 | O WhatsApp chega corretamente? | **Está enfileirando certo, em modo de teste.** Nenhuma mensagem chegou a sair no teste (`sent_at` nulo). Falha de WhatsApp não derruba a compra. |
| 8 | O cliente consegue fazer login? | **Sim.** Login, sessão, conteúdo pago, API paga, logout e novo login — todos comprovados em produção. |
| 9 | Webhooks duplicados são tratados? | **Sim.** Inclusive 5 entregas simultâneas: uma conta, uma venda, um e-mail, validade intacta. |
| 10 | Reembolso revoga o acesso? | **Sim, na hora.** Sessão aberta perde na requisição seguinte; API paga devolve 403. A conta não é apagada. |
| 11 | Cancelamento revoga no momento correto? | **Agora sim.** Acesso até o fim do período pago, como a sua página promete. **Estava errado antes** — revogava na hora. |
| 12 | Chargeback revoga o acesso? | **Sim**, igual ao reembolso, e não é reativável por evento antigo. |
| 13 | Existem clientes ativos sem pagamento? | **Sim, 7** — resquícios de desenvolvimento e uma liberação manual, todos com acesso vitalício. Revise antes de lançar: `node scripts/conciliacao.mjs`. |
| 14 | Existem pagamentos aprovados sem conta? | **Não.** Zero divergências. |
| 15 | Existe risco que bloqueie o lançamento? | **Um só, e não é de código:** confirmar que a Cakto está entregando os webhooks. Os dois defeitos de código foram corrigidos e retestados. |
