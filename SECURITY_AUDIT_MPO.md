# Auditoria de Segurança Pré-Lançamento — MPO (Manual Prático do Outfit)

**Branch:** `security/final-audit-mpo` (nenhuma alteração feita na `main`)
**Data:** 2026-08-03
**Escopo:** código-fonte completo, banco de dados/RLS ao vivo (via API de gerenciamento do Supabase), domínio de produção, dependências.

---

## 1. Resumo executivo

O MPO chegou nesta auditoria com uma base de segurança bem acima da média para um SaaS em fase de lançamento — auditorias anteriores já haviam endurecido RLS, isolamento de segredos, idempotência de webhook e tetos de custo de IA. Esta rodada:

- Confirmou, com evidência direta no banco (não só leitura de código), que **todas as 34 tabelas** do schema público têm RLS ativado e políticas corretas baseadas em `auth.uid()`.
- Rodou um **teste automatizado real de isolamento entre contas** (`auditoria/07-teste-isolamento-contas.mjs`): 24 tentativas de uma conta sem assinatura acessar/alterar/apagar dado de outra conta, acessar tabela administrativa, se auto-promover a admin, ou consumir conteúdo pago sem pagar. **Todas as 24 foram bloqueadas.**
- Encontrou e **corrigiu** uma lacuna real: comentários, curtidas e fotos da comunidade eram legíveis por qualquer conta autenticada (mesmo sem assinatura), contornando a checagem de assinatura que só existia na página do app.
- Encontrou e **corrigiu** dependências com CVEs de severidade HIGH (Next.js desatualizado).
- Encontrou **um bloqueador real de lançamento que não pude corrigir sozinho**: o projeto Supabase não tem nenhum backup restaurável hoje (PITR desligado, zero backups) — depende de upgrade de plano, uma decisão de custo que é sua.

**Pode lançar?** Ainda não — falta resolver o item de backup (ver checklist). Fora esse ponto, não encontrei nenhum outro critério da lista de bloqueio que ainda esteja aberto.

**Contagem de achados:** 1 Crítico · 2 Altos (ambos corrigidos nesta auditoria) · 2 Médios · 3 Baixos.

---

## 2. Arquitetura encontrada

- **Frontend/Backend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 — um único codebase full-stack, hospedado na Vercel.
- **Banco/Auth/Storage:** Supabase (Postgres + Auth + Storage), projeto único (sem staging separado), região `us-west-2`.
- **Pagamento:** Cakto, via webhook (`/api/webhooks/cakto`).
- **IA:** OpenAI (`gpt-4o-mini`/família `gpt-5.x`), chamada direta por `fetch` no backend — nunca no cliente.
- **E-mail:** SMTP do domínio próprio (principal) + Resend (reserva, ainda sem domínio verificado).
- **WhatsApp:** UAZAPI, automações de carrinho abandonado e renovação — **desligadas em produção** por feature flag (`WHATSAPP_*_ENABLED=false`).
- **CI:** GitHub Actions — gitleaks no histórico completo, lint + testes, e scan de segredo no bundle real do navegador.

Fluxo de dados completo em `DATA_FLOW_AND_PRIVACY_MAP.md`.

---

## 3. Vulnerabilidades

### AUD-01 — Ausência de backup restaurável do banco
- **Gravidade:** Crítico
- **Componente:** Infraestrutura (Supabase)
- **Descrição:** consulta direta à API de gerenciamento do Supabase (`GET /v1/projects/{ref}/database/backups`) retornou `pitr_enabled: false` e `backups: []`. Não existe nenhum ponto de restauração hoje.
- **Impacto:** qualquer exclusão acidental, bug de migration, ou corrupção de dado é **permanente e irreversível**.
- **Evidência:** resposta da API salva em `/tmp/` durante a auditoria (não commitada — é só metadado de configuração, mas mantive fora do repo por padrão).
- **Correção recomendada:** upgrade do projeto Supabase para o plano Pro (ou add-on de backup), habilitar PITR.
- **Correção executada:** nenhuma — depende de decisão de custo sua. Documentado o procedimento completo em `BACKUP_AND_RECOVERY_PLAN.md`.
- **Teste realizado:** consulta à API de backups.
- **Resultado:** confirmado o gap.
- **Risco residual:** alto até o upgrade acontecer.

### AUD-02 — RLS permissiva na comunidade (comentários, reações e fotos)
- **Gravidade:** Alto
- **Componente:** Supabase RLS — tabelas `fit_comments`, `fit_reactions`, bucket de Storage `fits`
- **Arquivo:** migrations `00018_comunidade.sql` (origem) → corrigido em `00025_endurece_rls_comunidade.sql`
- **Descrição:** as políticas de leitura usavam `using (true)` para qualquer conta autenticada, e a policy de Storage liberava qualquer arquivo do bucket para quem tivesse `tem_acesso_base()`, sem checar se o fit correspondente estava aprovado. A página do app filtra por assinatura (`requirePaidAccess`), mas isso é só a fachada — a API do Supabase podia ser chamada diretamente.
- **Impacto:** conta gratuita/cancelada conseguia ler todos os comentários e curtidas da comunidade, e um assinante ativo conseguia ler foto de fit ainda pendente de moderação de outra pessoa.
- **Forma de exploração:** chamada direta à REST API do Supabase (`/rest/v1/fit_comments?select=*`) usando a anon key (pública) + sessão de uma conta qualquer.
- **Evidência:** política antiga capturada via `pg_policies` no início da auditoria; nova política confirmada via a mesma consulta depois da correção.
- **Correção recomendada = correção executada:** políticas reescritas para exigir dono da linha, admin, ou `tem_acesso_base()` (comentários/reações), e para exigir `status = 'approved'` no Storage quando o acesso não é do dono nem de admin.
- **Teste realizado:** teste automatizado de isolamento (`auditoria/07-teste-isolamento-contas.mjs`) — casos "ler comentários da comunidade sem assinatura", "ler curtidas/salvamentos sem assinatura", "gerar URL da foto pendente da Conta A", "ler fit ainda pendente de moderação".
- **Resultado:** todos bloqueados após a correção.
- **Risco residual:** baixo.

### AUD-03 — Next.js com CVEs de severidade HIGH
- **Gravidade:** Alto
- **Componente:** dependência `next` (16.2.10)
- **Descrição:** `npm audit` reportou múltiplas CVEs HIGH corrigidas na 16.2.12 — bypass de middleware/proxy em App Router, SSRF e DoS em Server Actions, exposição de endpoints internos de Server Function.
- **Impacto real avaliado:** a autorização da aplicação não depende só do middleware — cada página protegida revalida a sessão/assinatura no Server Component (`requireUser`/`requirePaidAccess`/`requireAdmin`), então um bypass do middleware não abriria conteúdo protegido sozinho. Ainda assim, é uma exposição conhecida e publicada.
- **Correção executada:** upgrade para 16.2.12 (última versão estável disponível — a correção completa de uma das CVEs só existe numa preview/canary 16.3.0, que não é seguro colocar em produção agora).
- **Teste realizado:** build de produção, 133 testes automatizados, lint, e `check:secrets` — todos passaram depois do bump.
- **Resultado:** aplicado e validado.
- **Risco residual:** baixo; acompanhar o lançamento estável do Next.js 16.3.0 para fechar o restante.

### AUD-04 — DMARC em modo monitoramento (`p=none`)
- **Gravidade:** Médio
- **Componente:** DNS do domínio `manualpraticodooutfit.com.br`
- **Descrição:** o registro `_dmarc` existe (`v=DMARC1; p=none;`), mas não aplica nenhuma ação contra e-mail falsificado usando o domínio — só monitora.
- **Impacto:** alguém pode enviar e-mail de phishing "de" `suporte@manualpraticodooutfit.com.br` e a maioria dos provedores de e-mail não vai rejeitar/quarentenar automaticamente.
- **Evidência:** `dig _dmarc.manualpraticodooutfit.com.br TXT`.
- **Correção recomendada:** depois de confirmar que todos os remetentes legítimos (Google Workspace + o SMTP usado) estão alinhados (SPF/DKIM passando), subir para `p=quarantine` e depois `p=reject`. Isso é uma mudança de DNS que só você deve aplicar (fora do escopo do que posso alterar no código).
- **Correção executada:** nenhuma (depende de acesso ao DNS).
- **Risco residual:** médio até a mudança de política.

### AUD-05 — SPF não cobre o Resend
- **Gravidade:** Médio
- **Componente:** DNS / e-mail
- **Descrição:** o SPF atual é `v=spf1 include:_spf.google.com ~all` — só autoriza o Google Workspace. O código já usa o Resend como reserva se o SMTP falhar, mas o domínio do Resend ainda não está verificado (pendência já conhecida antes desta auditoria).
- **Impacto:** enquanto o Resend não estiver no SPF/DKIM do domínio, e-mails enviados por ele terão pior entregabilidade (podem cair em spam) e falharão alinhamento DMARC.
- **Correção recomendada:** ao verificar o domínio no Resend, adicionar o `include:` que o próprio painel do Resend fornece ao SPF, e publicar o DKIM que o Resend gerar.
- **Correção executada:** nenhuma (depende de configuração no painel do Resend + DNS).

### AUD-06 — Sem processo de auto-exclusão de conta pelo usuário
- **Gravidade:** Baixo
- **Componente:** produto/fluxo de conta
- **Descrição:** a exclusão de conta hoje depende do admin agir manualmente; não há botão de "excluir minha conta" na interface do aluno.
- **Impacto:** direito de exclusão (LGPD) tecnicamente atendível, mas sem auto-atendimento — aumenta o tempo de resposta a um pedido do titular.
- **Correção recomendada:** adicionar um fluxo de auto-exclusão (com confirmação) em `/perfil`, chamando `auth.admin.deleteUser` no backend — o cascade de FKs já cuida do banco; falta cobrir os arquivos do Storage (ver AUD-07).

### AUD-07 — Fotos do Storage não são limpas ao excluir a conta
- **Gravidade:** Baixo
- **Componente:** Supabase Storage (bucket `fits`)
- **Descrição:** o `on delete cascade` do Postgres apaga a linha em `community_fits`, mas o arquivo físico no bucket não é removido automaticamente.
- **Correção recomendada:** antes de excluir a conta, listar e remover os objetos em `fits/{user_id}/` via `storage.from("fits").remove(...)` usando o client admin.

### AUD-08 — CSP ausente
- **Gravidade:** Baixo (decisão deliberada, documentada no próprio código)
- **Componente:** `next.config.ts`
- **Descrição:** o projeto já tem HSTS, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy, mas nenhuma Content-Security-Policy — o comentário no código explica que uma CSP malfeita quebra o Next.js em produção e que deve ser testada em staging antes.
- **Correção recomendada:** montar uma CSP em modo `report-only` primeiro, validar por um tempo, só então aplicar de vez.

---

## 4. Correções realizadas (nesta branch)

1. **Migration `00025_endurece_rls_comunidade.sql`** — aplicada e verificada ao vivo no projeto Supabase: RLS de `fit_comments`, `fit_reactions` e do bucket `fits` agora exige dono, admin, ou assinatura ativa (e fit aprovado, no caso do Storage). Ver AUD-02.
2. **`package.json`** — Next.js e `eslint-config-next` de `16.2.10` para `16.2.12`. Ver AUD-03. Build, lint, 133 testes e scan de segredo revalidados depois.
3. **`auditoria/07-teste-isolamento-contas.mjs`** (novo) — script de teste automatizado de isolamento entre contas, autolimpável (cria e apaga as próprias contas de teste), cobrindo 24 cenários de tentativa de acesso indevido. Pode ser rodado de novo a qualquer momento com `node auditoria/07-teste-isolamento-contas.mjs`.

Commit: `1759c3d` na branch `security/final-audit-mpo` (mais o script de isolamento, a commitar).

## 5. Correções pendentes (dependem de você ou de terceiro)

| Item | Depende de | Referência |
|---|---|---|
| Backup/PITR do Supabase | Upgrade de plano (custo) | AUD-01, `BACKUP_AND_RECOVERY_PLAN.md` |
| DMARC `p=quarantine`/`reject` | Acesso ao DNS do domínio | AUD-04 |
| SPF/DKIM do Resend | Verificar domínio no painel do Resend + DNS | AUD-05 |
| Auto-exclusão de conta | Decisão de produto (posso implementar se você aprovar) | AUD-06 |
| Limpeza de Storage na exclusão | Idem | AUD-07 |
| CSP | Testar em ambiente controlado antes de produção | AUD-08 |
| Validação jurídica da LGPD | Advogado | `DATA_FLOW_AND_PRIVACY_MAP.md`, seção 5 |
| Confirmar retenção de dados na OpenAI | Configuração no painel da OpenAI (checagem simples) | — |

## 6. Checklist de lançamento

**Bloqueia o lançamento:**
- [ ] Backup restaurável do banco (AUD-01)

**Obrigatório antes do lançamento:**
- [ ] Validação jurídica da Política de Privacidade/Termos (LGPD, direito do consumidor)

**Recomendado logo após o lançamento:**
- [ ] DMARC para `quarantine`/`reject` (AUD-04)
- [ ] SPF/DKIM do Resend (AUD-05)
- [ ] Auto-exclusão de conta + limpeza de Storage (AUD-06, AUD-07)

**Melhoria contínua:**
- [ ] CSP em `report-only` → produção (AUD-08)
- [ ] Rodar `auditoria/07-teste-isolamento-contas.mjs` a cada mudança relevante de RLS
- [ ] Acompanhar o lançamento estável do Next.js 16.3.0

## 7. Evidências

- RLS ao vivo: 34/34 tabelas com `relrowsecurity = true` (consulta a `pg_class`/`pg_policy` via API de gerenciamento).
- 17 funções `SECURITY DEFINER`, todas com `search_path=public` fixado.
- Trigger `prevent_admin_escalation` confirmado ativo.
- Teste de isolamento: 24/24 tentativas bloqueadas (`auditoria/07-teste-isolamento-contas.mjs`).
- `npm audit`, build, lint e 133 testes rodados após o upgrade do Next.js — todos verdes.
- Histórico completo do Git varrido por segredo — nenhum encontrado.
- Headers de produção conferidos via `curl -I` em `/`, `/login`, `/admin`, `/perfil`, `/fit-check` e num POST a `/api/webhooks/cakto`.
- DNS conferido via `dig` (A, CNAME, SPF, DMARC, DKIM).
- Backup conferido via API de gerenciamento do Supabase (`/database/backups`).

## 8. Procedimento de reteste

- **RLS da comunidade:** rodar `node auditoria/07-teste-isolamento-contas.mjs` — deve reportar "0 vazamento(s)".
- **Dependências:** rodar `npm audit` periodicamente; reavaliar quando o Next.js 16.3.0 sair da preview.
- **Backup:** depois do upgrade de plano, seguir o procedimento de teste de restauração em `BACKUP_AND_RECOVERY_PLAN.md`.
- **DNS/e-mail:** depois de qualquer mudança de SPF/DKIM/DMARC, usar uma ferramenta de verificação de e-mail (ex.: enviar para um endereço de teste e inspecionar os cabeçalhos `Authentication-Results`).
