# Mapa de Dados e Privacidade — MPO (Manual Prático do Outfit)

> Documento técnico, parte da auditoria de segurança pré-lançamento (branch `security/final-audit-mpo`). Não substitui a análise de um advogado especializado em LGPD — os pontos que exigem essa validação estão marcados explicitamente.

## 1. Inventário de dados pessoais

| Dado | Onde fica | Coletado quando | Finalidade | Base legal provável* | Quem acessa |
|---|---|---|---|---|---|
| Nome | `users_profile.name` | Cadastro | Identificação, personalização | Execução de contrato | Próprio usuário, admin |
| E-mail | `auth.users`, `users_profile.email` | Cadastro / compra na Cakto | Login, envio de acesso e avisos | Execução de contrato | Próprio usuário, admin, Supabase Auth, provedor de e-mail (SMTP/Resend) |
| Telefone | `whatsapp_contacts.phone` | Compra na Cakto (quando informado) | Recuperação de carrinho, aviso de renovação | Legítimo interesse / execução de contrato | Admin, UAZAPI (provedor de WhatsApp) |
| Senha | `auth.users` (hash, gerido pelo Supabase Auth — nunca em texto puro em nenhuma tabela própria) | Cadastro | Autenticação | Execução de contrato | Ninguém (hash irreversível) |
| Medidas/biotipo/preferências de estilo | respostas do onboarding, embutidas em `users_profile` / lógica de estilo | Onboarding | Recomendação personalizada | Execução de contrato | Próprio usuário, admin |
| Fotos de outfit (Fit Check) | enviadas como base64 para a OpenAI; miniatura (`thumb`) salva em `fit_check_messages` | Uso do Fit Check | Análise de outfit por IA | Execução de contrato | OpenAI (processamento), próprio usuário |
| Fotos da comunidade | bucket privado `fits` no Supabase Storage + `community_fits.image_path` | Upload voluntário na comunidade | Feature social (moderada) | Consentimento / execução de contrato | Próprio usuário, admin (moderação), outros assinantes ativos (só fits aprovados, após a correção desta auditoria) |
| Conversas com a IA (texto) | `fit_check_messages.content`, `fit_check_conversations` | Uso do Fit Check | Histórico de análises | Execução de contrato | OpenAI (só a chamada, não retenção nossa configurada nele), próprio usuário, admin |
| Progresso no Método / guarda-roupa / plano de ação | `user_progress`, `user_wardrobe`, `action_plan_progress`, `user_capsule` | Uso da plataforma | Acompanhar evolução do aluno | Execução de contrato | Próprio usuário, admin |
| Dados de pagamento (valor, status, taxa) | `sales` | Webhook da Cakto | Faturamento, conciliação | Execução de contrato / obrigação legal (fiscal) | Admin |
| Dados de cartão/PIX propriamente ditos | **nunca chegam ao MPO** — ficam só na Cakto | — | — | — | Cakto (gateway) |
| Assinatura/entitlement | `user_entitlements`, `subscriptions` | Compra/renovação/cancelamento | Controlar acesso pago | Execução de contrato | Próprio usuário, admin |
| IP e user-agent | `auth_attempts`, `rate_limits`, logs da Vercel | Login, cadastro, reset de senha | Segurança (rate limit, anti-fraude) | Legítimo interesse | Admin (via função `is_admin()`), ninguém mais — RLS restringe a leitura só a admin |
| Cliques em link de tracking | `tracking_link_clicks` (referer, user-agent) | Clique em link de campanha | Métricas de marketing | Legítimo interesse | Admin |
| Log de auditoria administrativa | `audit_log` | Ação de admin no painel | Rastreabilidade, responsabilização | Legítimo interesse / obrigação legal | Admin |

*A base legal exata (execução de contrato vs. legítimo interesse vs. consentimento) depende da redação final dos Termos de Uso e da Política de Privacidade — **precisa de validação jurídica**, marcado abaixo.

## 2. Fornecedores que recebem dado pessoal

| Fornecedor | O que recebe | Finalidade | Retenção lá | Observação |
|---|---|---|---|---|
| Supabase (EUA, região `us-west-2`) | Todo o banco, auth, storage | Infraestrutura principal | Até exclusão | Verificar se o Supabase tem DPA (Data Processing Agreement) assinável — item para o advogado |
| Vercel | Requisições HTTP, logs de função | Hospedagem | Padrão da Vercel (curto prazo) | — |
| OpenAI | Foto (base64) + texto da mensagem + resumo de conteúdo da plataforma (sem dado de outros usuários) | Geração da análise de outfit | Governada pela política de retenção da OpenAI para API (não fine-tuning por padrão) | Confirmar no painel da OpenAI se a organização está com "zero data retention" ou a retenção padrão de 30 dias — item técnico simples de checar |
| Cakto | Nome, e-mail, telefone, valor da compra | Processamento de pagamento | Gerida pela Cakto | Fornecedor de pagamento — política própria |
| UAZAPI | Telefone, nome, mensagens de template | Envio de WhatsApp (hoje desligado em produção) | Gerida pela UAZAPI | Automação está com feature-flag desligada; ver `WHATSAPP_*_ENABLED` |
| Resend / SMTP do domínio | E-mail, nome | Envio de e-mail transacional | Gerida pelo provedor | Resend ainda não tem o domínio verificado (pendente conhecido) |

## 3. Retenção e exclusão

- **Hoje não existe uma rotina automática de expurgo** de dados após cancelamento/exclusão de conta — o que existe é o `on delete cascade` nas foreign keys apontando para `auth.users`, ou seja: **se a conta for excluída de `auth.users`, todos os dados relacionados (perfil, guarda-roupa, conversas de IA, fits, favoritos, progresso, entitlements) são apagados em cascata automaticamente.** Isso resolve o "direito ao esquecimento" tecnicamente, mas falta um **fluxo de auto-atendimento** para o próprio usuário pedir a exclusão pela interface (hoje depende do admin fazer isso manualmente via painel ou Supabase).
- Fotos no Storage (`fits`) **não são cobertas pelo cascade do Postgres** — são arquivos no Storage, não linhas de tabela. Ao excluir a conta, os objetos do bucket `fits` na pasta `{user_id}/` ficam órfãos (o registro em `community_fits` some, mas o arquivo físico permanece no bucket). **Recomendação:** antes de excluir uma conta, rodar uma rotina que também apaga os objetos do Storage na pasta do usuário.
- Não há política de retenção documentada para logs da Vercel, `auth_attempts` ou `rate_limits` — dados operacionais de baixo risco, mas vale definir um prazo (ex.: 90 dias) e documentar.

## 4. Dados que talvez não precisem ser coletados

- `auth_attempts` e `whatsapp_contacts` armazenam IP/telefone mesmo de quem nunca vira cliente (ex.: alguém que só inicia um checkout e abandona) — isso é necessário para a automação de recuperação de carrinho e para segurança, então tem finalidade legítima, mas deve estar claro na Política de Privacidade que isso acontece **mesmo para quem não finaliza a compra**.
- `fit_check_messages.thumb` guarda uma miniatura da foto enviada à IA — confirmar se esse armazenamento é necessário para a experiência (histórico de conversa) ou se pode ter TTL mais curto, já que é a mesma classe de dado sensível (foto da pessoa) que o bucket `fits`.

## 5. Itens que precisam de validação jurídica (marque para o advogado)

- [ ] Confirmar a base legal declarada para cada tratamento na tabela acima.
- [ ] Redigir/atualizar Política de Privacidade cobrindo: uso de IA (OpenAI), envio a fornecedores (Cakto, UAZAPI, Resend/SMTP), retenção, direitos do titular (acesso, correção, exclusão, portabilidade, revogação de consentimento).
- [ ] Confirmar necessidade de DPA com Supabase/OpenAI/Vercel para operação no Brasil sob a LGPD.
- [ ] Definir e documentar prazo de retenção para dados operacionais (logs, tentativas de auth, cliques de tracking).
- [ ] Avaliar se coleta de telefone antes da confirmação de compra (evento de checkout iniciado da Cakto) precisa de aviso específico.
