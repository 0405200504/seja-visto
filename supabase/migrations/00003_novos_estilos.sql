-- =============================================================
-- Migração para a nova taxonomia de 9 estilos:
-- casual, streetwear, workwear, smartcasual, oldmoney,
-- preppy, minimalista, gorpcore, vintage
-- =============================================================

-- Exceções por título (looks que se encaixam melhor em estilos específicos)
update public.looks set style = 'workwear'  where title = 'Workwear de Meia-Estação';
update public.looks set style = 'gorpcore'  where title = 'Viagem Urbana de Inverno';
update public.looks set style = 'preppy'    where title = 'Domingo Elegante';
update public.looks set style = 'oldmoney'  where title in ('Elegante Casual Navy', 'Noite de Inverno Vinho');
update public.looks set style = 'minimalista' where title = 'Monocromático Preto Total';

-- Mapeamento geral dos estilos antigos
update public.looks set style = 'casual'      where style = 'casual-premium';
update public.looks set style = 'streetwear'  where style in ('streetwear-maduro', 'noturno');
update public.looks set style = 'smartcasual' where style = 'elegante-casual';

-- Perfis de usuários já existentes
update public.users_profile set preferred_style = 'casual'      where preferred_style in ('casual-premium', 'nao-sei');
update public.users_profile set preferred_style = 'streetwear'  where preferred_style = 'streetwear-maduro';
update public.users_profile set preferred_style = 'smartcasual' where preferred_style = 'elegante-casual';

-- Novo look para cobrir o estilo vintage
insert into public.looks (title, description, occasion, style, climate, level, base_color, pieces, why_it_works, adaptations) values
('Retrô Anos 90', 'Passeios de dia, encontros casuais e qualquer rolê descontraído.', 'dia-a-dia', 'vintage', 'meia-estacao', 'facil', 'azul',
'["Trucker jacket de lavagem média", "Camiseta gráfica retrô ou lisa off-white", "Jeans reto de lavagem clara", "Retro sneakers", "Boné five panel ou trucker"]',
'A trucker jacket com jeans de lavagem diferente cria o contraste clássico do vintage. Os retro sneakers e a camiseta gráfica fecham a referência noventista sem parecer fantasia.',
'["Trocar trucker por bomber para um retrô mais esportivo", "Trocar camiseta gráfica por jersey de futebol vintage", "No frio, adicionar moletom cinza por baixo da jaqueta"]');
