# Relatório de Prontidão para Lançamento — MPO

**Veredito: quase pronto.** Um item bloqueia o lançamento hoje; nenhum outro critério crítico da auditoria ficou em aberto.

## O único bloqueador

**Não existe backup restaurável do banco de dados.** Confirmei isso direto na API do Supabase: PITR desligado, zero backups disponíveis. Se algo der errado (exclusão acidental, bug numa migration), a perda é permanente. Isso normalmente acontece no plano Free do Supabase — a solução é o upgrade de plano, uma decisão de custo que só você pode tomar. Detalhes e procedimento em `BACKUP_AND_RECOVERY_PLAN.md`.

## O que já estava bom antes desta auditoria (confirmado com evidência, não só leitura de código)

- RLS ativo nas 34 tabelas do banco, sem exceção.
- Trigger no banco impede um usuário comum de virar admin, mesmo manipulando a própria requisição.
- Webhooks (Cakto, UAZAPI) idempotentes, com comparação de segredo segura contra timing attack.
- Fit Check (IA) com teto de gasto diário/mensal, kill switch, e verificação do arquivo pelos bytes reais — não pelo que o navegador declara.
- Login/cadastro/reset de senha com rate limit por IP e por e-mail, falhando fechado, e mensagens de erro idênticas para não revelar quais e-mails têm conta.
- Nenhum segredo no histórico do Git, nem no bundle que vai para o navegador (scan automático no CI).
- HTTPS, HSTS, headers de segurança e cache privado nas páginas autenticadas — tudo confirmado direto na resposta HTTP de produção.

## O que encontrei e já corrigi durante esta auditoria

- Comentários, curtidas e fotos da comunidade podiam ser lidos por qualquer conta autenticada, mesmo sem assinatura — bastava chamar a API do Supabase direto, sem passar pelo site. Corrigido e testado.
- Next.js estava numa versão com vulnerabilidades conhecidas (HIGH) já corrigidas — atualizei para a última versão estável.
- Criei um teste automatizado (`auditoria/07-teste-isolamento-contas.mjs`) que simula um ataque real de uma conta tentando roubar dado de outra — 24 tentativas, todas bloqueadas.

## O que fica para depois do lançamento (não bloqueia, mas vale corrigir)

- DMARC do domínio está só monitorando, não bloqueando e-mail falsificado em seu nome.
- Resend (e-mail reserva) ainda não tem o domínio verificado — sem isso, e-mails por ele têm entregabilidade pior.
- Exclusão de conta pelo próprio usuário ainda não existe na interface (hoje é manual, pelo admin).

## O que precisa de advogado, não de código

- Validar a Política de Privacidade e os Termos de Uso contra a LGPD e o Código de Defesa do Consumidor — mapa completo de dados em `DATA_FLOW_AND_PRIVACY_MAP.md`, com os pontos específicos marcados.

Relatório técnico completo com todos os achados, evidências e como reproduzir cada teste: `SECURITY_AUDIT_MPO.md`.
