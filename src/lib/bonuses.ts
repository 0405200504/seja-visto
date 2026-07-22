import {
  DoorOpen,
  Mic2,
  Scissors,
  Camera,
  Luggage,
  Palette,
  MessageCircle,
  Globe,
  TrendingUp,
  Percent,
  type LucideIcon,
} from "lucide-react";
import type { GuideSection } from "@/lib/guides";

export type Bonus = {
  /** Chave do entitlement (a mesma usada no mapa da Cakto). */
  key: string;
  title: string;
  short: string;
  icon: LucideIcon;
  /** content = página de conteúdo · link = página com botão (WhatsApp) · badge = só status (vitalício) */
  type: "content" | "link" | "badge";
  /** Link de checkout da Cakto — usado no card bloqueado para a pessoa comprar o bônus avulso. */
  checkoutUrl?: string;
  sections?: GuideSection[];
};

/** Entitlement do produto principal (acesso à plataforma). */
export const BASE_ENTITLEMENT = "base";

export const BONUSES: Bonus[] = [
  {
    key: "guarda-roupa-funcional",
    checkoutUrl: "https://pay.cakto.com.br/3dq47z7",
    title: "Monte um guarda-roupa funcional",
    short: "O sistema completo para transformar seu armário em uma máquina de looks.",
    icon: DoorOpen,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Guarda-roupa funcional não é guarda-roupa pequeno — é guarda-roupa onde TODA peça trabalha. Nada de cabides decorativos: cada item combina com pelo menos outros três e serve a uma ocasião real da sua vida.",
          "Este bônus é o sistema de implementação: auditoria, arquitetura em camadas e manutenção contínua. Em 30 dias, seu armário deixa de ser um depósito e vira uma ferramenta.",
        ],
      },
      {
        kind: "steps",
        title: "Fase 1 — Auditoria brutal (fim de semana 1)",
        items: [
          { t: "Esvazie tudo", d: "Tire TODAS as peças do armário e coloque na cama. Ver o volume total de uma vez muda sua relação com as próximas compras. A maioria descobre que tem 3x mais roupa do que imaginava." },
          { t: "As 4 pilhas", d: "AMO E USO (volta pro armário) · USO MAS NÃO AMO (volta em observação por 30 dias) · AMO MAS NÃO USO (por quê? tamanho errado → costureiro; sem combinação → anote a peça-ponte que falta) · NEM AMO NEM USO (doa hoje, sem dó)." },
          { t: "O teste do cabide invertido", d: "Pendure tudo com o gancho ao contrário. Usou a peça? Vira o cabide. Em 60 dias, os cabides que continuarem invertidos revelam a verdade que você evita." },
          { t: "Fotografe o resultado", d: "Armário limpo, foto no celular. É sua linha de base — e seu freio nas compras por impulso ('já tenho algo igual?')." },
        ],
      },
      {
        kind: "table",
        title: "Fase 2 — A arquitetura em 3 camadas",
        head: ["Camada", "% do armário", "O que é", "Exemplos"],
        rows: [
          ["Base", "60%", "Neutros que combinam entre si", "Camisetas lisas, jeans reto, chino, tênis branco"],
          ["Coringas", "30%", "Peças que transitam entre 3+ ocasiões", "Overshirt, camisa oxford, alfaiataria casual, chelsea"],
          ["Assinatura", "10%", "Peças de personalidade e elevação", "Jaqueta de couro, tricô especial, tênis statement"],
        ],
      },
      {
        kind: "steps",
        title: "Fase 3 — Operação diária",
        items: [
          { t: "Regra do 1 entra, 1 sai", d: "Comprou uma camiseta? Uma camiseta sai (doação). O armário para de crescer e a qualidade média só sobe." },
          { t: "Zonas no armário", d: "Organize por categoria e frequência: o que você usa toda semana na altura dos olhos; ocasião especial nas pontas; fora de estação em caixa. Achar rápido = combinar melhor." },
          { t: "Reset de domingo", d: "10 minutos por semana: devolver peças ao lugar, separar o que precisa de lavagem/costureiro e montar mentalmente 2 looks para a semana." },
          { t: "Revisão trimestral", d: "A cada estação, repita a auditoria em versão rápida (30 min). Guarda-roupa funcional é processo, não evento." },
        ],
      },
      {
        kind: "tips",
        title: "Sinais de que funcionou",
        items: [
          "Você se veste em menos de 5 minutos sem estresse",
          "Qualquer camiseta combina com qualquer calça do armário",
          "Nenhuma peça está há 60+ dias sem uso (exceto ocasião especial)",
          "Sua lista de compras tem no máximo 3 itens — e todos são peças-ponte",
          "Lavanderia em dia = 100% do armário disponível",
        ],
      },
      {
        kind: "callout",
        body: "Combine este bônus com a área Guarda-Roupa da plataforma: marque lá o que você TEM e o que QUER COMPRAR ao final da auditoria — ela vira seu inventário vivo.",
      },
    ],
  },
  {
    key: "vista-se-como-artista",
    checkoutUrl: "https://pay.cakto.com.br/36uhro4",
    title: "Vista-se como artista",
    short: "Decodifique o estilo dos seus ídolos e adapte para a vida real — sem fantasia.",
    icon: Mic2,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Artista não se veste com roupa — se veste com IDENTIDADE. E identidade pode ser decodificada: silhueta, paleta e assinatura. Quando você entende esses três elementos, consegue traduzir o estilo de qualquer ídolo para o seu corpo, seu orçamento e sua rotina.",
          "A regra de ouro da tradução: copie o PRINCÍPIO, não a peça. O casaco de grife de R$ 40 mil vira uma overshirt bem cortada; a atitude é a mesma.",
        ],
      },
      {
        kind: "steps",
        title: "O método D.N.A. (Decodificar → Neutralizar → Adaptar)",
        items: [
          { t: "1. Decodifique a silhueta", d: "Olhe 10 fotos do artista e ignore as roupas: veja as FORMAS. Ombro marcado ou caído? Calça larga ou justa? Comprimentos longos ou curtos? A silhueta é 70% do estilo de qualquer artista." },
          { t: "2. Decodifique a paleta", d: "Quais 3-4 cores se repetem? Pharrell vive nos tons de terra e denim; The Weeknd no preto absoluto; Bad Bunny nas cores quebradas. A paleta é o filtro de compra." },
          { t: "3. Decodifique a assinatura", d: "Todo artista tem UM elemento fixo: óculos, corrente, gorro, um tipo de tênis. É o detalhe que assina. Escolha a sua assinatura — uma só — e repita sempre." },
          { t: "4. Neutralize o exagero", d: "Tire 30% do volume, 50% do brilho e 100% do logo gigante. O palco aguenta excesso; a rua pede versão editada." },
          { t: "5. Adapte ao contexto", d: "Versão trabalho, versão rolê, versão noite. O mesmo DNA muda de intensidade: a corrente fica, o casaco de pele vira tricô texturizado." },
        ],
      },
      {
        kind: "table",
        title: "4 arquétipos decodificados",
        head: ["Arquétipo", "Silhueta", "Paleta", "Traduza com"],
        rows: [
          ["Rapper 90s/2000s", "Tudo amplo, camadas", "Neutros + 1 cor viva", "Boxy tee, baggy jeans, retro sneakers, corrente"],
          ["Popstar minimal", "Linhas limpas, monocromia", "Preto, branco, cinza", "Alfaiataria fluida, tricô fino, couro clean"],
          ["Rockstar", "Justo em cima, atitude", "Preto + couro + denim", "Jaqueta de couro, jeans escuro, bota, anéis"],
          ["Artista indie/vintage", "Relaxada, garimpada", "Terrosos desbotados", "Trucker jacket, camiseta gráfica, veludo, camurça"],
        ],
      },
      {
        kind: "tips",
        title: "Erros que transformam referência em fantasia",
        items: [
          "Copiar o look INTEIRO de uma foto (vire inspiração, não cosplay)",
          "Usar 2+ peças statement ao mesmo tempo",
          "Ignorar seu tipo de corpo para imitar a silhueta do artista",
          "Comprar a versão falsificada do item de grife — a versão 'sem logo' sempre parece mais cara",
          "Mudar de referência toda semana: identidade pede consistência",
        ],
      },
      {
        kind: "callout",
        body: "Exercício: escolha SEU artista de referência hoje. Salve 10 fotos, escreva a silhueta, as 4 cores e a assinatura dele. Depois monte 1 look seu com essa receita e registre no Plano de Ação.",
      },
    ],
  },
  {
    key: "corte-ideal-rosto",
    checkoutUrl: "https://pay.cakto.com.br/5miqksx",
    title: "Corte ideal para seu rosto",
    short: "Cabelo e barba calculados para o formato do seu rosto — com o script pro barbeiro.",
    icon: Scissors,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "O corte de cabelo é a moldura do quadro: errado, derruba qualquer look; certo, eleva até camiseta branca. E a escolha não é sobre moda — é sobre GEOMETRIA. Cabelo e barba existem para equilibrar o formato do seu rosto.",
          "Primeiro descubra seu formato: afaste o cabelo, olhe de frente no espelho e observe (ou meça com foto): largura da testa, das maçãs e do maxilar, e o comprimento total.",
        ],
      },
      {
        kind: "table",
        title: "Seu formato → seu corte",
        head: ["Formato", "Como identificar", "Cortes que equilibram", "Evite"],
        rows: [
          ["Oval", "Comprimento > largura, maxilar suave", "Praticamente tudo: é o formato coringa", "Franja pesada cobrindo a testa"],
          ["Redondo", "Largura ≈ comprimento, bochechas cheias", "Volume no topo + lateral curta (pompadour, quiff, fade alto)", "Cortes redondos e franja reta (arredondam mais)"],
          ["Quadrado", "Maxilar marcado, testa larga", "Texturizado no topo, fade médio — valorize o maxilar", "Cortes muito geométricos (duplicam os ângulos)"],
          ["Alongado", "Rosto visivelmente comprido", "Laterais mais cheias, topo médio SEM altura", "Topete alto e lateral zero (alongam ainda mais)"],
          ["Triangular", "Maxilar mais largo que a testa", "Volume e textura no topo para equilibrar a base", "Laterais raspadas com topo colado"],
          ["Coração", "Testa larga, queixo fino", "Franja texturizada, médio com movimento", "Volume excessivo no topo"],
        ],
      },
      {
        kind: "table",
        title: "A barba como corretor de geometria",
        head: ["Objetivo", "Barba certa"],
        rows: [
          ["Alongar rosto redondo", "Mais comprimento no queixo, laterais baixas e curtas"],
          ["Encher rosto alongado", "Cheia nas laterais, curta no queixo"],
          ["Definir maxilar fraco", "Barba de 10-20 dias com contorno marcado na linha do maxilar"],
          ["Suavizar maxilar muito duro", "Barba levemente mais cheia e arredondada na base"],
          ["Rosto oval", "Qualquer estilo — priorize a densidade natural dos seus pelos"],
        ],
      },
      {
        kind: "steps",
        title: "O script exato pro barbeiro",
        items: [
          { t: "Leve foto (sempre)", d: "Palavra é ambígua; foto não. Leve 2: uma do corte desejado e uma do SEU cabelo hoje. Diga: 'quero chegar nisso partindo disso — o que funciona pro meu rosto?'" },
          { t: "Fale em números", d: "'Pente 2 na lateral, tesoura no topo deixando uns 6 cm, degradê médio'. Números não têm interpretação." },
          { t: "Defina o acabamento", d: "Contorno arredondado ou quadrado? Navalha ou máquina? Acabamento na nuca alto ou natural? São 10 segundos que evitam 3 semanas de arrependimento." },
          { t: "Pergunte a manutenção", d: "'Em quantas semanas esse corte perde a forma?' Corte bom é o que fica bom TAMBÉM na semana 3." },
        ],
      },
      {
        kind: "tips",
        title: "Manutenção que ninguém te contou",
        items: [
          "Fade perde a linha em 2–3 semanas; cortes com tesoura aguentam 4–6",
          "Acostume-se com UM barbeiro: a terceira visita é sempre a melhor",
          "Finalizador fosco (pasta/clay) > gel brilhante — em 99% dos casos",
          "Contorno da barba: linha do pescoço 2 dedos acima do pomo de adão, NUNCA na linha do maxilar",
          "Foto do corte recém-feito por todos os ângulos = seu backup para qualquer barbeiro novo",
        ],
      },
    ],
  },
  {
    key: "bonito-nas-fotos",
    checkoutUrl: "https://pay.cakto.com.br/3fe95o3",
    title: "Fique bonito em todas as fotos",
    short: "Ângulo, postura, luz e expressão: o manual do homem fotogênico.",
    icon: Camera,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Fotogenia não é dom — é técnica. As mesmas 6 variáveis decidem toda foto: ângulo, postura, luz, expressão, mãos e enquadramento. Quem domina as 6 fica bem em QUALQUER câmera, inclusive na selfie de banheiro com luz ruim.",
          "E tem um motivo prático para dominar isso: hoje sua imagem circula mais em foto do que ao vivo — apps, redes, LinkedIn. A foto é seu primeiro aperto de mão.",
        ],
      },
      {
        kind: "steps",
        title: "As 6 variáveis",
        items: [
          { t: "1. Ângulo — a câmera na altura dos olhos", d: "Câmera abaixo do queixo alarga o rosto e mostra narina; muito acima diminui você. Altura dos olhos (ou levemente acima) é o padrão-ouro. Vire o rosto 10–15° em vez de posar 100% de frente: todo rosto tem um lado melhor — descubra o seu testando." },
          { t: "2. Postura — o truque do cordão", d: "Imagine um cordão puxando o topo da sua cabeça para cima: coluna alonga, ombros caem para trás naturalmente. Peso em UMA perna (nunca 50/50, que parece boneco). Queixo LEVEMENTE para frente e para baixo — define o maxilar em qualquer rosto." },
          { t: "3. Luz — de frente ou 45°, nunca de cima", d: "Luz de frente apaga imperfeições; luz 45° esculpe o rosto; luz do meio-dia a pino cria olheira de zumbi. A melhor luz gratuita: janela durante o dia ou a 'golden hour' (1h antes do pôr do sol). À noite: de frente para a fonte de luz, nunca abaixo dela." },
          { t: "4. Expressão — o 'squinch'", d: "Olhos 100% arregalados parecem susto. Aperte SUTILMENTE as pálpebras inferiores (como quem olha o sol de longe): transmite confiança instantânea. Sorriso: pense em algo genuinamente engraçado 1 segundo antes do clique — sorriso real envolve os olhos." },
          { t: "5. Mãos — sempre ocupadas", d: "Mão solta ao lado do corpo = desconforto visível. Opções que sempre funcionam: uma mão no bolso (polegar pra fora), ajeitando o relógio/manga, segurando o óculos, braços cruzados relaxados. Nunca as duas mãos nos bolsos + ombros encolhidos." },
          { t: "6. Enquadramento — corte nas juntas certas", d: "Foto boa corta no meio da coxa, na cintura ou no peito — NUNCA no joelho, tornozelo ou pescoço. Corpo inteiro: peça para fotografar da altura da sua cintura (deixa você mais alto e a perna mais longa)." },
        ],
      },
      {
        kind: "table",
        title: "Roupas que fotografam bem",
        head: ["Situação", "Use", "Evite"],
        rows: [
          ["Qualquer foto", "Cores sólidas e contrastes limpos", "Estampas miúdas (criam efeito moiré) e logos grandes"],
          ["Foto clara/dia", "Tons médios e escuros que definem a silhueta", "Branco total sem âncora (estoura na luz)"],
          ["Foto noturna", "Monocromático escuro + 1 ponto de luz (relógio, corrente)", "Preto total em fundo preto (você some)"],
          ["Foto de perfil (LinkedIn etc.)", "Terceira peça estruturada nos ombros", "Camiseta larga sozinha (perde estrutura)"],
        ],
      },
      {
        kind: "tips",
        title: "Checklist dos 10 segundos antes do clique",
        items: [
          "Cordão imaginário puxando a cabeça — postura",
          "Queixo levemente pra frente e pra baixo",
          "Peso em uma perna, corpo 15° virado",
          "Squinch + pensamento engraçado",
          "Mãos ocupadas",
          "Luz na frente do rosto, nunca atrás (a menos que queira silhueta)",
          "Câmera na altura dos olhos",
        ],
      },
      {
        kind: "callout",
        body: "Treino de 15 minutos que muda tudo: trave 30 selfies testando ângulos (esquerda/direita, cima/baixo) com a mesma expressão. Compare e descubra SEU ângulo. Depois disso, toda foto é só repetir a fórmula.",
      },
    ],
  },
  {
    key: "mala-10x-mais-rapido",
    checkoutUrl: "https://pay.cakto.com.br/t6t85jf",
    title: "Monte sua mala 10x mais rápido",
    short: "O método 5-4-3-2-1 e a cápsula de viagem que rende 2 semanas de looks em uma mochila.",
    icon: Luggage,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Fazer mala é montar um guarda-roupa cápsula temporário — e quem já domina o método da plataforma tem 80% do caminho andado. O segredo: parar de escolher LOOKS ('e se rolar um jantar?') e passar a escolher um SISTEMA onde tudo combina com tudo.",
          "Regra de ouro: se uma peça não combina com pelo menos 3 outras da mala, ela fica em casa. Sem exceção — nem 'só por garantia'.",
        ],
      },
      {
        kind: "steps",
        title: "O método 5-4-3-2-1 (viagem de 5 a 7 dias)",
        items: [
          { t: "5 partes de cima", d: "3 camisetas neutras + 1 camisa (funciona fechada E aberta como terceira peça) + 1 polo ou tricô conforme o clima. Todas combinando com TODAS as partes de baixo." },
          { t: "4 peças de apoio", d: "1 shorts/bermuda (ou segunda calça no frio) + 1 peça de dormir + 1 roupa de banho (ou térmica) + 1 terceira peça (overshirt ou jaqueta — VAI VESTIDA no trajeto, não na mala)." },
          { t: "3 partes de baixo", d: "1 jeans escuro (o coringa) + 1 chino ou alfaiataria leve + 1 opção do clima (shorts no calor, calça extra no frio)." },
          { t: "2 pares de calçado", d: "1 tênis branco/versátil (vai no pé) + 1 do contexto: chelsea para viagem urbana, papete para praia, trail para natureza. Calçado é o que mais pesa: NUNCA 3 pares em viagem curta." },
          { t: "1 kit de acessórios", d: "Relógio, cinto reversível (preto/marrom = 2 cintos em 1), óculos de sol, boné. Tudo em um pouch." },
        ],
      },
      {
        kind: "table",
        title: "Ajuste por duração",
        head: ["Duração", "Fórmula", "Volume"],
        rows: [
          ["Fim de semana (2-3 dias)", "3-2-2-1-1", "Mochila 20-30L"],
          ["Semana (5-7 dias)", "5-4-3-2-1", "Mala de mão 40L"],
          ["Duas semanas", "5-4-3-2-1 + 1 lavagem no meio", "A MESMA mala de mão (lavar > carregar)"],
          ["Frio intenso", "Camadas: térmica + meio + casaco (vestido)", "+20% de espaço, mesmo sistema"],
        ],
      },
      {
        kind: "steps",
        title: "A arte de embalar",
        items: [
          { t: "Rolinho para malha", d: "Camisetas, moletom e roupa de dormir: enrole apertado. Ganha 30% de espaço e amassa menos que dobrar." },
          { t: "Dobra para estruturados", d: "Camisa e alfaiataria: dobra clássica, em cima de tudo, dentro de saco plástico fino (o ar entre o plástico e o tecido evita vinco)." },
          { t: "Packing cubes mudam o jogo", d: "1 cube para cima, 1 para baixo, 1 para íntimas/meias. Mala vira gaveta: você acha tudo sem desmontar nada." },
          { t: "Pesados embaixo, perto das rodinhas", d: "Calçado e nécessaire na base; o resto em camadas. Sapato dentro de saco, preenchido com meias (espaço aproveitado + forma mantida)." },
          { t: "O look do trajeto é estratégico", d: "Vista as peças mais pesadas e volumosas: jeans + tênis + terceira peça. A mala agradece e você desembarca apresentável." },
        ],
      },
      {
        kind: "tips",
        title: "Checklist final (2 minutos antes de fechar)",
        items: [
          "Toda peça combina com 3+ outras? (teste mental rápido)",
          "Paleta fechada em 3-4 cores neutras + 1 acento?",
          "Carregadores, adaptador e power bank no bolso externo",
          "Nécessaire com o mínimo real (não o banheiro inteiro)",
          "1 sacola dobrável vazia (roupa suja / compras da volta)",
          "Documentos e remédios NA MOCHILA de bordo, nunca despachados",
        ],
      },
      {
        kind: "callout",
        body: "Com o 5-4-3-2-1 você monta 15+ combinações usando 12 peças. É literalmente o montador de 27 outfits da plataforma aplicado à estrada — releia aquele guia antes da próxima viagem.",
      },
    ],
  },
  {
    key: "circulo-cromatico",
    checkoutUrl: "https://pay.cakto.com.br/a9hm3yg",
    title: "Aprenda a combinar cores (círculo cromático)",
    short: "A teoria por trás dos looks memoráveis: complementares, análogas e tríades aplicadas à moda masculina.",
    icon: Palette,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "O guia de cores da plataforma te deu o sistema seguro (neutros + 1 cor). Este bônus é o nível avançado: ENTENDER o porquê — o círculo cromático — para criar combinações que ninguém mais está usando, com a confiança de quem sabe o que está fazendo.",
          "O círculo cromático organiza as cores como uma pizza de 12 fatias: primárias (azul, vermelho, amarelo), secundárias (verde, laranja, violeta) e as intermediárias. A POSIÇÃO relativa entre duas cores define a relação entre elas — e é isso que você vai explorar.",
        ],
      },
      {
        kind: "steps",
        title: "As 4 relações do círculo (em versão vestível)",
        items: [
          { t: "Análogas — vizinhas de fatia", d: "Cores lado a lado no círculo (azul → azul-esverdeado → verde). Criam harmonia suave, quase monocromática. Na prática: navy + verde-petróleo, verde-oliva + mostarda queimada, vinho + terracota. É a forma mais elegante de usar duas cores de verdade." },
          { t: "Complementares — opostas no círculo", d: "Máximo contraste: azul ↔ laranja, verde ↔ vermelho. Na roupa masculina, USE SEMPRE DESSATURADAS: navy + caramelo (azul/laranja quebrados) é a complementar mais usada do planeta — por isso funciona. Nunca as versões puras e vibrantes juntas." },
          { t: "Tríades — triângulo no círculo", d: "Três cores equidistantes. Avançadíssimo em versão pura; vestível em versão quebrada: navy + vinho + verde-oliva é uma tríade dessaturada — e uma das paletas de inverno mais sofisticadas que existem." },
          { t: "Monocromia com temperatura", d: "Uma única fatia, variando claro/escuro. O truque avançado: escolha se a família é QUENTE ou FRIA e não misture. Cinza-azulado com cinza-esverdeado parece igual na gaveta e briga no corpo." },
        ],
      },
      {
        kind: "table",
        title: "O tradutor: círculo → guarda-roupa",
        head: ["Relação", "Fórmula vestível", "Look exemplo"],
        rows: [
          ["Análogas frias", "Navy + petróleo + cinza", "Tricô petróleo, calça navy, tênis cinza"],
          ["Análogas quentes", "Terracota + caramelo + creme", "Overshirt terracota, chino creme, bota caramelo"],
          ["Complementar dessaturada", "Navy + caramelo/mostarda", "Blazer navy, calça bege, sapato caramelo"],
          ["Complementar terrosa", "Verde-oliva + bordô", "Jaqueta verde, tricô vinho por baixo, jeans cru"],
          ["Tríade quebrada", "Navy + vinho + oliva", "Sobretudo navy, tricô vinho, calça oliva escura"],
        ],
      },
      {
        kind: "steps",
        title: "Saturação e valor: os 2 botões secretos",
        items: [
          { t: "Saturação = volume da cor", d: "Toda cor tem versão 'gritada' (saturada) e 'falada' (dessaturada). A regra masculina: quanto mais perto do rosto e maior a área, MENOS saturada. Cor viva entra em área pequena: meia, boné, detalhe do tênis." },
          { t: "Valor = claro ou escuro", d: "Contraste de VALOR importa mais que de cor: um look inteiro escuro com UMA peça clara tem mais impacto que três cores médias. Fotografe seu look em preto e branco — se ficar tudo cinza igual, falta contraste de valor." },
        ],
      },
      {
        kind: "tips",
        title: "Regras do jogo avançado",
        items: [
          "Máximo 3 cores 'de verdade' por look (neutros não contam)",
          "Complementares: sempre uma dominante e outra em detalhe — nunca 50/50",
          "Na dúvida entre duas versões de uma cor, escolha a mais escura e quebrada",
          "Tom de pele conta como cor do look: encoste a peça no rosto no espelho antes de comprar",
          "Dominou uma paleta? Repita-a por semanas — paleta consistente é o que cria identidade visual",
        ],
      },
      {
        kind: "callout",
        body: "Prática guiada: escolha UMA relação (sugestão: análogas frias) e monte 3 looks dela nesta semana usando o lookbook como referência. Semana que vem, complementar dessaturada. Em um mês, você combina cores melhor que 99% — com teoria de verdade por trás.",
      },
    ],
  },

  {
    key: "grupo-whatsapp",
    checkoutUrl: "https://pay.cakto.com.br/nw7rcfk",
    title: "Grupo no WhatsApp",
    short: "A comunidade fechada: dúvidas respondidas, looks avaliados e drops de conteúdo.",
    icon: MessageCircle,
    type: "link",
  },
  {
    key: "comprar-pela-internet",
    checkoutUrl: "https://pay.cakto.com.br/qrvbvb7",
    title: "Aprenda a comprar roupa pela internet",
    short: "Compre online sem medo: tamanho certo, tecido certo e zero arrependimento.",
    icon: Globe,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Comprar roupa online é onde estão os melhores preços e a maior variedade — e também onde mora o arrependimento. A diferença entre os dois é PROCESSO: quem segue o checklist certo devolve quase nada e economiza muito.",
          "Pré-requisito: suas medidas anotadas (guia 'Como tirar suas medidas' — preencha o formulário de lá antes de continuar; leva 10 minutos e paga por todas as compras futuras).",
        ],
      },
      {
        kind: "steps",
        title: "O processo de compra em 6 passos",
        items: [
          { t: "1. Ignore o tamanho, leia a TABELA", d: "M da marca A = G da marca B. Sempre abra a tabela de medidas do produto e compare com SEUS números (ou com sua melhor peça medida). Se o site não tem tabela de medidas da PEÇA, desconfie." },
          { t: "2. Decodifique a composição do tecido", d: "100% algodão penteado/fio 30 = camiseta boa; poliéster dominante em camiseta básica = bolinha e brilho em 3 lavagens. Jeans: 98-99% algodão + 1-2% elastano = conforto sem deformar. Tricô: lã/algodão > acrílico puro. A composição está sempre na descrição — é lei." },
          { t: "3. Caçe as fotos reais", d: "Foto de estúdio mente (alfinetes atrás da peça!). Procure a aba de avaliações COM FOTOS de clientes e vídeos de prova. No Instagram da marca, veja a peça em corpos normais, não só em modelos." },
          { t: "4. Leia 5 avaliações — as de 3 estrelas", d: "As de 5 são fãs, as de 1 são raiva de frete. As de 3 estrelas contam a verdade: 'bonita mas veste pequeno', 'tecido mais fino que parece'. Preste atenção especial em menções a tamanho." },
          { t: "5. Confira a política de troca ANTES", d: "Primeira troca grátis é o padrão decente no Brasil (direito de arrependimento: 7 dias por lei em compra online). Guarde etiqueta e embalagem até decidir. Marca que dificulta troca não merece segunda chance." },
          { t: "6. Prove em casa DE VERDADE", d: "Chegar não é aprovar: vista com o calçado que vai usar junto, sente, agache, levante o braço. Olhe no espelho de corpo inteiro com luz boa. 5 minutos de prova real evitam meses de cabide morto." },
        ],
      },
      {
        kind: "table",
        title: "Risco por categoria (o que dá pra comprar online?)",
        head: ["Categoria", "Risco", "Estratégia"],
        rows: [
          ["Camisetas e moletom", "Baixo", "Compre direto — modelagem perdoa variação"],
          ["Tênis de marca que você já usa", "Baixo", "Mesmo modelo/marca = mesmo número"],
          ["Calças", "Médio", "Só com tabela de medidas + avaliações; prefira marcas que você conhece"],
          ["Alfaiataria e camisas", "Alto", "Primeira compra da marca presencial; recompra online"],
          ["Tênis de marca nova", "Alto", "Pesquise 'veste grande/pequeno' + meio número de folga"],
          ["Couro e peças caras", "Alto", "Só de lojas com troca fácil e fotos reais abundantes"],
        ],
      },
      {
        kind: "tips",
        title: "Truques de quem compra bem",
        items: [
          "Carrinho abandonado por 24-48h costuma render cupom no e-mail",
          "Print da peça + preço antes da Black Friday (para conferir se o desconto é real)",
          "Filtre por 'mais vendidos' + avaliação 4,5+: a multidão já testou por você",
          "Tamanho entre M e G? Na camiseta, escolha o maior (ajusta no costureiro); na calça, o menor cós que fecha confortável",
          "Cadastre e-mail descartável para cupons de primeira compra em cada loja",
          "Desconfie de preço 70% abaixo do mercado em marca famosa: é falsificado ou não existe",
        ],
      },
    ],
  },
  {
    key: "tendencias-do-ano",
    checkoutUrl: "https://pay.cakto.com.br/6agtgyv",
    title: "Saiba as tendências do ano",
    short: "O radar 2026: o que está subindo, o que consolida e o que está saindo — e como adotar sem virar vítima.",
    icon: TrendingUp,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "Primeira regra sobre tendência: ela é TEMPERO, não prato principal. Sua base neutra e atemporal continua sendo 80% do jogo; a tendência entra nos 20% que mantêm o visual atual. Quem inverte essa proporção gasta muito e envelhece o guarda-roupa em 12 meses.",
          "Radar de 2026 para o vestuário masculino — filtrado para o que realmente chega à rua brasileira (desfile é laboratório; a lista abaixo é o que sobrevive ao caminho).",
        ],
      },
      {
        kind: "steps",
        title: "O que está EM ALTA em 2026",
        items: [
          { t: "Alfaiataria relaxada", d: "Calça de alfaiataria ampla com camiseta e tênis consolidou de vez — o 'terno quebrado' virou o novo casual arrumado. Investimento seguro: uma calça de alfaiataria cinza ou navy de perna larga." },
          { t: "Silhueta ampla madura", d: "O baggy saiu da adolescência: cortes largos mas LIMPOS, com barra resolvida. O skinny segue fora do jogo; o slim sobrevive só em alfaiataria." },
          { t: "Tons terrosos profundos + vinho", d: "Chocolate, café, oliva e o burgundy/vinho dominando as paletas — inclusive em calçado. É a onda de cor mais fácil de adotar: são quase-neutros." },
          { t: "Camurça e texturas táteis", d: "Jaqueta de camurça, tricô encorpado, veludo cotelê: 2026 é ano de textura visível. Peça-chave: overshirt ou jaqueta em camurça (real ou eco) caramelo." },
          { t: "Workwear refinado", d: "O utilitário amadureceu: chore jacket em tecido melhor, cargo de alfaiataria, bota limpa. Funcional com acabamento." },
          { t: "Retrô esportivo contínuo", d: "Tênis baixo de perfil fino (terrace/retrô) segue absoluto, agora com gáspea em camurça colorida. O chunky não morreu, mas dividiu o trono." },
          { t: "Gorpcore urbano", d: "A peça técnica integrada ao look de cidade (shell + alfaiataria, trail + jeans) — não mais o look de trilha completo." },
        ],
      },
      {
        kind: "table",
        title: "Radar rápido",
        head: ["Status", "Tendências"],
        rows: [
          ["Subindo", "Camurça, vinho/burgundy, alfaiataria ampla, mocassim com meia, jaqueta de couro marrom"],
          ["Consolidado (pode investir)", "Wide leg, tênis retrô baixo, workwear, tons terrosos, polo de malha"],
          ["Saindo", "Skinny, sneaker branco 'de escritório' engordado, logomania, athleisure de academia como look"],
          ["Eterno (nunca sai)", "Jeans reto escuro, camiseta branca de qualidade, jaqueta de couro preta, oxford azul, chelsea boot"],
        ],
      },
      {
        kind: "steps",
        title: "Como adotar tendência sem virar vítima",
        items: [
          { t: "Teste barato primeiro", d: "Tendência nova entra pelo item de menor custo: a cor vinho chega numa camiseta antes do sobretudo. Validou no seu corpo e estilo? Aí sobe o investimento." },
          { t: "Uma tendência por look", d: "Calça ampla OU tênis statement OU cor do momento. Duas juntas = fantasia de 'antenado'." },
          { t: "Filtre pelo SEU estilo", d: "Você é minimalista? A tendência entra na versão mais limpa. Street? Na mais ampla. A tendência se adapta a você — nunca o contrário." },
          { t: "Pergunta-filtro antes de comprar", d: "'Eu usaria isso se NÃO fosse tendência?' Se a resposta é não, é fantasia com data de validade." },
        ],
      },
      {
        kind: "callout",
        body: "Este radar é atualizado a cada ano dentro da plataforma. Tendência muda; o método de filtrar — nunca.",
      },
    ],
  },
  {
    key: "economize-58",
    checkoutUrl: "https://pay.cakto.com.br/6sbgnt3",
    title: "Compre tudo economizando 58%",
    short: "O stack de descontos: como pagar quase metade do preço em tudo, sem cair em pegadinha.",
    icon: Percent,
    type: "content",
    sections: [
      {
        kind: "text",
        body: [
          "58% não é número mágico — é o resultado de EMPILHAR descontos que a maioria usa isoladamente (ou nem usa). Sozinho, cada tática economiza 10-20%. Empilhadas na mesma compra, chegam à metade do preço com folga.",
          "O stack: timing certo (a maior alavanca) + cupom + cashback + forma de pagamento + canal certo. Vamos por camadas.",
        ],
      },
      {
        kind: "steps",
        title: "As 5 camadas do stack",
        items: [
          { t: "Camada 1 — Timing (20-40%)", d: "Roupa tem calendário: fim de estação (saldão de inverno em agosto/setembro, verão em fevereiro/março), Black Friday para peças atemporais que você JÁ listou, e liquidações de troca de coleção. Comprar casaco em pleno junho é pagar preço de pico." },
          { t: "Camada 2 — Cupom (5-15%)", d: "Antes de TODA compra online: busque '[loja] cupom' + newsletter da loja (10% de primeira compra é padrão) + carrinho abandonado por 24h. Extensões de navegador que testam cupons automaticamente fazem o trabalho sujo." },
          { t: "Camada 3 — Cashback (3-12%)", d: "Méliuz e apps de banco devolvem parte do valor em quase todas as lojas grandes de moda. É dinheiro de graça: 30 segundos ativando antes de finalizar. Empilha COM o cupom." },
          { t: "Camada 4 — Forma de pagamento (5-15%)", d: "Pix quase sempre tem desconto sobre o parcelado (o lojista economiza taxa e repassa). Pergunte no chat/WhatsApp da loja: 'qual o melhor preço no Pix à vista?' — funciona até em loja física." },
          { t: "Camada 5 — Canal alternativo (30-70%)", d: "Outlet oficial da marca, brechós de qualidade (garimpo de couro e alfaiataria!), e a própria seção 'sale' escondida dos sites. Para peças de elevação — jaqueta de couro, blazer — o brechó certo entrega a peça de R$ 800 por R$ 150." },
        ],
      },
      {
        kind: "table",
        title: "O stack na prática (exemplo real)",
        head: ["Passo", "Ação", "Preço"],
        rows: [
          ["Peça alvo", "Jaqueta que você PRECISA (está na sua lista do app)", "R$ 400"],
          ["Timing", "Espera o saldão de fim de estação (-30%)", "R$ 280"],
          ["Cupom", "Newsletter 10% primeira compra", "R$ 252"],
          ["Cashback", "7% ativado no app", "R$ 234 líquido"],
          ["Pagamento", "Pix com 12% vs parcelado", "R$ 206"],
          ["Total", "Economia final", "48% — e com brechó/outlet passa dos 58%"],
        ],
      },
      {
        kind: "tips",
        title: "As regras anti-pegadinha",
        items: [
          "Desconto só é desconto em peça que estava na sua LISTA antes da promoção — senão é gasto com fantasia de economia",
          "Print do preço 2 semanas antes da Black Friday (metade das 'ofertas' é preço remarcado)",
          "Cupom que exige valor mínimo alto te faz gastar mais: só use se atingir o mínimo com o que já ia comprar",
          "'Últimas unidades' e cronômetro no site são gatilho, não realidade — respire 24h",
          "Peça barata que você não usa = 100% de desperdício; peça certa a preço cheio = melhor negócio que promoção errada",
        ],
      },
      {
        kind: "callout",
        body: "Fluxo definitivo: mantenha a lista 'quero comprar' atualizada na área Guarda-Roupa do app → configure alerta de preço/newsletter das marcas → compre APENAS da lista, sempre com o stack completo. Economia deixa de ser sorte e vira sistema.",
      },
    ],
  },
];

export function getBonus(key: string): Bonus | undefined {
  return BONUSES.find((b) => b.key === key);
}

/** Chaves válidas de entitlement (produto base, todos os bônus e pacotes de tokens). */
export const ALL_ENTITLEMENT_KEYS = [
  BASE_ENTITLEMENT, 
  ...BONUSES.map((b) => b.key),
  "tokens-50",
  "tokens-200"
];
