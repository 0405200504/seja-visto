-- =============================================================
-- Coerência dos filtros de combinações: correções de clima
-- apontadas na auditoria de 2026-07-12 (foto x clima).
-- Aplicada em produção via REST em 2026-07-12.
-- =============================================================

-- Jorts de moletom + gorro: meia-estação, não frio de verdade
update public.looks set climate = 'meia-estacao' where title = 'Conjunto de Moletom Cinza';

-- Jorts de moletom + gorro camuflado: meia-estação, não calor
update public.looks set climate = 'meia-estacao' where title = 'Cowboy em Cinza';
