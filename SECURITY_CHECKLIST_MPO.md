# Checklist de Lançamento — MPO

## 🔴 Bloqueia o lançamento
- [ ] Backup restaurável do banco (upgrade de plano Supabase + PITR) — ver `BACKUP_AND_RECOVERY_PLAN.md`

## 🟠 Obrigatório antes do lançamento
- [ ] Política de Privacidade e Termos de Uso revisados por advogado (LGPD + direito do consumidor) — mapa em `DATA_FLOW_AND_PRIVACY_MAP.md`
- [ ] Confirmar retenção de dados configurada no painel da OpenAI (checagem simples de configuração)

## 🟡 Recomendado logo após o lançamento
- [ ] DMARC do domínio: subir de `p=none` para `p=quarantine` depois de confirmar alinhamento de SPF/DKIM
- [ ] Verificar domínio no Resend e publicar SPF/DKIM correspondentes
- [ ] Fluxo de auto-exclusão de conta na interface do aluno (`/perfil`)
- [ ] Limpar arquivos do Storage (bucket `fits`) ao excluir uma conta
- [ ] Rodar o teste de restauração de backup pelo menos uma vez, documentando o resultado

## 🟢 Melhoria contínua
- [ ] Content-Security-Policy, começando em modo `report-only`
- [ ] Acompanhar o lançamento estável do Next.js 16.3.0 (fecha o restante das CVEs de dependência)
- [ ] Rodar `node auditoria/07-teste-isolamento-contas.mjs` sempre que uma política de RLS mudar
- [ ] Definir prazo de retenção documentado para logs operacionais (`auth_attempts`, `rate_limits`, tracking)

---
Detalhes de cada item, evidência e como retestar: `SECURITY_AUDIT_MPO.md`. Resumo para decisão: `LAUNCH_READINESS_REPORT.md`.
