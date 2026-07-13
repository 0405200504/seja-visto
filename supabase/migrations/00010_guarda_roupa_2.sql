-- Guarda-roupa 2.0: novas calças, jaquetas e calçados.
-- Atualiza as peças existentes em vez de deletar, preservando as marcações
-- ("já tenho" / "quero comprar") que os alunos fizeram em user_wardrobe.

-- ---------- Calças ----------
-- Novas: carpenter bege, alfaiataria preta, jeans azul baggy, jeans reta escura, cargo

update public.wardrobe_items set
  name = 'Calça carpenter bege',
  description = 'Workwear de corte reto com costuras e bolsos aparentes — utilitária com personalidade.',
  how_to_use = 'Com camiseta pesada ou moletom e bota de trabalho; o bege aquece looks de inverno e conversa com terrosos.'
where name = 'Calça de alfaiataria casual cinza';

update public.wardrobe_items set
  name = 'Calça jeans azul baggy',
  description = 'O volume street que virou básico: pernas amplas do quadril ao tornozelo.',
  how_to_use = 'Com parte de cima mais ajustada e tênis com presença; a barra empilhando de leve sobre o calçado.'
where name = 'Calça chino bege ou caqui';

update public.wardrobe_items set
  name = 'Calça cargo',
  description = 'Bolsos laterais e DNA utilitário — desde que o corte seja limpo.',
  how_to_use = 'Com moletom ou camiseta pesada e tênis robusto ou bota; evite volume também em cima.'
where name = 'Calça cargo preta reta';

-- 'Calça jeans reta escura' e 'Calça de alfaiataria preta' permanecem.

-- ---------- Jaquetas ----------
-- Novas: moletom com capuz preto, jaqueta jeans clássica, crewneck cinza,
-- jaqueta de couro (ou eco) preta, bomber preta ou navy

update public.wardrobe_items set
  name = 'Moletom com capuz preto',
  priority = 'essencial',
  description = 'A terceira peça mais fácil do casual: conforto, atitude e zero esforço.',
  how_to_use = 'Sozinho com jeans ou cargo; sob jaqueta ou bomber nos dias mais frios para camadas com profundidade.'
where name = 'Blazer desestruturado escuro';

update public.wardrobe_items set
  name = 'Crewneck cinza',
  priority = 'intermediaria',
  description = 'O moletom de gola careca que funciona como tricô casual: limpo e versátil.',
  how_to_use = 'Com camiseta branca aparecendo na barra e na gola; combina com qualquer calça da base.'
where name = 'Sobretudo cinza ou camelo';

-- 'Jaqueta de couro (ou eco) preta', 'Jaqueta jeans clássica' e 'Bomber preta ou navy' permanecem.

-- ---------- Calçados ----------
-- Novos: loafer, bota de trabalho, tênis branco minimalista, tênis fino, tênis robusto

update public.wardrobe_items set
  name = 'Loafer',
  description = 'O sapato sem cadarço que eleva o smart casual e os looks de calor.',
  how_to_use = 'Com alfaiataria ou jeans reto de barra mais curta; no verão, com meia invisível.'
where name = 'Chelsea boot preta ou marrom';

update public.wardrobe_items set
  name = 'Tênis fino (Samba, Onitsuka Tiger, Speedcat...)',
  description = 'Perfil baixo e silhueta fina — personalidade retrô sem volume.',
  how_to_use = 'Com jeans reto ou baggy de barra caindo limpa; atualiza qualquer look básico na hora.'
where name = 'Sapato casual de couro marrom';

-- 'Tênis branco minimalista', 'Bota de trabalho (couro ou camurça)'
-- e 'Tênis robusto (chunky controlado)' permanecem.
