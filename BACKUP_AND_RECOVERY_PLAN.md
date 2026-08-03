# Plano de Backup e Recuperação — MPO

## Situação encontrada (evidência, via API de gerenciamento do Supabase, em 2026-08-03)

```
region: us-west-2
pitr_enabled: false
walg_enabled: true
backups: []
```

**Não existe nenhum backup restaurável do banco de dados hoje, e o Point-in-Time Recovery (PITR) está desligado.** Isso é consistente com o projeto estar no plano Free do Supabase — backups automáticos diários e PITR são recursos do plano Pro (ou do add-on de PITR). Isto **bloqueia o lançamento** pelos critérios definidos nesta própria auditoria ("ausência de backup restaurável").

Isso não é surpresa: já constava como pendência conhecida do projeto (upgrade do Supabase Free) antes desta auditoria — esta é a confirmação técnica direta, via API, de que o item continua em aberto.

## O que precisa acontecer antes do lançamento

1. **Fazer upgrade do projeto Supabase para o plano Pro** (ou contratar o add-on de backup no plano atual, se disponível). Isso é uma decisão de custo/orçamento — não uma alteração que eu deva fazer sozinho sem sua aprovação, porque envolve cobrança recorrente na sua conta Supabase.
2. Depois do upgrade, confirmar que:
   - Backups diários automáticos estão ativos.
   - PITR está habilitado (recomendado, dado que o produto já processa pagamento e dado pessoal).
3. Definir e testar o procedimento de restauração (abaixo) **antes** do lançamento, não depois de precisar dele pela primeira vez.

## RPO e RTO propostos (a validar com você)

- **RPO (perda máxima aceitável de dados):** 24h com backup diário simples; **~5 minutos** se PITR estiver ativo. Dado que o sistema processa pagamento e é a fonte única de verdade de acesso do aluno, recomendo mirar PITR assim que o orçamento permitir.
- **RTO (tempo máximo aceitável fora do ar):** proponho 4h como meta inicial — é o tempo estimado para restaurar um backup do Supabase e revalidar a aplicação manualmente. Ajustar conforme a criticidade real do negócio.

## Procedimento de teste de restauração (a executar após o upgrade)

Importante: **nunca restaurar por cima do projeto de produção para testar.** O procedimento seguro é:

1. Criar um projeto Supabase **novo**, temporário, só para o teste.
2. Restaurar o backup mais recente de produção nesse projeto temporário (o Supabase permite isso via painel, ou via suporte, dependendo do plano).
3. Rodar uma checagem simples no projeto restaurado: contar linhas de `users_profile`, `sales`, `user_entitlements` e comparar com os números esperados (sem expor dado real em log — só a contagem).
4. Confirmar que as RLS/policies também vieram no backup (rodar a mesma query de `pg_policies` usada nesta auditoria).
5. Apagar o projeto temporário ao final do teste.
6. Documentar: data do teste, quem executou, resultado, tempo total gasto (isso vira a evidência de que o backup é restaurável de verdade, não só "configurado").

**Frequência recomendada:** um teste de restauração completo a cada 3 meses, e sempre depois de uma migration estrutural grande.

## Backup do que NÃO é coberto pelo backup do banco

- **Supabase Storage (buckets `content` e `fits`):** o backup do Postgres normalmente não inclui os arquivos do Storage. Confirmar com o Supabase se o plano Pro cobre isso ou se é necessário um processo próprio (ex.: sincronização periódica para outro storage/S3).
- **Variáveis de ambiente / segredos:** não ficam versionadas em lugar nenhum de propósito (é o correto). Manter uma cópia segura (gerenciador de senhas da empresa, não um arquivo solto) de todos os valores de produção, para o caso de precisar recriar o ambiente do zero.
- **Configuração da Vercel** (domínios, crons, redirects): `vercel.json` e `next.config.ts` já estão versionados no Git — isso já é, na prática, o "backup" dessa configuração.
- **Migrations do banco:** já 100% versionadas em `supabase/migrations/` — permitem reconstruir o schema do zero em caso de restauração parcial.

## Rollback de deploy (Vercel)

A Vercel mantém os deploys anteriores automaticamente; reverter é "Promote to Production" no deploy anterior pelo painel — não depende de nenhuma ação prévia de configuração. Confirmar que isso está acessível para quem precisar agir num incidente (ver `SECURITY_AUDIT_MPO.md`, seção de acesso à Vercel).
