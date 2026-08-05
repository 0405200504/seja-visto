-- =============================================================
-- Lookbook Estilos 3.0: +38 refs, uma por foto nova das galerias
-- dos 4 estilos novos (usdrip, opium, sportlife, boho).
-- As 40 fotos entregues passaram por dedup perceptual: 2 do Opium
-- ja existiam em techwear e foram descartadas.
-- =============================================================

insert into public.looks (title, description, occasion, style, climate, level, base_color, image_url, pieces, why_it_works, adaptations) values

-- ---------- US Drip (10) ----------
('Hoodie Azul & Jeans Gráfico', 'Uniforme de faculdade com peças que chamam atenção sozinhas.', 'faculdade', 'usdrip', 'meia-estacao', 'intermediario', 'azul', '/estilos/usdrip/01.jpg',
'["Hoodie azul-claro com bordado", "Jeans preto com gráficos brancos", "Bapesta ou sneaker azul e branco", "Boné de aba reta azul", "Cinto de tachas prateado"]',
'O azul do hoodie, do boné e do tênis se repete três vezes e amarra o look — por isso o jeans gráfico pode ser barulhento sem virar bagunça.',
'["Trocar o jeans gráfico por preto liso para versão discreta", "Camiseta no lugar do hoodie no calor"]'),

('Total Pink & Jordan 4', 'Monocromático ousado com base branca.', 'dia-a-dia', 'usdrip', 'calor', 'avancado', 'branco', '/estilos/usdrip/02.jpg',
'["Camiseta branca de corte reto", "Short de moletom rosa com gráfico", "Jordan 4 rosa", "Trucker cap rosa sobre durag branco", "Corrente cubana com pingente"]',
'Quando a cor forte se repete no boné, no short e no tênis, ela vira proposta e não acidente — a camiseta branca é o respiro que impede o excesso.',
'["Trocar o rosa por preto para versão fácil", "Tênis branco para baixar o volume do look"]'),

('Denim Tears & Air Force', 'Hoodie statement com o tênis mais neutro que existe.', 'dia-a-dia', 'usdrip', 'meia-estacao', 'intermediario', 'azul', '/estilos/usdrip/03.jpg',
'["Hoodie azul com estampa de algodão", "Jeans de lavagem clara com rasgos", "Air Force 1 branco", "Relógio prateado"]',
'Peça statement pede pés neutros: o AF1 branco deixa o hoodie ser a única coisa que fala no look.',
'["Trocar o hoodie por moletom liso azul", "Jeans escuro sem rasgos para ambiente mais sério"]'),

('Preto & Vermelho de Noite', 'Gráfico pesado com Jordan combinando.', 'noite', 'usdrip', 'meia-estacao', 'avancado', 'preto', '/estilos/usdrip/04.jpg',
'["Jaqueta de moletom com zíper e gráfico preto e vermelho", "Jeans preto com detalhes vermelhos", "Jordan 5 preto e vermelho", "Corrente com pingente"]',
'O vermelho aparece na jaqueta, na calça e no tênis — repetir a cor de acento em três pontos é o que faz o look parecer montado, não sorteado.',
'["Calça preta lisa para reduzir a intensidade", "Camiseta preta no lugar da jaqueta no calor"]'),

('Branco, Cinza & Jordan 3', 'A fórmula mais fácil do estilo.', 'dia-a-dia', 'usdrip', 'calor', 'facil', 'cinza', '/estilos/usdrip/05.jpg',
'["Camiseta branca de tecido leve", "Jeans cinza stacked com rasgos", "Jordan 3 branco", "Boné aba reta preto", "Shoulder bag preta"]',
'Camiseta branca + jeans cinza é base neutra pura: todo o interesse vem do caimento empilhado da calça e do tênis.',
'["Trocar Jordan por AF1 branco", "Jeans sem rasgos para versão limpa"]'),

('Camiseta de Rapper & LV', 'Gráfico grande com acessórios dourados.', 'dia-a-dia', 'usdrip', 'calor', 'intermediario', 'azul', '/estilos/usdrip/06.jpg',
'["Camiseta preta com estampa grande", "Jeans de lavagem clara com rasgos", "Cinto de monograma", "Correntes e pulseiras douradas", "Air Force 1 branco"]',
'Preto em cima e denim claro embaixo cria contraste alto; o dourado dos acessórios aquece a paleta e dá o acabamento.',
'["Camiseta lisa preta para versão sóbria", "Cinto liso preto no lugar do monograma"]'),

('Regata & Short de Basquete', 'O look de verão mais direto do US Drip.', 'dia-a-dia', 'usdrip', 'calor', 'facil', 'branco', '/estilos/usdrip/07.jpg',
'["Regata branca canelada", "Short de basquete vermelho em mesh", "Jordan 3 branco e vermelho", "Boné vermelho de time"]',
'O boné e o tênis repetem o vermelho do short e fecham o look em sanduíche de cor — regata branca no meio para não pesar.',
'["Camiseta branca no lugar da regata", "Short preto para versão neutra"]'),

('Jeans Destruído & AF1', 'Camiseta simples com a calça fazendo o trabalho.', 'dia-a-dia', 'usdrip', 'meia-estacao', 'intermediario', 'azul', '/estilos/usdrip/08.jpg',
'["Camiseta navy com gráfico", "Jeans baggy muito destruído", "Air Force 1 branco", "Corrente prateada"]',
'Quando a calça é a peça mais complexa do look, tudo em cima precisa ser simples — camiseta lisa ou de gráfico pequeno e pronto.',
'["Jeans com menos rasgos para o dia a dia", "Trocar AF1 por bota no frio"]'),

('Jersey de NBA sobre Camiseta', 'Layering de quadra no calor.', 'dia-a-dia', 'usdrip', 'calor', 'facil', 'preto', '/estilos/usdrip/09.jpg',
'["Jersey de basquete preto e roxo", "Camiseta branca por baixo", "Jeans de lavagem clara com rasgos", "Air Force 1 branco"]',
'A camiseta branca por baixo do jersey resolve o problema das cavas largas e transforma a peça de quadra em roupa de rua.',
'["Jersey sozinho no calor forte", "Trocar jeans claro por preto à noite"]'),

('Branco Total & Denim Claro', 'Camiseta limpa com jeans trabalhado.', 'dia-a-dia', 'usdrip', 'calor', 'facil', 'branco', '/estilos/usdrip/10.jpg',
'["Camiseta branca lisa", "Jeans de lavagem clara com rasgos e reparos", "Air Force 1 branco e azul", "Durag ou bandana preta"]',
'Branco em cima e denim claro embaixo é a base mais leve do estilo — os detalhes do jeans dão o interesse sem precisar de estampa.',
'["Adicionar hoodie branco por cima no frio", "Corrente prateada para elevar o look"]'),

-- ---------- Opium (8) ----------
('Couro Preto & Cargo Lavada', 'A porta de entrada do estilo.', 'noite', 'opium', 'meia-estacao', 'intermediario', 'preto', '/estilos/opium/01.jpg',
'["Bomber de couro preta", "Hoodie preto por baixo", "Cargo jeans cinza-escuro larga", "Sneaker preto de sola grossa", "Pingente de cruz e óculos escuros"]',
'Tudo preto, mas com três materiais diferentes (couro, moletom, denim) — é a textura que cria profundidade quando não existe cor.',
'["Jaqueta de nylon no lugar do couro", "Calça preta lisa para versão mais limpa"]'),

('Cruzes & Correntes', 'Preto absoluto com brilho de prata.', 'noite', 'opium', 'meia-estacao', 'avancado', 'preto', '/estilos/opium/02.jpg',
'["Camiseta preta lisa", "Jeans baggy preto com aplicações de cruz", "Correntes e pulseiras prateadas", "Bota preta"]',
'A calça já é a peça statement: camiseta lisa em cima e prata nos acessórios é o suficiente para o look inteiro se sustentar.',
'["Jeans preto liso para o dia a dia", "Menos correntes para versão discreta"]'),

('Polo Gráfica & Cinto Zebra', 'Preto com um único detalhe claro.', 'faculdade', 'opium', 'meia-estacao', 'intermediario', 'preto', '/estilos/opium/03.jpg',
'["Polo preta com gráficos brancos", "Jeans baggy preto", "Cinto estampado claro", "Air Force 1 branco", "Correntes prateadas"]',
'Em um look todo preto, um único elemento claro (o cinto) marca a cintura e evita que o corpo vire um bloco só.',
'["Cinto preto liso para versão fechada", "Sneaker preto no lugar do branco"]'),

('Couro Alto & Nylon Técnico', 'Silhueta pesada com peças duras.', 'noite', 'opium', 'frio', 'avancado', 'preto', '/estilos/opium/04.jpg',
'["Jaqueta de couro preta de gola alta", "Calça cargo preta de nylon", "Cinto utilitário de detalhes metálicos", "Bota preta de sola tratorada", "Óculos escuros"]',
'Couro em cima e nylon embaixo dão brilhos diferentes ao mesmo preto — a silhueta larga na perna equilibra a jaqueta encorpada.',
'["Jaqueta de nylon no lugar do couro no calor", "Cinto liso para versão menos carregada"]'),

('Puffer & Gráfico Japonês', 'Inverno pesado com tênis branco.', 'noite', 'opium', 'frio', 'avancado', 'preto', '/estilos/opium/05.jpg',
'["Puffer preto com capuz de pelo", "Camiseta preta com estampa grande", "Calça preta em camadas de couro e denim", "Sneaker alto branco", "Correntes prateadas"]',
'O tênis branco é o único ponto claro e serve de âncora visual — sem ele, o look inteiro vira uma mancha escura.',
'["Sneaker preto para versão fechada", "Camiseta lisa se a estampa for demais"]'),

('Capuz, Jaqueta & Corrente', 'Camadas escuras com jeans lavado.', 'dia-a-dia', 'opium', 'meia-estacao', 'intermediario', 'cinza', '/estilos/opium/06.jpg',
'["Hoodie preto com capuz na cabeça", "Jaqueta jeans preta lavada por cima", "Jeans baggy cinza desbotado", "Corrente na cintura e cinto de tachas", "Jordan 1 preto e branco"]',
'Hoodie sob jaqueta é a camada mais fácil do estilo — o jeans desbotado tira o look do preto chapado e dá movimento.',
'["Sem a jaqueta em ambiente aquecido", "Jeans preto para versão mais dura"]'),

('Camiseta Gráfica & Tachas', 'O básico do estilo em três peças.', 'dia-a-dia', 'opium', 'meia-estacao', 'facil', 'preto', '/estilos/opium/07.jpg',
'["Camiseta preta com gráfico branco", "Jeans baggy preto desbotado", "Cinto de tachas prateado", "Gorro preto", "Anéis e pulseira prateados"]',
'Três peças e um acessório: é o look mais simples possível dentro do estilo, e funciona porque o cinto quebra a linha do preto.',
'["Cinto liso para o trabalho", "Camiseta lisa e corrente para versão limpa"]'),

('Biker de Couro & Jeans Rasgado', 'Atitude de rock com denim destruído.', 'noite', 'opium', 'meia-estacao', 'avancado', 'preto', '/estilos/opium/08.jpg',
'["Jaqueta biker de couro com lettering", "Camiseta manga longa branca estampada", "Jeans baggy destruído", "Bota preta", "Cinto e corrente prateados"]',
'A manga longa branca aparecendo sob o couro preto é o contraste que dá dimensão — sem ela o look fecharia demais.',
'["Camiseta preta por baixo para versão fechada", "Jeans liso para reduzir o ruído"]'),

-- ---------- Sportlife (10) ----------
('Seleção & Short de Moletom', 'Jersey no calor com base neutra.', 'dia-a-dia', 'sportlife', 'calor', 'facil', 'azul', '/estilos/sportlife/01.jpg',
'["Jersey azul da seleção brasileira", "Short de moletom cinza estampado", "Gorro branco", "Air Max TN preto", "Meia branca aparente"]',
'Jersey já traz cor e logo suficientes: short neutro e tênis escuro deixam a camisa ser o assunto do look.',
'["Trocar o short por jorts de denim", "Calça de tactel no frio"]'),

('Barça & Jorts de Denim', 'Camisa retrô com bermuda larga.', 'viagem', 'sportlife', 'calor', 'intermediario', 'azul', '/estilos/sportlife/02.jpg',
'["Jersey retrô do Barcelona", "Jorts de denim de lavagem média", "Sneaker branco e vermelho", "Corrente dourada e óculos escuros"]',
'O tênis puxa o vermelho da camisa e fecha o look — jorts em denim médio é o meio-termo que combina com qualquer jersey.',
'["Short de moletom no lugar do jorts", "Boné para completar a referência esportiva"]'),

('Inter de Milão & Jeans Claro', 'Jersey de time com denim desbotado.', 'dia-a-dia', 'sportlife', 'meia-estacao', 'facil', 'azul', '/estilos/sportlife/03.jpg',
'["Jersey listrado azul e preto", "Jeans baggy de lavagem bem clara", "Sneaker preto", "Sem acessórios"]',
'Denim claro embaixo abre o look e impede que o azul e preto da camisa pesem — é a combinação mais simples do estilo.',
'["Jeans escuro à noite", "Camiseta branca por baixo para layering"]'),

('Santos Preto & Tactel', 'Preto de ponta a ponta com um acento laranja.', 'dia-a-dia', 'sportlife', 'meia-estacao', 'intermediario', 'preto', '/estilos/sportlife/04.jpg',
'["Jersey preto de time", "Calça de tactel preta e larga", "Durag ou gorro preto", "Sneaker laranja", "Relógio digital"]',
'Todo o look em preto transforma o tênis laranja no único ponto de cor — é a maneira mais barata de fazer um outfit parecer intencional.',
'["Sneaker branco para versão neutra", "Short no lugar da calça no calor"]'),

('Agasalho da Seleção', 'Conjunto de tactel no frio.', 'dia-a-dia', 'sportlife', 'frio', 'facil', 'preto', '/estilos/sportlife/05.jpg',
'["Jaqueta de tactel preta e amarela da seleção", "Calça de tactel do mesmo conjunto", "Gorro preto", "Sneaker cinza e branco"]',
'Conjunto de tactel resolve o look inteiro: como jaqueta e calça já combinam, só falta escolher um tênis que não brigue com o amarelo.',
'["Separar a jaqueta e usar com jeans", "Camiseta branca por baixo em dia mais quente"]'),

('Tracksuit Retrô Completo', 'Conjunto vintage com tênis prateado.', 'evento-casual', 'sportlife', 'meia-estacao', 'intermediario', 'azul', '/estilos/sportlife/06.jpg',
'["Jaqueta de tactel navy com detalhes vermelhos", "Calça do mesmo conjunto", "Sneaker prateado", "Patches e detalhes retrô"]',
'O tracksuit dos anos 90 tem corte mais amplo e cores com memória — o tênis metálico é o detalhe atual que tira o look do figurino.',
'["Tênis branco para versão mais discreta", "Camiseta branca por baixo com o zíper aberto"]'),

('Brasil 94 & Jorts Preto', 'Camisa clássica com bermuda escura.', 'noite', 'sportlife', 'calor', 'intermediario', 'verde', '/estilos/sportlife/07.jpg',
'["Jersey amarelo retrô com losangos", "Jorts preto de corte carpenter", "Boné de monograma", "Air Max TN", "Óculos de grau"]',
'A camisa é cheia de cor e padrão, então tudo abaixo da cintura fica escuro e liso — regra que salva qualquer look com jersey estampado.',
'["Jorts de denim no lugar do preto", "Boné liso para reduzir o excesso"]'),

('Azul & Cargo Branca', 'Verão com New Balance de sola alta.', 'dia-a-dia', 'sportlife', 'calor', 'intermediario', 'azul', '/estilos/sportlife/08.jpg',
'["Camiseta azul de corte largo", "Bermuda cargo branca de nylon", "New Balance azul-claro", "Bucket hat de crochê", "Meia branca aparente"]',
'O tênis repete o azul da camiseta em um tom mais claro — o branco da bermuda no meio faz os dois azuis conversarem em vez de brigar.',
'["Bermuda preta para versão fechada", "Boné no lugar do bucket"]'),

('Polo de Time & Tactel Navy', 'A versão arrumada do estilo.', 'dia-a-dia', 'sportlife', 'meia-estacao', 'intermediario', 'azul', '/estilos/sportlife/09.jpg',
'["Polo listrada de time em azul", "Calça de tactel navy", "Gorro preto", "Sneaker branco", "Shoulder bag de monograma"]',
'Polo no lugar do jersey deixa a referência esportiva mais discreta — o navy inteiro em cima e embaixo alonga a silhueta.',
'["Jersey no lugar da polo para look mais street", "Jeans escuro no lugar do tactel"]'),

('Chelsea & Jorts Claro', 'Azul sobre denim desbotado.', 'dia-a-dia', 'sportlife', 'calor', 'facil', 'azul', '/estilos/sportlife/10.jpg',
'["Jersey azul listrado do Chelsea", "Jorts de denim de lavagem clara", "Sneaker chunky branco", "Meia branca e relógio"]',
'Azul forte em cima e denim lavado embaixo é a dupla mais fácil do estilo — o tênis branco fecha sem competir.',
'["Short de moletom preto no lugar do jorts", "Camiseta branca por baixo do jersey"]'),

-- ---------- Boho (10) ----------
('Crochê & Linho Bege', 'Textura artesanal com alfaiataria leve.', 'dia-a-dia', 'boho', 'calor', 'intermediario', 'bege', '/estilos/boho/01.jpg',
'["Camisa de crochê creme aberta", "Regata branca canelada", "Calça de linho bege ampla com pregas", "Sandália de couro", "Pulseiras de miçanga"]',
'A camisa de crochê funciona como terceira peça no calor: dá textura e volume sem fechar o corpo nem esquentar.',
'["Camisa de linho lisa no lugar do crochê", "Camiseta branca no lugar da regata"]'),

('Camisa Bordada & Navy', 'Bordado vermelho sobre base escura.', 'evento-casual', 'boho', 'calor', 'intermediario', 'branco', '/estilos/boho/02.jpg',
'["Camisa branca com bordado vermelho", "Calça navy ampla de linho", "Sandália de couro preta", "Colar de búzios e pulseira dourada"]',
'A camisa bordada é a única peça com padrão; a calça escura e lisa embaixo dá o contraste que faz o bordado aparecer.',
'["Calça bege para versão mais clara", "Fechar a camisa para look mais formal"]'),

('Listrado Aberto & Bolsa de Couro', 'Fim de tarde de verão sem esforço.', 'viagem', 'boho', 'calor', 'avancado', 'azul', '/estilos/boho/03.jpg',
'["Camisa de linho listrada azul-clara aberta", "Calça ampla amarelo-manteiga", "Bolsa de couro caramelo", "Óculos pendurados na camisa"]',
'Azul-claro e amarelo-manteiga são tons dessaturados da mesma intensidade, por isso combinam sem parecer combinação de time.',
'["Camisa branca lisa para simplificar", "Calça bege no lugar do amarelo"]'),

('Xadrez Miúdo & Off-White', 'Camisa oversized com calça de algodão.', 'dia-a-dia', 'boho', 'calor', 'facil', 'bege', '/estilos/boho/04.jpg',
'["Camisa oversized de xadrez miúdo bege", "Calça off-white ampla", "Colar fino de metal", "Chaveiro de tassel"]',
'Xadrez pequeno lê como textura, não como padrão — por isso combina com calça lisa clara sem nenhum esforço.',
'["Camisa lisa bege para versão ainda mais simples", "Sandália de couro para sair"]'),

('Branco Total & Bandana', 'Linho leve da cabeça aos pés.', 'dia-a-dia', 'boho', 'calor', 'facil', 'branco', '/estilos/boho/05.jpg',
'["Regata branca canelada", "Calça de linho branca com cordão", "Bandana branca na cabeça", "Clog de camurça"]',
'Branco total no calor funciona porque o tecido faz o trabalho: linho amassado tem textura suficiente para o look não parecer chapado.',
'["Camiseta branca no lugar da regata", "Calça bege para reduzir o branco"]'),

('Ringer & Cargo Bege', 'Boho com peça larga de rua.', 'faculdade', 'boho', 'calor', 'intermediario', 'bege', '/estilos/boho/06.jpg',
'["Camiseta ringer branca com gráfico", "Cargo jeans bege muito larga", "Bandana amarela na cabeça", "Cinto de couro marrom", "Chinelo de dedo"]',
'A bandana amarela é o único ponto de cor e dá a leitura boho a um look que, sem ela, seria só streetwear bege.',
'["Boné no lugar da bandana", "Calça de linho para versão mais leve"]'),

('Linho & Clog no Fim de Tarde', 'O look de viagem mais confortável do estilo.', 'viagem', 'boho', 'calor', 'facil', 'branco', '/estilos/boho/07.jpg',
'["Camisa de linho cru manga longa", "Calça branca ampla com cordão", "Clog de camurça", "Óculos escuros"]',
'Cru e branco são dois neutros quentes que nunca brigam — a diferença de tom entre eles é o que impede o look de parecer uniforme.',
'["Sandália no lugar do clog", "Camisa dobrada até o cotovelo no calor forte"]'),

('Henley Branca & Cargo Verde', 'Camadas leves com bolsa estampada.', 'dia-a-dia', 'boho', 'meia-estacao', 'intermediario', 'verde', '/estilos/boho/08.jpg',
'["Camiseta henley branca de manga longa", "Calça cargo verde-oliva flare", "Bolsa tote estampada", "Colar de contas", "Chinelo de dedo preto"]',
'Verde-oliva é neutro no guarda-roupa masculino: aceita branco em cima e ainda deixa espaço para uma bolsa estampada sem excesso.',
'["Camiseta lisa no lugar da henley", "Bolsa lisa de lona para versão discreta"]'),

('Crochê Azul & Baggy Jeans', 'Peça artesanal com denim largo.', 'evento-casual', 'boho', 'meia-estacao', 'avancado', 'azul', '/estilos/boho/09.jpg',
'["Camisa de crochê azul e marrom", "Baggy jeans de lavagem média", "Sandália de couro marrom", "Corrente dourada fina"]',
'O marrom do crochê e o da sandália se conversam nas duas pontas do look — detalhe pequeno que separa quem montou de quem vestiu.',
'["Camisa de linho azul para versão sóbria", "Jeans reto no lugar do baggy"]'),

('Camisa Amarela & Linho Branco', 'Cor suave para um date de verão.', 'date', 'boho', 'calor', 'intermediario', 'branco', '/estilos/boho/10.jpg',
'["Camisa de linho amarela aberta", "Calça de linho branca com cordão", "Sandália de couro", "Óculos pendurados e pulseira de contas"]',
'Amarelo em tom pastel é cor sem ser ousadia; sobre branco, ilumina o rosto e mantém o look leve.',
'["Camisa branca ou bege para versão neutra", "Camiseta branca por baixo se preferir fechado"]');
