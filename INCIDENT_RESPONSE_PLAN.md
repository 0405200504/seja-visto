# Plano de Resposta a Incidentes — MPO

Contatos operacionais de referência: `ADMIN_EMAIL` / `ADMIN_WHATSAPP` (variáveis de ambiente — já recebem alerta automático via `alertaAdmin()` para vários dos cenários abaixo).

Para cada cenário: **Detectar → Conter → Revogar → Preservar evidência → Identificar afetados → Restaurar → Comunicar → Registrar → Prevenir**.

## 1. Chave/segredo exposto (OpenAI, Supabase, Cakto, UAZAPI, SMTP)

1. **Detectar:** alerta do `check:secrets` no CI, do gitleaks, ou aviso de terceiro (GitHub secret scanning, provedor).
2. **Conter:** revogar a chave imediatamente no painel do fornecedor (OpenAI → API keys; Supabase → Project Settings → API → gerar nova `service_role`; Cakto/UAZAPI → regenerar o segredo do webhook).
3. **Revogar:** gerar a chave nova ANTES de remover a antiga, se o fornecedor permitir rotação sem downtime.
4. **Atualizar em todos os lugares:** Vercel (Production, Preview e Development — as três, se aplicável) → redeploy. Conferir `.env.local` da própria máquina.
5. **Se apareceu no Git:** apagar do commit atual não resolve — o segredo continua no histórico. Rotacionar é obrigatório mesmo assim; depois, avaliar reescrever o histórico (`git filter-repo` ou BFG Repo-Cleaner) só se o repositório for público ou tiver colaboradores externos — em repositório privado com poucos colaboradores de confiança, rotacionar a chave já neutraliza o vazamento.
6. **Evidência:** guardar (mascarado) em qual arquivo/commit apareceu, quando foi detectado, quando foi rotacionado.
7. **Comunicar:** só necessário a clientes se a chave permitiu acesso a dado pessoal (ex.: `service_role` do Supabase). Chave da OpenAI/Cakto isolada, sem mais nenhum indício de acesso indevido, normalmente não exige comunicação a clientes — mas describe o incidente internamente.

## 2. Conta de cliente invadida

1. **Detectar:** cliente reporta, ou `auth_attempts` mostra padrão anômalo (muitos logins falhos seguidos de um sucesso de IP incomum).
2. **Conter:** `supabase.auth.admin.signOut(user_id, 'global')` para derrubar todas as sessões ativas; forçar reset de senha.
3. **Revogar:** invalidar links de recuperação pendentes daquela conta.
4. **Preservar evidência:** exportar (sem expor em log público) os `auth_attempts` relacionados àquele e-mail/IP.
5. **Identificar impacto:** conferir se a sessão comprometida alterou `user_entitlements`, e-mail de contato, ou dados de perfil.
6. **Restaurar:** reverter qualquer alteração indevida feita durante a janela comprometida.
7. **Comunicar:** avisar o cliente, orientando troca de senha em outros serviços se ele reutiliza a mesma.

## 3. Vazamento de fotos (comunidade ou Fit Check)

1. **Detectar:** cliente reporta ver foto de outra pessoa, ou auditoria interna encontra objeto acessível indevidamente no bucket.
2. **Conter:** tornar o bucket privado imediatamente (`public: false`) se algum dia for alterado por engano; revisar/reforçar a policy de `storage.objects` (ver correção aplicada nesta auditoria, migration `00025`).
3. **Revogar:** invalidar URLs assinadas ativas não é possível retroativamente (elas expiram sozinhas em até 1h, por configuração de `signFitImageUrl`) — o controle real é a policy de acesso, não a URL.
4. **Identificar afetados:** localizar quais `image_path` foram expostos e quais contas os visualizaram (não há log de leitura de Storage por padrão — considerar habilitar `pgAudit`/logs de Storage se o incidente se repetir).
5. **Comunicar:** aos donos das fotos expostas, conforme gravidade.
6. **Prevenir:** transformar o incidente num teste automatizado permanente (ver `auditoria/07-teste-isolamento-contas.mjs`, já criado nesta auditoria).

## 4. Vazamento entre contas (dado de um aluno acessível por outro)

Mesmos passos do item 3, aplicados à tabela específica. Sempre: **corrigir a RLS primeiro** (é a fronteira real), depois avaliar se algum dado já foi de fato lido (não é possível saber com certeza sem log de acesso a nível de linha — outro motivo para considerar logging de acesso mais granular no Supabase, se o orçamento permitir).

## 5. Banco de dados exposto / comprometido

1. Rotacionar `SUPABASE_SERVICE_ROLE_KEY` e a senha do Postgres (Project Settings → Database).
2. Revisar `pg_policies` e `pg_proc` (funções `SECURITY DEFINER`) em busca de alteração não autorizada — comparar com as migrations versionadas no Git.
3. Se houver suspeita de acesso direto ao Postgres (não via API): trocar a senha do banco derruba conexões antigas.

## 6. Ataque ao domínio (DNS sequestrado, subdomain takeover)

1. Confirmar no registrador se os registros DNS batem com o esperado (ver `DATA_FLOW_AND_PRIVACY_MAP.md`/auditoria de DNS já feita).
2. Se houver CNAME apontando para um serviço não mais existente, removê-lo imediatamente — é a porta de entrada clássica do subdomain takeover.
3. Habilitar trava de transferência de domínio (registry lock) no registrador, se ainda não estiver.

## 7. Dependência comprometida (supply chain)

1. `npm audit` já roda; se um pacote for reportado maliciosamente comprometido (alerta do GitHub/npm), remover a versão do lockfile e fixar numa versão anterior conhecida boa até a correção sair.
2. Revisar se algum script de instalação (`postinstall`) rodou no ambiente de build da Vercel — checar logs de build daquele deploy específico.

## 8. Cobrança incorreta / consumo anormal da IA

Já existe alerta automático (`alertaAdmin`) para: teto diário/mensal do Fit Check atingido, 80% do teto mensal, teto global de 300 req/min. Ao receber o alerta:
1. Conferir `/admin/sistema/ia` para ver o gasto real.
2. Se for abuso (não bug): usar o kill switch (`ai_enabled = false`) enquanto investiga.
3. Se for bug (loop de retry no cliente): identificar e corrigir antes de reativar.

## 9. Exclusão acidental de dados

1. Parar qualquer processo em andamento que possa estar causando a exclusão em cascata.
2. Seguir o `BACKUP_AND_RECOVERY_PLAN.md` — **hoje isso é um bloqueador de lançamento, porque não há backup configurado (PITR desligado, nenhum backup físico disponível no projeto Supabase — confirmado via API de gerenciamento nesta auditoria).**

## 10. Webhook comprometido (segredo da Cakto ou UAZAPI vazado)

1. Rotacionar o segredo do lado do fornecedor e da variável de ambiente na Vercel.
2. Verificar `webhook_events` por eventos processados fora do padrão esperado no período suspeito.
3. Como o segredo é comparado em tempo constante e nunca fica em querystring, o vetor mais provável é vazamento pela própria variável de ambiente — tratar como o cenário 1.

## Quando acionar suporte jurídico / avaliar comunicação à ANPD

- Qualquer incidente do tipo 3 ou 4 (vazamento de foto ou dado entre contas) que tenha efetivamente exposto dado de mais de uma pessoa.
- Qualquer incidente do tipo 1 envolvendo a chave `service_role` do Supabase (acesso irrestrito ao banco).
- Sempre que houver dúvida sobre se o incidente configura "incidente de segurança" nos termos do Art. 48 da LGPD — a decisão de notificar a ANPD e os titulares é jurídica, não técnica.
