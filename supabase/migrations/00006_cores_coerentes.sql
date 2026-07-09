-- =============================================================
-- Ajusta base_color para refletir a COR DOMINANTE visível na foto
-- de cada look (revisão manual foto a foto).
-- =============================================================

-- Foto: polo cinza + calça preta
update public.looks set base_color = 'cinza' where title = 'Date à Tarde';

-- Foto: jaqueta de couro preta como âncora do look
update public.looks set base_color = 'preto' where title = 'Couro & Denim Claro';

-- Foto: camiseta preta + chino bege claro (também realinha as peças à foto)
update public.looks set
  base_color = 'bege',
  pieces = '["Camiseta preta leve", "Chino bege claro", "Tênis branco limpo", "Óculos de sol"]',
  why_it_works = 'Preto sobre bege claro é o contraste de verão mais elegante que existe — simples, fresco e com presença.',
  adaptations = '["Trocar camiseta preta por polo de malha", "Trocar chino por bermuda alinhada", "Adicionar camisa leve aberta à noite"]'
where title = 'Evento Casual de Verão';

-- Foto: camiseta branca/off-white dominante
update public.looks set base_color = 'branco' where title = 'Minimalista Off-White';

-- Foto: cargo cru/areia ocupa a maior área do look
update public.looks set base_color = 'bege' where title = 'Preto & Areia';

-- Foto: calça cinza dominante
update public.looks set base_color = 'cinza' where title = 'Preto & Cinza Direto';

-- Foto: blazer cinza claro + camisa branca (realinha as peças à foto)
update public.looks set
  base_color = 'cinza',
  pieces = '["Blazer ou jaqueta leve cinza clara", "Camisa oxford branca", "Calça de alfaiataria escura", "Sapato de couro", "Cinto combinando"]',
  why_it_works = 'O blazer cinza claro sobre camisa branca é a fórmula mais segura do trabalho casual: arrumado, neutro e sem rigidez.',
  adaptations = '["Trocar blazer por overshirt cinza", "Trocar sapato por tênis branco em ambientes informais", "Mangas dobradas para descontrair"]'
where title = 'Oxford Casual de Trabalho';

-- Foto: jaqueta bordô com gola branca — vinho é a cor da peça principal
update public.looks set base_color = 'vinho' where title = 'Date Chuvoso';

-- Foto: sobretudo escuro dominante (o tricô vinho fica por baixo)
update public.looks set base_color = 'preto' where title = 'Noite de Inverno Vinho';

-- Foto: puffer marrom é a peça dominante
update public.looks set base_color = 'marrom' where title = 'Puffer com Denim Claro';

-- Foto: jaqueta de couro cinza dominante
update public.looks set base_color = 'cinza' where title = 'Street Noturno';

-- Foto: jaqueta marrom/caramelo dominante
update public.looks set base_color = 'marrom' where title = 'Retrô Anos 90';
