-- =============================================================
-- Atribui fotos reais (public/estilos/...) aos looks do seed,
-- escolhidas manualmente para combinar com as peças e o clima
-- descritos em cada look.
-- =============================================================

-- Casual
update public.looks set image_url = '/estilos/casual/06.jpg'      where title = 'Casual Premium Noturno';      -- jaqueta de couro, base escura, clima noturno
update public.looks set image_url = '/estilos/casual/08.jpg'      where title = 'Básico Premium Diurno';       -- camiseta branca + jeans + dia
update public.looks set image_url = '/estilos/casual/04.jpg'      where title = 'Date à Tarde';                -- polo elegante, tarde ensolarada
update public.looks set image_url = '/estilos/casual/01.jpg'      where title = 'Faculdade Sem Esforço';       -- look confortável com mochila/bolsa
update public.looks set image_url = '/estilos/casual/02.jpg'      where title = 'Evento Casual de Verão';      -- tons terrosos, descontraído

-- Minimalista
update public.looks set image_url = '/estilos/minimalista/10.jpg' where title = 'Monocromático Preto Total';   -- all black limpo
update public.looks set image_url = '/estilos/minimalista/03.jpg' where title = 'Minimalista Off-White';       -- tons claros
update public.looks set image_url = '/estilos/minimalista/12.jpg' where title = 'Viagem Confortável Premium';  -- preto confortável + tênis branco
update public.looks set image_url = '/estilos/minimalista/15.jpg' where title = 'Minimalista de Inverno';      -- cinza + preto

-- Smart Casual
update public.looks set image_url = '/estilos/smartcasual/01.jpg' where title = 'Oxford Casual de Trabalho';   -- camisa + alfaiataria, escritório
update public.looks set image_url = '/estilos/smartcasual/06.jpg' where title = 'Trabalho Elegante de Inverno';-- tricô escuro + casaco + alfaiataria
update public.looks set image_url = '/estilos/smartcasual/07.jpg' where title = 'Date Chuvoso';                -- tricô vinho/marrom com gola branca aparente
update public.looks set image_url = '/estilos/smartcasual/05.jpg' where title = 'Primeiro Dia de Trabalho';    -- blazer navy + camisa

-- Old Money
update public.looks set image_url = '/estilos/oldmoney/04.jpg'    where title = 'Elegante Casual Navy';        -- tricô sobre camisa + calça clara
update public.looks set image_url = '/estilos/oldmoney/02.jpg'    where title = 'Noite de Inverno Vinho';      -- sobretudo + gola alta, inverno

-- Streetwear
update public.looks set image_url = '/estilos/streetwear/07.jpg'  where title = 'Street Maduro Grafite';       -- tonal cinza, volumes controlados
update public.looks set image_url = '/estilos/streetwear/05.jpg'  where title = 'Street Noturno';              -- jaqueta de couro urbana à noite

-- Workwear
update public.looks set image_url = '/estilos/workwear/10.jpg'    where title = 'Workwear de Meia-Estação';    -- jaqueta caramelo + jeans

-- Gorpcore
update public.looks set image_url = '/estilos/gorpcore/11.jpg'    where title = 'Viagem Urbana de Inverno';    -- shell verde + calça preta

-- Preppy
update public.looks set image_url = '/estilos/preppy/02.jpg'      where title = 'Domingo Elegante';            -- polo + chino claro + boné

-- Vintage
update public.looks set image_url = '/estilos/vintage/04.jpg'     where title = 'Retrô Anos 90';               -- trucker jacket + jeans, clima 90s
