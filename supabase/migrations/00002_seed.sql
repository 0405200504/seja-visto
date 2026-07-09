-- =============================================================
-- Plano Pronto de Estilo — Dados iniciais (seed)
-- Execute APÓS o 00001_schema.sql.
-- =============================================================

-- ---------- Módulos ----------

insert into public.modules (id, title, description, order_index) values
('10000000-0000-4000-8000-000000000001', 'Diagnóstico de Estilo', 'Entenda por que você sente que não se veste bem e defina a imagem que quer passar. É aqui que o método começa.', 1),
('10000000-0000-4000-8000-000000000002', 'Fundamentos', 'Caimento, proporção, cores, texturas, ocasião e terceira peça: os 6 pilares que separam roupa bonita de look bem construído.', 2),
('10000000-0000-4000-8000-000000000003', 'Guarda-Roupa Base', 'As peças essenciais e coringas que sustentam qualquer combinação — e a ordem certa de compra.', 3),
('10000000-0000-4000-8000-000000000004', 'Fórmulas de Looks', 'Fórmulas prontas e repetíveis para cada situação: do básico premium ao look de date.', 4),
('10000000-0000-4000-8000-000000000005', 'Lookbook', 'Como usar o lookbook da plataforma: combinações prontas por ocasião, estilo e clima, fáceis de copiar.', 5),
('10000000-0000-4000-8000-000000000006', 'Guia de Cores', 'Dos neutros que nunca erram às combinações avançadas com cor de destaque.', 6),
('10000000-0000-4000-8000-000000000007', 'Compras Inteligentes', 'Compre menos e melhor: como evitar peças inúteis e investir na ordem certa.', 7),
('10000000-0000-4000-8000-000000000008', 'Plano de Ação', 'O desafio de 7 dias que transforma o método em hábito — com missões práticas e checklist final.', 8);

-- ---------- Aulas ----------

insert into public.lessons (module_id, title, content, order_index) values

-- Módulo 1 — Diagnóstico de Estilo
('10000000-0000-4000-8000-000000000001', 'Por que você sente que não se veste bem',
'A sensação de estar mal vestido raramente vem da falta de roupa. Ela vem da falta de critério: você compra peças isoladas que não conversam entre si e monta looks por eliminação, não por intenção.

## Os 3 sintomas clássicos

- Guarda-roupa cheio e a sensação de não ter o que vestir
- Comprar algo novo para cada evento importante
- Repetir sempre a mesma combinação segura

Neste módulo você vai identificar exatamente onde está o seu gargalo — e nos próximos, resolver um por um.', 1),

('10000000-0000-4000-8000-000000000001', 'Roupa bonita vs. look bem construído',
'Uma peça bonita no cabide pode ficar ruim no corpo. Um look bem construído usa peças simples que funcionam juntas: caimento certo, cores que conversam e uma proposta clara.

O homem bem vestido não usa roupas melhores que as suas — ele usa as roupas certas do jeito certo.

## O que muda na prática

- Pare de avaliar peças isoladas; avalie combinações
- Prefira caimento impecável a estampa chamativa
- Todo look precisa de uma intenção: o que você quer comunicar?', 2),

('10000000-0000-4000-8000-000000000001', 'Como definir a imagem que você quer passar',
'Estilo é comunicação. Antes de abrir o guarda-roupa, defina em três palavras a imagem que você quer transmitir — por exemplo: presente, confiável e moderno.

Essas três palavras viram seu filtro de decisão. Peça nova? Combinação nova? Se não reforça essas palavras, não entra.

## Exercício rápido

- Escreva 3 palavras que descrevem como você quer ser percebido
- Escreva 3 palavras que descrevem como você se percebe hoje
- A distância entre as duas listas é o seu plano de trabalho', 3),

('10000000-0000-4000-8000-000000000001', 'Exercício prático: o diagnóstico',
'Hora de colocar a mão na massa. Abra seu guarda-roupa e faça o diagnóstico completo.

## Passo a passo

- Separe as 5 peças que você mais usa e pergunte: por quê?
- Separe 5 peças que você nunca usa e pergunte: por que comprei?
- Fotografe seu look mais confiante e analise com os critérios da aula anterior
- Anote as 3 peças que faltam para destravar mais combinações

Guarde essas anotações: você vai usá-las no módulo de Guarda-Roupa Base e no Plano de Ação.', 4),

-- Módulo 2 — Fundamentos
('10000000-0000-4000-8000-000000000002', 'Caimento: a regra que muda tudo',
'Caimento é o fundamento número um. Uma camiseta básica com caimento perfeito vence qualquer peça cara mal ajustada.

## Pontos de verificação

- Ombro: a costura deve terminar exatamente no osso do ombro
- Comprimento de camiseta: meio do zíper da calça, nunca abaixo
- Calça: reta, sem sobra de tecido acumulada no tornozelo
- Nada apertado a ponto de marcar, nada largo a ponto de desabar

Se precisar escolher onde investir primeiro, invista em ajustes de costura: é barato e transforma peças que você já tem.', 1),

('10000000-0000-4000-8000-000000000002', 'Proporção: equilíbrio entre as peças',
'Proporção é a relação entre a parte de cima e a parte de baixo do look. O erro mais comum é usar tudo largo ou tudo justo.

## Regras seguras

- Parte de cima mais volumosa pede parte de baixo mais limpa
- Calça mais larga pede top mais estruturado
- Homens mais baixos: evite cortes que dividem o corpo ao meio; prefira monocromia
- Terceira peça sempre um pouco mais estruturada que a base

Domine uma silhueta primeiro (reta e limpa) antes de experimentar volumes.', 2),

('10000000-0000-4000-8000-000000000002', 'Cores: a base neutra',
'Cores erradas gritam; cores certas sustentam. A regra de ouro do método: 80% do look em neutros, 20% em cor — no máximo.

## Os neutros masculinos

- Preto, branco e off-white
- Cinza (claro ao grafite)
- Navy e azul escuro
- Bege, caqui e marrom

Comece monocromático ou com dois neutros. Quando isso estiver no automático, o Guia de Cores libera as combinações avançadas.', 3),

('10000000-0000-4000-8000-000000000002', 'Texturas: profundidade sem estampa',
'Textura é o que deixa um look neutro interessante. Dois tons de cinza podem formar um look incrível se as texturas forem diferentes.

## Combinações que funcionam

- Malha (tricô) + sarja
- Couro + algodão liso
- Lã + denim
- Camurça + jersey

Regra prática: em um look sem estampas, use pelo menos duas texturas diferentes. É o truque mais subestimado do vestuário masculino.', 4),

('10000000-0000-4000-8000-000000000002', 'Ocasião: vestir o contexto',
'O look certo no lugar errado vira fantasia. Ler a ocasião é um fundamento, não um detalhe.

## A escala de formalidade

- Casa e rotina: conforto com intenção (nada de "roupa de ficar em casa" na rua)
- Trabalho: um degrau acima do dress code médio do ambiente
- Date e noite: base escura, presença, terceira peça
- Eventos: na dúvida, mais sóbrio e mais escuro

Estar levemente mais arrumado que a média nunca é erro. O contrário, sim.', 5),

('10000000-0000-4000-8000-000000000002', 'Terceira peça: o multiplicador',
'Camiseta + calça é base. A terceira peça — jaqueta, overshirt, blazer casual, cardigan — é o que transforma base em look.

## Por que funciona

- Cria camadas e profundidade visual
- Comunica intenção: você se vestiu, não apenas se cobriu
- Estrutura os ombros e melhora a silhueta

Se o seu look parece incompleto, em 9 de 10 casos falta a terceira peça. É o atalho mais rápido para parecer bem vestido.', 6),

-- Módulo 3 — Guarda-Roupa Base
('10000000-0000-4000-8000-000000000003', 'Peças essenciais',
'O guarda-roupa base é o conjunto mínimo de peças que gera o máximo de combinações. Com cerca de 20 peças certas, você monta mais de 50 looks.

## O núcleo

- Camisetas lisas: branca, preta, off-white e cinza
- Calça jeans reta escura e calça alfaiataria casual
- Camisa branca e camisa de tom neutro
- Tênis branco limpo e bota ou sapato escuro
- Jaqueta versátil (jeans, couro ou overshirt)

Consulte a área Guarda-Roupa da plataforma: cada peça tem prioridade e sugestão de uso.', 1),

('10000000-0000-4000-8000-000000000003', 'Peças coringas',
'Coringa é a peça que funciona em três ou mais contextos diferentes sem esforço.

## As maiores coringas do vestuário masculino

- Overshirt em tom neutro: terceira peça no calor e no frio moderado
- Calça cinza de alfaiataria casual: trabalho, date e evento
- Camisa oxford branca: fechada é formal, aberta sobre camiseta é casual
- Tênis branco minimalista: conversa com quase tudo

Ao avaliar uma compra, pergunte: em quantos contextos essa peça entra? Menos de três, não é coringa.', 2),

('10000000-0000-4000-8000-000000000003', 'Peças que elevam o visual',
'Depois da base, entram as peças de elevação: as que adicionam presença e sofisticação.

## Exemplos de elevação

- Jaqueta de couro ou camurça
- Blazer desestruturado em tom escuro
- Tricô de qualidade (gola redonda ou polo)
- Bota chelsea ou sapato de couro limpo
- Relógio discreto de pulseira de couro ou aço

Uma peça de elevação por look é suficiente. Duas, no máximo. O objetivo é destacar você, não a roupa.', 3),

('10000000-0000-4000-8000-000000000003', 'O que comprar primeiro',
'Sem orçamento infinito, ordem importa mais que quantidade.

## Ordem ideal de compra

- Ajustes de costura no que você já tem (maior retorno imediato)
- Camisetas lisas de qualidade nos 4 neutros
- Uma calça reta escura impecável
- Tênis branco premium limpo
- Terceira peça versátil (overshirt ou jaqueta)
- Só então: peças de elevação e cor

Reveja seu diagnóstico do Módulo 1 e monte sua lista na área Guarda-Roupa marcando "quero comprar".', 4),

-- Módulo 4 — Fórmulas de Looks
('10000000-0000-4000-8000-000000000004', 'Fórmula: Básico premium',
'A fórmula mais segura do método. Simples, limpa e impossível de errar.

## A fórmula

- Camiseta lisa de caimento perfeito (branca, preta ou off-white)
- Calça reta escura (jeans ou alfaiataria casual)
- Tênis branco minimalista impecável
- Relógio discreto

O segredo está na execução: caimento, peças limpas e passadas. É o uniforme do homem que se veste bem sem esforço aparente.', 1),

('10000000-0000-4000-8000-000000000004', 'Fórmula: Casual arrumado',
'Um degrau acima do básico — para almoços, encontros informais e qualquer situação "nem casual demais, nem formal demais".

## A fórmula

- Camisa de botão em tom neutro (pode ser sobre camiseta lisa)
- Calça chino ou jeans escuro
- Tênis limpo ou sapato casual de couro
- Cinto na cor do calçado

A camisa é o que "arruma" o look. Mangas dobradas até o antebraço deixam a proposta mais leve.', 2),

('10000000-0000-4000-8000-000000000004', 'Fórmula: Street maduro',
'Streetwear sem cara de adolescente: volumes controlados, cores fechadas e peças de qualidade.

## A fórmula

- Camiseta ou moletom liso de peso bom (sem logos gigantes)
- Calça cargo ou jeans reto, dobra limpa no tornozelo
- Tênis robusto ou bota
- Terceira peça: jaqueta workwear ou overshirt

A maturidade vem da paleta: máximo dois tons neutros e uma textura forte. Street maduro é atitude, não estampa.', 3),

('10000000-0000-4000-8000-000000000004', 'Fórmula: Elegante casual',
'A fórmula para parecer sofisticado sem terno. Ideal para jantares, eventos e trabalho criativo.

## A fórmula

- Tricô fino ou camisa premium em tom escuro
- Calça de alfaiataria casual (cinza, navy ou preta)
- Sapato de couro limpo ou chelsea boot
- Blazer desestruturado como terceira peça (opcional)

Monocromia escura com texturas diferentes é o atalho: navy sobre navy, grafite sobre preto. Elegância é ausência de ruído.', 4),

('10000000-0000-4000-8000-000000000004', 'Fórmula: Date e noite',
'O look de presença. Base escura, silhueta limpa e uma terceira peça intencional.

## A fórmula

- Camiseta preta lisa de caimento perfeito
- Calça reta escura
- Jaqueta de couro ou overshirt escura
- Bota preta ou tênis premium escuro
- Relógio discreto

Preto sobre preto cria presença imediata. A terceira peça mostra intenção — você se preparou, sem parecer que tentou demais.', 5),

('10000000-0000-4000-8000-000000000004', 'Fórmula: Trabalho e rotina',
'Consistência é a chave da rotina: uma fórmula repetível que funciona todos os dias.

## A fórmula

- Camisa ou polo de qualidade em neutro
- Calça chino ou alfaiataria casual
- Sapato casual ou tênis minimalista
- Terceira peça conforme o clima (blazer casual ou tricô)

Monte um "uniforme inteligente": 3 variações dessa fórmula que você repete sem pensar. Decisão de manhã zero, imagem consistente sempre.', 6),

-- Módulo 5 — Lookbook
('10000000-0000-4000-8000-000000000005', 'Como usar as combinações prontas',
'O Lookbook é o coração prático da plataforma: combinações completas, testadas e fáceis de copiar.

## Como aproveitar

- Cada look mostra as peças exatas, por que funciona e como adaptar
- Use "Tenho essas peças" para mapear o que já pode ser copiado hoje
- Use "Adicionar ao meu plano" para os looks que quer testar na semana
- Favorite os que mais combinam com seu perfil

Comece copiando looks à risca. Repertório vem da repetição — a autoria vem depois.', 1),

('10000000-0000-4000-8000-000000000005', 'Looks por ocasião',
'O filtro de ocasião responde a pergunta mais comum: "o que eu visto para…?"

## Na prática

- Date marcado? Filtre por Date e escolha um look do seu nível
- Semana de trabalho? Filtre Trabalho e monte um uniforme com 3 looks
- Viagem? O filtro Viagem prioriza conforto sem abrir mão da imagem

Salve um favorito por ocasião recorrente da sua vida. Nunca mais decida em cima da hora.', 2),

('10000000-0000-4000-8000-000000000005', 'Looks por estilo',
'Use o filtro de estilo junto com o resultado do seu onboarding para construir identidade — não só looks isolados.

## Estratégia

- Foque 80% dos seus looks no seu estilo principal
- Use os 20% restantes para experimentar estilos vizinhos
- Casual premium e minimalista são a porta de entrada mais segura
- Street maduro e noturno pedem os fundamentos bem dominados

Identidade visual é repetição com pequenas variações — não reinvenção diária.', 3),

('10000000-0000-4000-8000-000000000005', 'Looks por clima',
'Clima não é desculpa para se vestir mal. É só uma variável a mais na fórmula.

## Regras por clima

- Calor: tecidos leves, cores claras, menos camadas — caimento vira ainda mais crítico
- Frio: camadas com texturas diferentes; o frio é aliado do estilo
- Meia-estação: terceira peça removível é a resposta padrão

Filtre o lookbook pelo clima da semana e monte seu plano com antecedência.', 4),

('10000000-0000-4000-8000-000000000005', 'Looks fáceis de copiar',
'Todo look de nível Fácil usa apenas peças do guarda-roupa base — se você montou a base, consegue copiar hoje.

## Seu plano de 30 dias com o lookbook

- Semana 1: copie 3 looks fáceis à risca
- Semana 2: repita os que funcionaram trocando uma peça
- Semana 3: teste um look intermediário
- Semana 4: monte uma combinação própria inspirada nos favoritos

Fotografe cada tentativa. Comparar evolução é o combustível da consistência.', 5),

-- Módulo 6 — Guia de Cores
('10000000-0000-4000-8000-000000000006', 'Combinações neutras',
'Neutro com neutro sempre combina. Essa é a fundação de todo o guia de cores.

## Fórmulas monocromáticas e duo

- Preto + cinza (contraste suave, presença alta)
- Off-white + bege (claro, sofisticado, ideal para o dia)
- Navy + branco (o clássico que nunca falha)
- Grafite + preto (noite, elegância imediata)

Dica: em looks de um tom só, varie as texturas para dar profundidade — revise a aula de texturas do Módulo 2.', 1),

('10000000-0000-4000-8000-000000000006', 'Combinações seguras',
'O próximo passo: adicionar um terceiro tom sem risco.

## Trios que funcionam sempre

- Branco + navy + bege
- Preto + cinza + branco
- Off-white + marrom + caqui
- Navy + cinza + branco

A regra 60/30/10: 60% do look no tom dominante, 30% no secundário, 10% no detalhe (calçado, cinto, acessório).', 2),

('10000000-0000-4000-8000-000000000006', 'Combinações avançadas',
'Cores fechadas não-neutras — verde militar, vinho, azul petróleo — elevam o repertório quando entram no lugar certo.

## Como introduzir

- Uma cor avançada por look, sempre ancorada em neutros
- Verde militar conversa com preto, bege e branco
- Vinho conversa com cinza, navy e preto
- Prefira a cor avançada na terceira peça ou na parte de cima

Se estiver em dúvida se combina, não combina. Volte um passo para o trio seguro.', 3),

('10000000-0000-4000-8000-000000000006', 'Cor de destaque',
'A cor de destaque é os 10% que fazem o look parecer intencional: um detalhe que chama o olhar sem gritar.

## Onde aplicar

- Tênis com detalhe colorido em look neutro
- Camiseta de cor fechada sob overshirt neutra
- Acessório (boné, corrente, pulseira) em look monocromático

Nunca duas cores de destaque no mesmo look. Uma nota certa vale mais que um acorde desafinado.', 4),

-- Módulo 7 — Compras Inteligentes
('10000000-0000-4000-8000-000000000007', 'Como comprar sem desperdiçar dinheiro',
'A maior economia não é comprar barato: é não comprar errado. Peça parada no armário é dinheiro parado.

## Princípios

- Custo por uso: peça de R$300 usada 100 vezes custa R$3 por uso
- Compre para o guarda-roupa que você tem, não para um imaginário
- Base primeiro, elevação depois, tendência por último
- Qualidade em o que toca o chão e o que estrutura os ombros: calçado e terceira peça

Antes de qualquer compra, pergunte: com quantas peças que já tenho isso combina?', 1),

('10000000-0000-4000-8000-000000000007', 'Como evitar peças inúteis',
'Peça inútil é a que exige um look inteiro novo para funcionar.

## Sinais de alerta

- "Vou usar quando…" (ocasião hipotética)
- Estampa ou cor que não conversa com seus neutros
- Caimento que "quase" serve e você promete ajustar
- Compra por preço (promoção) e não por função

Se a peça não entra em 3 combinações imediatas com o que você já tem, ela não entra no carrinho.', 2),

('10000000-0000-4000-8000-000000000007', 'Checklist antes de comprar',
'Passe toda compra por este filtro de 60 segundos.

## O checklist

- Combina com pelo menos 3 peças que já tenho?
- O caimento está certo agora (sem depender de ajuste ou dieta)?
- Reforça as 3 palavras da minha imagem (Módulo 1)?
- Eu compraria pelo preço cheio, sem promoção?
- Preenche uma lacuna real da minha lista "quero comprar"?

Qualquer "não" = a peça fica na loja. Sem exceção.', 3),

('10000000-0000-4000-8000-000000000007', 'Ordem ideal de compra',
'Recapitulando o método em uma sequência única de investimento.

## A ordem

- Ajustes no que você já tem
- Básicos de base: camisetas neutras + calça reta escura
- Calçado principal: tênis branco premium ou bota
- Terceira peça coringa: overshirt ou jaqueta versátil
- Segunda calça e camisas
- Peças de elevação: couro, tricô, blazer
- Cores avançadas e acessórios

Marque as peças na área Guarda-Roupa da plataforma e siga a lista de cima para baixo. Disciplina aqui vale mais que orçamento.', 4),

-- Módulo 8 — Plano de Ação
('10000000-0000-4000-8000-000000000008', 'O desafio de 7 dias',
'Conhecimento sem execução é entretenimento. O desafio de 7 dias transforma o método em prática — um dia, uma missão.

## Como funciona

- Cada dia tem missão, explicação e checklist
- As missões levam de 20 a 40 minutos
- Você registra anotações e marca a conclusão na plataforma
- Ao final, terá diagnóstico feito, looks testados e referências salvas

Acesse o Plano de Ação no menu e comece pelo Dia 1. O melhor dia para começar é hoje.', 1),

('10000000-0000-4000-8000-000000000008', 'Missões práticas: como executar',
'As missões foram desenhadas em progressão: diagnóstico, base, neutros, terceira peça, acabamento, presença e registro.

## Dicas de execução

- Faça no horário em que você se arruma normalmente
- Fotografe TODOS os resultados, inclusive os ruins
- Use as anotações de cada dia para registrar o que descobriu
- Não pule dias: a sequência é parte do método

Errar uma missão também é dado: anote o que não funcionou e por quê.', 2),

('10000000-0000-4000-8000-000000000008', 'Checklist final',
'Ao completar os 7 dias, valide sua evolução com o checklist de saída.

## Você deve ter agora

- Guarda-roupa diagnosticado e higienizado
- 3+ looks básicos validados no espelho
- 1 combinação neutra e 1 look com terceira peça testados
- Calçados limpos e acessórios definidos
- 1 look de saída com presença, fotografado
- Suas melhores referências salvas nos favoritos

Faltou algum item? Volte ao dia correspondente e feche a lacuna antes de seguir.', 3),

('10000000-0000-4000-8000-000000000008', 'Sua evolução daqui pra frente',
'O método não termina no dia 7 — ele vira sistema.

## Rotina de manutenção

- Semanal: escolha os looks da semana com o lookbook (10 minutos)
- Mensal: revise favoritos e teste 1 combinação nova
- Trimestral: refaça o diagnóstico e atualize a lista de compras
- Sempre: aplique o checklist de compras antes de qualquer peça nova

Você agora tem repertório, critério e um sistema. Consistência é o que transforma isso em identidade.', 4);

-- ---------- Looks ----------

insert into public.looks (title, description, occasion, style, climate, level, base_color, pieces, why_it_works, adaptations) values

('Casual Premium Noturno', 'Jantar, bar, encontro ou evento casual à noite.', 'date', 'casual-premium', 'meia-estacao', 'facil', 'preto',
'["Camiseta preta lisa", "Calça reta escura", "Jaqueta de couro ou overshirt", "Bota preta ou tênis premium", "Relógio discreto"]',
'É uma combinação simples, masculina e forte. A base escura cria presença, enquanto a terceira peça deixa o visual mais intencional.',
'["Trocar bota por tênis branco premium", "Trocar jaqueta por camisa aberta", "Trocar camiseta preta por off-white"]'),

('Básico Premium Diurno', 'O uniforme do dia a dia bem executado.', 'dia-a-dia', 'casual-premium', 'calor', 'facil', 'branco',
'["Camiseta branca lisa de caimento perfeito", "Calça jeans reta escura", "Tênis branco minimalista", "Relógio de aço"]',
'Máximo efeito com mínimo esforço: neutros limpos, caimento certo e calçado impecável comunicam cuidado sem esforço aparente.',
'["Trocar jeans por chino bege", "Trocar camiseta branca por cinza mescla", "Adicionar boné neutro em dias de sol"]'),

('Oxford Casual de Trabalho', 'Escritório com dress code casual e reuniões do dia a dia.', 'trabalho', 'elegante-casual', 'meia-estacao', 'facil', 'azul',
'["Camisa oxford azul clara", "Calça chino caqui ou navy", "Sapato casual de couro marrom", "Cinto marrom combinando"]',
'O contraste suave entre azul claro e neutros quentes é a fórmula mais segura do ambiente de trabalho: arrumado sem formalidade excessiva.',
'["Dobrar as mangas para leveza", "Trocar sapato por tênis branco em sextas", "Adicionar blazer navy para reuniões importantes"]'),

('Street Maduro Grafite', 'Rolê urbano, encontros casuais e dia a dia com atitude.', 'dia-a-dia', 'streetwear-maduro', 'meia-estacao', 'intermediario', 'cinza',
'["Moletom grafite liso de peso bom", "Calça cargo preta reta", "Tênis robusto branco e cinza", "Meia aparente preta", "Corrente fina discreta"]',
'Volumes controlados e paleta fechada em dois tons dão o DNA street sem cair no infantil. A textura do moletom contra o nylon da cargo cria profundidade.',
'["Trocar moletom por camiseta pesada no calor", "Trocar cargo por jeans reto", "Adicionar jaqueta workwear no frio"]'),

('Monocromático Preto Total', 'Noite, shows e qualquer ocasião que peça presença máxima.', 'noite', 'noturno', 'frio', 'intermediario', 'preto',
'["Tricô preto de gola redonda", "Calça alfaiataria preta", "Chelsea boot preta", "Sobretudo ou overshirt preta", "Relógio minimalista"]',
'Preto sobre preto com três texturas diferentes (tricô, alfaiataria, couro) é a definição de elegância noturna: silhueta limpa e presença imediata.',
'["Trocar tricô por camiseta preta no calor", "Trocar chelsea por tênis preto limpo", "Adicionar sobretudo cinza para contraste"]'),

('Minimalista Off-White', 'Dia a dia claro, limpo e sofisticado.', 'dia-a-dia', 'minimalista', 'calor', 'intermediario', 'bege',
'["Camiseta off-white de tecido encorpado", "Calça bege reta", "Tênis branco minimalista", "Meia invisível"]',
'Tons claros do mesmo espectro criam um visual editorial. O segredo é a diferença sutil de tons entre camiseta e calça — nunca idênticos.',
'["Trocar calça bege por cinza claro", "Adicionar overshirt caqui na meia-estação", "Trocar tênis por sandália de couro em viagens"]'),

('Elegante Casual Navy', 'Jantares, aniversários e eventos casuais com sofisticação.', 'evento-casual', 'elegante-casual', 'meia-estacao', 'intermediario', 'azul',
'["Tricô navy fino", "Calça alfaiataria cinza clara", "Sapato de couro marrom escuro ou chelsea", "Cinto combinando", "Relógio de couro"]',
'Navy com cinza é o duo mais elegante do guarda-roupa masculino. O tricô substitui o blazer mantendo a sofisticação sem rigidez.',
'["Camisa branca por baixo do tricô para ocasiões mais formais", "Trocar sapato por tênis branco premium", "Trocar tricô por polo de malha no calor"]'),

('Date à Tarde', 'Café, almoço ou passeio — presença sem exagero.', 'date', 'casual-premium', 'calor', 'facil', 'branco',
'["Camisa branca de linho ou algodão aberta", "Camiseta branca lisa por baixo", "Calça jeans reta escura", "Tênis branco limpo", "Óculos de sol clássico"]',
'A camisa aberta funciona como terceira peça leve: cria camada e intenção sem esquentar. Branco sobre branco com denim escuro é fresco e confiante.',
'["Fechar a camisa e tirar a camiseta à noite", "Trocar jeans por chino bege", "Trocar camisa branca por listrada fina"]'),

('Workwear de Meia-Estação', 'Dia a dia urbano com personalidade e praticidade.', 'dia-a-dia', 'streetwear-maduro', 'meia-estacao', 'intermediario', 'marrom',
'["Overshirt marrom ou caramelo", "Camiseta off-white", "Calça jeans reta crua ou escura", "Bota de trabalho ou tênis robusto", "Meia grossa aparente"]',
'A overshirt em tom terroso sobre base clara é o uniforme workwear: masculino, prático e cheio de textura. Funciona amassado — é parte da proposta.',
'["Trocar overshirt por jaqueta jeans", "Trocar bota por tênis branco robusto", "Adicionar gorro em dias frios"]'),

('Trabalho Elegante de Inverno', 'Escritório e reuniões em dias frios.', 'trabalho', 'elegante-casual', 'frio', 'intermediario', 'cinza',
'["Tricô cinza de gola alta", "Blazer desestruturado grafite", "Calça alfaiataria escura", "Chelsea boot preta", "Cinto preto"]',
'Camadas de cinza com texturas distintas (lã, alfaiataria, couro) constroem autoridade sem gravata. A gola alta moderniza o blazer.',
'["Trocar gola alta por camisa e tricô de gola V", "Trocar blazer por sobretudo em dias muito frios", "Aliviar com tênis minimalista em ambientes informais"]'),

('Faculdade Sem Esforço', 'Aula, biblioteca e rotina de estudos com imagem cuidada.', 'faculdade', 'casual-premium', 'calor', 'facil', 'cinza',
'["Camiseta cinza mescla lisa", "Calça jeans reta", "Tênis branco limpo", "Mochila minimalista preta"]',
'Prova de que rotina não precisa de descuido: três neutros, caimento certo e um tênis impecável já colocam você acima da média do campus.',
'["Adicionar camisa aberta como terceira peça", "Trocar jeans por bermuda de sarja em dias quentes", "Trocar camiseta por polo em apresentações"]'),

('Viagem Confortável Premium', 'Aeroporto e longas horas de trajeto sem abrir mão do estilo.', 'viagem', 'minimalista', 'meia-estacao', 'facil', 'preto',
'["Camiseta preta de tecido premium", "Calça jogger de alfaiataria preta", "Tênis confortável preto e branco", "Moletom ou cardigan neutro na mão", "Mochila estruturada"]',
'Conforto total com aparência intencional: o jogger de alfaiataria engana bem, e a paleta preta esconde amassados de viagem.',
'["Trocar jogger por calça de sarja stretch", "Adicionar boné para voos matinais", "Camadas removíveis para variação térmica"]'),

('Evento Casual de Verão', 'Churrasco, festa ao ar livre e encontros de fim de tarde.', 'evento-casual', 'casual-premium', 'calor', 'facil', 'verde',
'["Camisa de manga curta verde militar", "Camiseta branca por baixo", "Calça chino bege clara", "Tênis branco ou alpargata de couro", "Óculos de sol"]',
'Verde militar ancorado em branco e bege é a combinação avançada mais segura que existe. A camisa aberta dá camada sem calor.',
'["Fechar a camisa para visual mais limpo", "Trocar chino por bermuda alinhada", "Trocar verde por azul petróleo"]'),

('Noite de Inverno Vinho', 'Bar, jantar e eventos noturnos com um toque de cor.', 'noite', 'noturno', 'frio', 'avancado', 'vinho',
'["Tricô vinho de gola redonda", "Calça alfaiataria preta", "Sobretudo cinza grafite", "Chelsea boot preta", "Relógio de couro preto"]',
'O vinho entra como cor avançada ancorada em preto e grafite — sofisticado e raro de ver, sem nunca gritar. Textura do tricô contra a lã do sobretudo fecha o look.',
'["Trocar tricô vinho por navy", "Trocar sobretudo por jaqueta de couro", "Camisa preta por baixo do tricô em jantares formais"]'),

('Date Chuvoso', 'Encontro em dia frio e chuvoso — aconchegante e intencional.', 'date', 'elegante-casual', 'frio', 'intermediario', 'marrom',
'["Tricô marrom ou caramelo", "Camisa branca por baixo com gola aparente", "Calça jeans escura reta", "Chelsea boot marrom", "Jaqueta ou sobretudo neutro"]',
'Tons terrosos transmitem calor e proximidade — perfeitos para dates. A gola branca aparente ilumina o rosto e mostra capricho.',
'["Trocar tricô por cardigan", "Trocar chelsea por bota de couro escura", "Sem a camisa, com camiseta branca, para versão mais casual"]'),

('Street Noturno', 'Rolê à noite com atitude urbana.', 'noite', 'streetwear-maduro', 'meia-estacao', 'intermediario', 'preto',
'["Camiseta preta oversized na medida", "Calça cargo preta", "Jaqueta bomber preta", "Tênis robusto preto", "Corrente prata discreta"]',
'All black com volumes urbanos: o bomber estrutura os ombros e a cargo dá o DNA street. A corrente é a única nota de brilho — e basta.',
'["Trocar bomber por jaqueta de couro", "Trocar cargo por jeans preto reto", "Adicionar gorro preto no frio"]'),

('Primeiro Dia de Trabalho', 'Causar boa impressão sem parecer engessado.', 'trabalho', 'elegante-casual', 'meia-estacao', 'facil', 'azul',
'["Camisa azul clara passada", "Calça alfaiataria navy", "Sapato de couro marrom escuro", "Cinto marrom", "Relógio clássico"]',
'Azul sobre navy é seguro, confiável e levemente acima da média — exatamente a mensagem de um primeiro dia. Zero risco, presença garantida.',
'["Adicionar blazer navy se o ambiente for formal", "Trocar sapato por tênis branco premium se for startup", "Mangas dobradas após o almoço"]'),

('Minimalista de Inverno', 'Dia a dia frio com silhueta limpa e monocromática.', 'dia-a-dia', 'minimalista', 'frio', 'intermediario', 'cinza',
'["Tricô cinza claro de gola redonda", "Calça de alfaiataria cinza escura", "Tênis branco minimalista", "Sobretudo cinza médio", "Cachecol tom sobre tom"]',
'Três tons de cinza em texturas diferentes: o degradê monocromático é a assinatura minimalista. Alongar a silhueta com o sobretudo eleva qualquer estatura.',
'["Trocar sobretudo por parka em dias de chuva", "Adicionar gola alta preta sob o tricô", "Trocar tênis por chelsea boot"]'),

('Viagem Urbana de Inverno', 'Explorar uma cidade fria com estilo e mobilidade.', 'viagem', 'streetwear-maduro', 'frio', 'avancado', 'verde',
'["Parka verde militar", "Moletom cinza liso", "Calça jeans preta reta", "Bota ou tênis robusto impermeável", "Gorro preto"]',
'A parka é a peça técnica que segura o frio; o resto do look permanece neutro para não competir. Verde militar + cinza + preto é trio urbano à prova de erro.',
'["Trocar parka por puffer preto", "Camiseta térmica por baixo em frio intenso", "Trocar bota por tênis de trilha urbano"]'),

('Domingo Elegante', 'Brunch, missa, visita à família — arrumado sem formalidade.', 'evento-casual', 'minimalista', 'meia-estacao', 'facil', 'bege',
'["Polo de malha bege ou off-white", "Calça de sarja marrom clara", "Tênis branco ou mocassim de couro", "Cinto de couro claro", "Relógio de couro"]',
'A polo de malha é o meio-termo perfeito entre camiseta e camisa. Tons de areia e terra criam um visual sereno, maduro e acessível.',
'["Trocar polo por camisa de linho", "Trocar sarja por jeans claro", "Adicionar cardigan leve no fim da tarde"]');

-- ---------- Peças do guarda-roupa ----------

insert into public.wardrobe_items (name, category, priority, description, how_to_use) values

-- Camisetas
('Camiseta branca lisa', 'camisetas', 'essencial', 'Base para looks limpos, casuais e fáceis de combinar.', 'Combina com jeans, alfaiataria casual, jaquetas e tênis branco.'),
('Camiseta preta lisa', 'camisetas', 'essencial', 'A peça de presença: base de looks noturnos e monocromáticos.', 'Use com calça escura e terceira peça para dates e noite; com jeans claro para contraste de dia.'),
('Camiseta off-white', 'camisetas', 'essencial', 'Alternativa mais sofisticada ao branco puro, com tom mais quente.', 'Perfeita com tons terrosos, bege, verde militar e denim cru.'),
('Camiseta cinza mescla', 'camisetas', 'intermediaria', 'Neutro versátil que adiciona textura visual mesmo lisa.', 'Base de looks casuais; funciona sob overshirts e jaquetas de qualquer neutro.'),
('Camiseta pesada oversized (na medida)', 'camisetas', 'avancada', 'Tecido encorpado com caimento estruturado, essência do street maduro.', 'Com cargo ou jeans reto e tênis robusto; evite volume também na parte de baixo.'),

-- Camisas
('Camisa oxford branca', 'camisas', 'essencial', 'A camisa mais versátil que existe: do casual ao formal.', 'Fechada com alfaiataria para o trabalho; aberta sobre camiseta como terceira peça casual.'),
('Camisa oxford azul clara', 'camisas', 'essencial', 'O clássico do trabalho casual — combina com todos os neutros.', 'Com chino caqui ou navy e sapato de couro; mangas dobradas para descontrair.'),
('Camisa de linho', 'camisas', 'intermediaria', 'A resposta elegante para o calor: leve, texturizada e sofisticada.', 'Aberta sobre camiseta em dias quentes; fechada com chino em eventos de verão.'),
('Overshirt neutra (caqui, cinza ou navy)', 'camisas', 'essencial', 'A terceira peça mais versátil do guarda-roupa moderno.', 'Sobre camiseta lisa em qualquer look casual; substitui jaqueta na meia-estação.'),
('Camisa preta', 'camisas', 'intermediaria', 'Presença imediata para looks noturnos mais arrumados.', 'Com calça preta ou cinza escura para jantares e eventos à noite.'),

-- Calças
('Calça jeans reta escura', 'calcas', 'essencial', 'A calça mais coringa: funciona do casual ao elegante casual.', 'Com qualquer camiseta ou camisa; a lavagem escura aceita até blazer casual.'),
('Calça de alfaiataria casual cinza', 'calcas', 'essencial', 'Eleva instantaneamente qualquer parte de cima simples.', 'Com camiseta e tênis para casual premium; com tricô e chelsea para elegante.'),
('Calça chino bege ou caqui', 'calcas', 'essencial', 'O neutro quente que equilibra looks claros e de trabalho.', 'Com oxford azul e couro marrom no trabalho; com camiseta branca no fim de semana.'),
('Calça cargo preta reta', 'calcas', 'intermediaria', 'DNA street com maturidade — desde que o corte seja limpo.', 'Com moletom ou camiseta pesada e tênis robusto; evite volume em cima.'),
('Calça de alfaiataria preta', 'calcas', 'intermediaria', 'Base dos looks noturnos e monocromáticos escuros.', 'Com tricô ou camiseta preta e chelsea boot para presença máxima.'),

-- Jaquetas
('Jaqueta de couro (ou eco) preta', 'jaquetas', 'intermediaria', 'A peça de elevação definitiva para noite e dates.', 'Sobre camiseta lisa com calça escura; deixe-a ser a protagonista do look.'),
('Jaqueta jeans clássica', 'jaquetas', 'essencial', 'Terceira peça casual à prova de erro.', 'Sobre camiseta branca com chino ou calça de cor diferente do denim da jaqueta.'),
('Blazer desestruturado escuro', 'jaquetas', 'avancada', 'Sofisticação sem rigidez: sem ombreiras, com caimento natural.', 'Com camiseta ou tricô fino e alfaiataria casual; nunca com camisa social engomada.'),
('Bomber preta ou navy', 'jaquetas', 'intermediaria', 'Silhueta urbana que estrutura os ombros.', 'Com camiseta e cargo para street; com tricô fino para versão elegante.'),
('Sobretudo cinza ou camelo', 'jaquetas', 'avancada', 'A peça de inverno que alonga a silhueta e eleva tudo.', 'Sobre looks monocromáticos; deixe o comprimento abaixo do joelho fazer o trabalho.'),

-- Calçados
('Tênis branco minimalista', 'calcados', 'essencial', 'O calçado mais versátil do método — mantenha impecável.', 'Com absolutamente tudo, do jeans à alfaiataria casual. Limpe toda semana.'),
('Chelsea boot preta ou marrom', 'calcados', 'intermediaria', 'Eleva looks de trabalho, noite e inverno instantaneamente.', 'Com alfaiataria, jeans escuro e sobretudo; a bota define o nível do look.'),
('Tênis robusto (chunky controlado)', 'calcados', 'intermediaria', 'Base dos looks street maduro com presença.', 'Com cargo, jeans reto e volumes urbanos; evite com alfaiataria fina.'),
('Sapato casual de couro marrom', 'calcados', 'intermediaria', 'O acabamento clássico dos looks de trabalho.', 'Com chino e oxford; sempre com cinto na mesma cor.'),
('Bota de trabalho (couro ou camurça)', 'calcados', 'avancada', 'Textura e masculinidade para looks workwear e de inverno.', 'Com jeans cru, overshirt e camadas terrosas; melhora com o uso.'),

-- Acessórios
('Relógio discreto (couro ou aço)', 'acessorios', 'essencial', 'O acessório masculino definitivo: presença silenciosa.', 'Todos os dias. Couro para looks quentes, aço para looks frios e noite.'),
('Cinto de couro marrom e preto', 'acessorios', 'essencial', 'Acabamento obrigatório em looks com camisa ou alfaiataria.', 'Sempre na cor do calçado. Fivela discreta, sem logos.'),
('Óculos de sol clássico', 'acessorios', 'intermediaria', 'Moldura atemporal (wayfarer, aviador ou retangular) que valoriza o rosto.', 'Looks de dia, viagem e verão; evite modelos espelhados ou esportivos com looks arrumados.'),
('Corrente fina prata', 'acessorios', 'avancada', 'Nota de brilho para looks street e noturnos.', 'Sobre camiseta lisa escura; uma corrente só, sempre discreta.'),
('Boné neutro sem logo', 'acessorios', 'intermediaria', 'Acabamento casual para looks de dia e viagem.', 'Com looks casuais e street; nunca com alfaiataria ou eventos arrumados.');
