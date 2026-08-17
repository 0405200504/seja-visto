-- 00029: novos 8 módulos do MPO (capas novas) + currículo correspondente.
-- Aplicado em produção via PostgREST; arquivo aqui é o histórico da mudança.

update public.modules set title = 'Boas Vindas', description = 'Comece por aqui: o que é o MPO, como o método funciona e o diagnóstico que mostra o seu ponto de partida.', cover_image_url = '/modulos/01-boas-vindas.webp' where id = '10000000-0000-4000-8000-000000000001';
update public.lessons set title = 'Bem-vindo ao MPO', content = 'Se você chegou até aqui é porque já abriu o guarda-roupa cheio e sentiu que não tinha nada pra vestir. O MPO existe pra resolver isso — e não é com mais roupa. É com critério.

## O que muda quando você terminar

- Montar look sem travar, usando o que você já tem
- Comprar com critério, sem peça parada no armário
- Ter uma imagem que combina com quem você é

Estilo não é dom. É repertório mais repetição. Ninguém aqui vai te mandar virar outra pessoa: o método é sobre vestir melhor a pessoa que você já é.

## Como aproveitar de verdade

- Faça na ordem. Cada módulo assume o anterior.
- Marque a aula como concluída ao terminar — é assim que a plataforma sabe de onde você parou.
- Aplique no mesmo dia. Aula lida e não usada vira só informação.', order_index = 1 where id = 'f3b9103e-841f-4f53-b048-cef562ba70de';
update public.lessons set title = 'Como o método funciona', content = 'O MPO é dividido em 8 módulos que seguem a ordem natural de quem está construindo estilo do zero.

## A trilha completa

- Boas Vindas: onde você está e pra onde vai
- Fundamentos: os 6 pilares de qualquer look
- Armário Essencial: as peças que sustentam tudo
- Combinações Inteligentes: fórmulas prontas pra repetir
- Cores: o que combina com o quê e por quê
- Roupas pra Tipo de Corpo: o que valoriza o seu
- Tamanho e Caimento: o detalhe que separa roupa bonita de homem bem vestido
- Use o MPO no Dia a Dia: virar hábito

## Ritmo sugerido

- 1 módulo por semana, ou 2 aulas por dia se estiver com pressa
- As aulas são em texto e curtas de propósito: você lê em minutos e volta pra consultar quando precisar

Não pule os Fundamentos pra ir direto nas fórmulas. Fórmula sem fundamento vira cópia — e cópia só funciona enquanto o cenário for igual.', order_index = 2 where id = '80498ca3-d6ab-4a58-8765-9e596469d62a';
update public.lessons set title = 'O que tem dentro da plataforma', content = 'O método é uma parte. A plataforma inteira foi feita pra você usar no dia a dia.

## Tudo que está liberado pra você

- Catálogo de Outfits: combinações prontas por ocasião, estilo e clima
- Estilos: as principais referências explicadas, com foto
- Guarda-Roupa: cadastre o que você tem e veja o que dá pra montar hoje
- Fit Check: manda a foto do look e recebe a análise na hora
- Plano de Ação: o desafio de 7 dias
- Mais Procurados e Bônus: peças e marcas que valem o dinheiro

## Seus primeiros 15 minutos

- Termine este módulo
- Preencha seu perfil de estilo
- Salve 5 outfits que você usaria amanhã

A plataforma funciona melhor quando ela sabe quem é você. Comece preenchendo.', order_index = 3 where id = 'b1a60ec7-4832-43a2-8352-1af17d9a314c';
update public.lessons set title = 'Seu ponto de partida', content = 'Antes de mudar qualquer coisa é preciso saber de onde você está saindo. Esse é o único exercício do módulo — leva 10 minutos e vale por todo o resto.

## Responda com sinceridade

- Quais são as 3 peças que eu mais uso? Por que elas?
- Quando foi a última vez que me senti bem vestido? O que eu estava usando?
- Que imagem eu quero passar: discreto e confiável, moderno e urbano, elegante, criativo?
- Onde eu passo a maior parte do meu tempo: trabalho, faculdade, rua, eventos?

## Agora abra o armário

- Separe tudo em 3 pilhas: uso sempre, uso às vezes, nunca uso
- Fotografe a pilha "uso sempre" — esse é o seu estilo real hoje
- Olhe a pilha "nunca uso" e escreva ao lado de cada peça o motivo: não serve, não combina com nada, não é a minha cara

Guarde essas anotações. Você vai usar elas no Armário Essencial e no Plano de Ação. Estilo bom é o que você repete: comece pelo que já funciona e amplie a partir dali.', order_index = 4 where id = '24281218-fce8-49ce-ac64-20f4b09ca77e';
update public.modules set title = 'Fundamentos', description = 'Caimento, proporção, cores, texturas, ocasião e terceira peça: os 6 pilares que separam roupa bonita de look bem construído.', cover_image_url = '/modulos/02-fundamentos.webp' where id = '10000000-0000-4000-8000-000000000002';
update public.modules set title = 'Armário Essencial', description = 'As peças que sustentam qualquer combinação: essenciais, coringas, as que elevam o visual — e a ordem certa de comprar.', cover_image_url = '/modulos/03-armario-essencial.webp' where id = '10000000-0000-4000-8000-000000000003';
update public.modules set title = 'Combinações Inteligentes', description = 'A lógica por trás de um look que funciona e as fórmulas prontas pra repetir em cada ocasião.', cover_image_url = '/modulos/04-combinacoes-inteligentes.webp' where id = '10000000-0000-4000-8000-000000000004';
update public.lessons set order_index = 2 where id = '6e48d52a-1c63-47ae-b760-ae0b4d5a7e92';
update public.lessons set order_index = 3 where id = '1122c3bd-4815-4842-beb0-25d341827784';
update public.lessons set order_index = 4 where id = 'e64ec7ef-c9d6-4708-9e6a-45d733414d04';
update public.lessons set order_index = 5 where id = 'db838cd1-6e3f-41d3-bf7d-d1700f0829cf';
update public.lessons set order_index = 6 where id = 'afe14687-7970-4867-92f9-bed6d1224f45';
update public.lessons set order_index = 7 where id = 'cd2dec9d-153b-4519-95bd-305c276f1747';
insert into public.lessons (module_id, title, content, order_index) values ('10000000-0000-4000-8000-000000000004', 'A lógica de uma combinação que funciona', 'Antes das fórmulas, entenda o mecanismo. Toda combinação que funciona tem a mesma estrutura por trás — e quem entende a estrutura monta look novo sozinho.

## A estrutura de qualquer look

- Base: parte de cima e parte de baixo, quase sempre em neutro
- Silhueta: um volume por look, o resto limpo
- Terceira peça: o que transforma "roupa" em "look"
- Acabamento: calçado limpo e, no máximo, um acessório discreto

## As três perguntas antes de sair de casa

- As cores conversam? (neutros dominando, no máximo uma cor)
- A proporção está equilibrada? (largo em cima pede reto embaixo)
- É adequado ao lugar pra onde eu vou?

Três "sim" e o look funciona. As fórmulas a seguir são atalhos testados dessa mesma lógica: copie à risca no começo, porque autoria vem depois da repetição.', 1);
update public.modules set title = 'Cores', description = 'Dos neutros que nunca erram à cor de destaque: o que combina com o quê, e por quê.', cover_image_url = '/modulos/05-cores.webp' where id = '10000000-0000-4000-8000-000000000005';
update public.lessons set title = 'Como a cor funciona no look', content = 'Antes de decorar combinação, entenda a lógica. Cor não é questão de gosto: é questão de contraste. O que decide se o look funciona não é a cor em si, é o quanto os tons conversam entre si.

## As três famílias

- Neutros: preto, branco, off-white, cinza, navy, bege, caqui e marrom. Combinam entre si sempre.
- Cores fechadas: verde militar, vinho, azul petróleo, mostarda queimada. Entram como protagonista, uma por vez.
- Cores abertas: vermelho vivo, azul royal, amarelo. Só em detalhe pequeno.

## As duas regras que resolvem 90%

- 80/20: oitenta por cento do look em neutros, vinte em cor. No máximo.
- Uma cor por vez: dois protagonistas no mesmo look sempre viram briga.

## Faça agora

- Conte quantas peças do seu armário são neutras
- Se for menos da metade, esse é o seu gargalo de combinação: não falta roupa, falta base', order_index = 1 where id = '97dcb2ff-5d3e-4f3b-a198-e1747f71898e';
update public.lessons set title = 'Combinações neutras', content = 'Neutro com neutro sempre combina. Essa é a fundação de tudo que vem depois.

## Fórmulas monocromáticas e duplas

- Preto + cinza (contraste suave, presença alta)
- Off-white + bege (claro, sofisticado, ideal pro dia)
- Navy + branco (o clássico que nunca falha)
- Grafite + preto (noite, elegância imediata)

Em look de um tom só, varie as texturas pra dar profundidade — revise a aula de texturas dos Fundamentos.', order_index = 2 where id = '723ae8f6-e2fd-40c4-8f5e-b09cb3516f02';
update public.lessons set title = 'Combinações seguras', content = 'O próximo passo: adicionar um terceiro tom sem correr risco.

## Trios que funcionam sempre

- Branco + navy + bege
- Preto + cinza + branco
- Off-white + marrom + caqui
- Navy + cinza + branco

A regra 60/30/10: 60% do look no tom dominante, 30% no secundário e 10% no detalhe (calçado, cinto, acessório).', order_index = 3 where id = 'd4b0a02e-15f0-4354-a3d1-85a69a68ba2e';
update public.lessons set title = 'Cor de destaque', content = 'A cor de destaque são os 10% que fazem o look parecer intencional: um detalhe que chama o olhar sem gritar.

## Onde aplicar

- Tênis com detalhe colorido em look neutro
- Camiseta de cor fechada sob overshirt neutra
- Acessório (boné, corrente, pulseira) em look monocromático

Nunca duas cores de destaque no mesmo look. Uma nota certa vale mais que um acorde desafinado.', order_index = 4 where id = '341a27e1-1edc-4a6f-b8d8-5f0e72e568dd';
update public.lessons set title = 'Combinações avançadas', content = 'Cores fechadas não-neutras — verde militar, vinho, azul petróleo — elevam o repertório quando entram no lugar certo.

## Como introduzir

- Uma cor avançada por look, sempre ancorada em neutros
- Verde militar conversa com preto, bege e branco
- Vinho conversa com cinza, navy e preto
- Prefira a cor avançada na terceira peça ou na parte de cima

Se estiver em dúvida se combina, não combina. Volte um passo pro trio seguro.', order_index = 5 where id = '2d3c4b7a-537d-4a5b-9acb-77a89ff452c8';
update public.modules set title = 'Roupas pra Tipo de Corpo', description = 'Identifique a sua silhueta e descubra os cortes que equilibram o seu corpo — sem precisar esconder nada.', cover_image_url = '/modulos/06-roupas-tipo-de-corpo.webp' where id = '10000000-0000-4000-8000-000000000006';
update public.lessons set title = 'Qual é o seu tipo de corpo', content = 'Não existe corpo errado — existe roupa mal escolhida pro corpo que a pessoa tem. O objetivo aqui não é esconder nada: é escolher cortes que equilibram a sua silhueta.

## Identifique o seu em 2 minutos

De frente pro espelho, com roupa justa ou sem camisa:

- Ombro claramente mais largo que o quadril: triângulo invertido (comum em quem treina)
- Ombro e quadril na mesma linha, cintura pouco marcada: retangular
- Mais volume concentrado no meio do tronco: oval
- Muito magro, membros longos: alongado
- Até cerca de 1,72m: a variável que manda é a altura, não a largura

## Duas perguntas que valem mais que a categoria

- Meu tronco é longo e minhas pernas curtas, ou o contrário?
- Onde meu corpo tem mais volume: em cima ou embaixo?

A resposta define o resto do módulo. A lógica é sempre a mesma: colocar volume onde falta e limpar onde sobra.', order_index = 1 where id = '9c240d8d-6b56-4bb6-96e7-1654d36d57b5';
update public.lessons set title = 'Se você é magro ou alto', content = 'Aqui o desafio não é esconder, é ocupar espaço com intenção.

## O que funciona

- Camadas: camiseta + overshirt + jaqueta criam o volume que o corpo não tem
- Tecidos com peso e textura: moletom denso, sarja, tricô canelado, jeans rígido
- Corte reto ou levemente largo — slim colado só reforça a magreza
- Listra horizontal na parte de cima amplia os ombros
- Se você é muito alto: quebre a linha com contraste (parte de cima clara, calça escura)

## O que atrapalha

- Peças justas em malha fina: elas somem com você
- Monocromia total quando você é muito alto — vira uma linha vertical sem pausa
- Calça curta demais, que alonga ainda mais a perna

Comece pela terceira peça. É a mudança que dá mais resultado em quem é magro.', order_index = 2 where id = 'a5133ca6-e416-4063-aa46-49cce9c921e4';
update public.lessons set title = 'Se você é baixo ou mais largo', content = 'Aqui a meta é uma linha vertical limpa e contínua: o olho de quem vê precisa subir sem tropeço.

## Se você é baixo

- Monocromia ou tons próximos de cima a baixo — alonga a silhueta
- Cintura da calça na altura certa, nunca caída, pra não encurtar a perna
- Camiseta terminando no meio do zíper: camiseta longa corta você ao meio
- Volume controlado — calça larga demais come centímetros
- Bico do calçado mais alongado ajuda mais que sola alta

## Se você é mais largo

- Corte reto é o seu melhor amigo: nem justo, que marca, nem gigante, que empilha volume
- Tons escuros e fechados na base, textura lisa no tronco
- Camisa aberta ou overshirt cria duas linhas verticais que afinam a silhueta
- Fuja de malha fina e brilhante, que marca tudo
- Ombro no lugar certo resolve mais que pedir um tamanho maior: peça grande demais engorda

## A regra geral

Vertical alonga, horizontal alarga. Sabendo disso, você decide sozinho em qualquer prova de roupa.', order_index = 3 where id = 'c1ad6246-fda2-4f8a-99c5-648fadd86f5c';
update public.lessons set title = 'Ajustes que servem pra qualquer corpo', content = 'Quatro truques de proporção que funcionam independentemente do seu tipo de corpo.

## Os quatro

- Ponto de cintura: deixe claro onde termina a parte de cima (comprimento certo ou camiseta por dentro)
- Volume alternado: se em cima é largo, embaixo é reto — e vice-versa
- Ombro como referência: a costura no osso do ombro conserta a silhueta inteira
- Calçado proporcional: calça larga pede calçado com peso, calça reta pede tênis limpo

## Como testar

- Monte o look, fotografe de corpo inteiro e olhe a foto — o espelho engana
- Pergunta única: o corpo parece equilibrado ou alguma parte está pesando demais?
- Mude uma variável por vez (troque só a calça) e fotografe de novo

Salve as fotos que funcionaram. Elas viram o seu manual pessoal, mais útil que qualquer regra geral. Se quiser uma segunda opinião na hora, mande a foto no Fit Check.', order_index = 4 where id = '5286019e-5146-4bba-a4a5-3722d1663945';
update public.modules set title = 'Tamanho e Caimento', description = 'Medida certa, pontos de checagem e o ajuste no alfaiate: o detalhe que separa roupa bonita de homem bem vestido.', cover_image_url = '/modulos/07-tamanho-e-caimento.webp' where id = '10000000-0000-4000-8000-000000000007';
update public.lessons set title = 'Tamanho não é P, M ou G', content = 'Todo mundo já comprou um M que serviu numa marca e ficou ridículo em outra. O problema não é você: P/M/G não significa nada, porque cada marca usa a própria régua.

## O que importa de verdade

- A medida da peça, não a letra da etiqueta — quase toda loja online mostra a tabela em centímetros
- Suas medidas: ombro a ombro, tórax, comprimento do tronco, cintura e comprimento da perna
- A peça que já cai bem em você é a régua: meça ela deitada na cama e compare antes de comprar

## Faça hoje, leva 10 minutos

- Pegue a camiseta que melhor cai em você
- Meça ombro a ombro (de costura a costura), a largura do peito na altura da axila e o comprimento do ombro até a barra
- Anote no celular

Essa anotação evita 90% das compras online erradas. Etiqueta é sugestão; centímetro é fato.', order_index = 1 where id = 'eceb68a9-255d-4e9c-9d6d-8ea198b616ad';
update public.lessons set title = 'Os pontos que definem um bom caimento', content = 'Caimento se avalia em pontos específicos, não no "achei que ficou bom".

## Parte de cima

- Ombro: a costura termina no osso do ombro — é o único ponto que o alfaiate quase não conserta, então acerte na compra
- Peito: cabe uma mão espalmada entre o corpo e o tecido, sem sobra balonando
- Manga curta termina no meio do bíceps; manga longa, no osso do pulso
- Comprimento: meio do zíper da calça, nunca cobrindo o bolso de trás

## Parte de baixo

- Cós no lugar sem depender do cinto pra segurar
- Quadril e coxa sem marcar bolso nem repuxar
- Barra com no máximo uma dobra de tecido sobre o calçado
- Sem sobra acumulada no tornozelo: é o erro mais comum e o mais visível de longe

## Dois testes rápidos

- Levante os braços: se a barra da camiseta subir muito acima do cós, está curta
- Sente-se: se a calça repuxar no joelho ou na coxa, está apertada', order_index = 2 where id = '81748a03-4763-4108-92f0-21c55998cfec';
update public.lessons set title = 'Oversized bem feito x roupa grande demais', content = 'Oversized é uma escolha de corte. Roupa grande demais é acidente. De longe, a diferença é óbvia.

## Oversized funciona quando

- O ombro cai de propósito, numa linha reta e limpa — a peça foi desenhada assim
- O tecido tem peso e sustenta a forma, sem murchar no corpo
- Só uma parte do look é volumosa: top largo com calça reta, ou calça larga com top ajustado
- O comprimento continua certo: largo não quer dizer longo

## Está grande demais quando

- A costura do ombro desce sem linha definida e o tecido enruga na axila
- A peça desaba e some com a sua silhueta
- Tudo é largo ao mesmo tempo e você vira um bloco
- A barra da calça amassa em três dobras em cima do tênis

Regra prática: um volume por look, o resto limpo.', order_index = 3 where id = 'f9f8a8a3-50ee-4340-afb6-311b6c470e87';
update public.lessons set title = 'Alfaiate: o upgrade mais barato que existe', content = 'Um ajuste de R$ 20 a R$ 60 muda mais a sua imagem do que uma peça nova de R$ 300. É o melhor retorno do método inteiro.

## O que vale ajustar

- Barra da calça: o ajuste mais transformador de todos
- Afunilar a perna da calça que ficou larga demais embaixo
- Cintura da calça que sobra atrás
- Manga de camisa e comprimento de camiseta
- Estreitar a lateral de camisa que balona nas costas

## O que não vale

- Ombro de camisa, jaqueta ou blazer: caro e raramente fica bom
- Peça de tecido muito ruim: ajustar roupa barata demais é jogar dinheiro fora

## Como fazer

- Junte 4 ou 5 peças e leve tudo de uma vez
- Vá vestindo a peça, com o calçado que você usa com ela
- Exija que o alfaiate marque com alfinete no seu corpo, nunca "no olho"

Comece pelas peças que você já usa toda semana. O efeito aparece no dia seguinte.', order_index = 4 where id = 'b6edabe3-9f81-47c1-90d1-1ec583d2d2f4';
update public.modules set title = 'Use o MPO no Dia a Dia', description = 'Como transformar o método em rotina: catálogo de outfits, Fit Check, desafio de 7 dias e a manutenção do seu estilo.', cover_image_url = '/modulos/08-mpo-no-dia-a-dia.webp' where id = '10000000-0000-4000-8000-000000000008';
update public.lessons set title = 'Sua rotina com o MPO', content = 'O método só vira estilo quando encosta na rotina. Esse é o jeito mais rápido de usar a plataforma no dia a dia.

## Toda semana, 10 minutos no domingo

- Veja a previsão do tempo da semana
- Abra o Catálogo de Outfits, filtre por ocasião e clima e escolha 3 looks
- Confira se você tem as peças (ou adapte com o que tem) e favorite
- Se faltar alguma peça, ela entra na lista de compras — não no improviso de terça-feira

## Todo dia, 2 minutos

- Abra o favorito da ocasião de hoje e vista
- Fotografe antes de sair: a foto mostra o que o espelho esconde

Decisão tomada com calma no domingo vale mais que inspiração às 7h da manhã.', order_index = 1 where id = 'a066f48f-f778-490d-ad69-49b2aeeba97a';
update public.lessons set title = 'Cada ferramenta e quando usar', content = 'A plataforma tem seis áreas. Saber quando usar cada uma economiza muito tempo.

## O mapa

- Catálogo de Outfits: quando você não sabe o que vestir — combinações prontas por ocasião, estilo e clima
- Estilos: quando quer entender uma referência antes de adotar
- Guarda-Roupa: cadastre o que você tem e veja o que já dá pra montar hoje
- Fit Check: mande a foto do look e receba a análise antes de sair de casa
- Mais Procurados e Bônus: na hora de comprar, pra não errar peça nem marca
- Plano de Ação: quando quiser executar em sequência, sem pensar

## Se for pra manter um hábito só

Fotografe o look e passe no Fit Check. É a correção mais rápida que existe — e vale mais que reler qualquer aula.', order_index = 2 where id = 'f1692f3a-c238-4e6a-8bb8-357abce3c5fa';
update public.lessons set title = 'O desafio de 7 dias', content = 'Conhecimento sem execução é entretenimento. O desafio de 7 dias transforma o método em prática: um dia, uma missão.

## Como funciona

- Cada dia tem missão, explicação e checklist
- As missões levam de 20 a 40 minutos
- Você registra as anotações e marca a conclusão na plataforma
- A progressão é: diagnóstico, base, neutros, terceira peça, acabamento, presença e registro

## Dicas de execução

- Faça no horário em que você se arruma normalmente
- Fotografe TODOS os resultados, inclusive os ruins
- Não pule dias: a sequência é parte do método
- Errar uma missão também é dado — anote o que não funcionou e por quê

Acesse o Plano de Ação no menu e comece pelo Dia 1. O melhor dia pra começar é hoje.', order_index = 3 where id = '95a50cbc-1b1d-4bf5-aaff-43abc6f19445';
update public.lessons set title = 'Checklist final e sua evolução', content = 'Ao fechar os 7 dias, valide o resultado — e depois transforme tudo em sistema.

## Você deve ter agora

- Guarda-roupa diagnosticado e higienizado
- 3 ou mais looks básicos validados no espelho
- 1 combinação neutra e 1 look com terceira peça testados
- Calçados limpos e acessórios definidos
- 1 look de saída com presença, fotografado
- Suas melhores referências salvas nos favoritos

## Rotina de manutenção

- Semanal: escolha os looks da semana no Catálogo de Outfits (10 minutos)
- Mensal: revise os favoritos e teste 1 combinação nova
- Trimestral: refaça o diagnóstico e atualize a lista de compras
- Sempre: aplique o checklist antes de comprar qualquer peça

Faltou algum item do checklist? Volte ao dia correspondente antes de seguir. Você agora tem repertório, critério e um sistema — consistência é o que transforma isso em identidade.', order_index = 4 where id = 'c1e26b38-c3fd-4f0b-b379-fda1583b307f';

update public.lessons set content = replace(content, 'Quando isso estiver no automático, o Guia de Cores libera as combinações avançadas.', 'Quando isso estiver no automático, o módulo de Cores libera as combinações avançadas.') where id = '10501270-e317-4289-a654-f7716b3d9fca';
update public.lessons set content = replace(content, 'O guarda-roupa base é o conjunto mínimo de peças', 'O armário essencial é o conjunto mínimo de peças') where id = 'f93c890f-0c9f-4cea-b2f6-a8d88bbfeef7';
update public.lessons set content = replace(content, 'Reveja seu diagnóstico do Módulo 1', 'Reveja o diagnóstico que você fez no módulo Boas Vindas') where id = 'e68b3128-d8cf-4a60-99f9-65529583953c';
