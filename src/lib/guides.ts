import {
  Ruler,
  Watch,
  Palette,
  PersonStanding,
  Zap,
  Footprints,
  Shirt,
  Grid3x3,
  Store,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type GuideSection =
  | { kind: "text"; title?: string; body: string[] }
  | { kind: "steps"; title?: string; items: { t: string; d: string }[] }
  | { kind: "table"; title?: string; note?: string; head: string[]; rows: string[][] }
  | { kind: "tips"; title?: string; items: string[] }
  | { kind: "callout"; body: string };

export type Guide = {
  slug: string;
  title: string;
  short: string;
  icon: LucideIcon;
  minutes: number;
  /** Componente interativo e após qual seção ele entra (índice). */
  interactive?: { kind: "outfits" | "cores" | "medidas"; after: number };
  /** Link externo à página de guia (aba que já existe no app). */
  externalHref?: string;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  /* ------------------------------------------------------------ */
  {
    slug: "como-tirar-suas-medidas",
    title: "Como tirar suas medidas",
    short: "O passo a passo para nunca mais errar tamanho — no provador ou na compra online.",
    icon: Ruler,
    minutes: 6,
    interactive: { kind: "medidas", after: 2 },
    sections: [
      {
        kind: "text",
        body: [
          "Nove entre dez looks ruins não são culpa da peça: são culpa do tamanho. Saber suas medidas exatas muda completamente a forma como você compra — principalmente online, onde não dá para provar.",
          "Você vai precisar apenas de uma fita métrica de costura (aquela flexível, custa poucos reais) e de 10 minutos. Se não tiver fita, use um barbante e meça com uma régua depois.",
        ],
      },
      {
        kind: "steps",
        title: "Medindo o seu corpo",
        items: [
          { t: "Ombro a ombro", d: "Nas costas, meça de uma ponta do osso do ombro à outra, passando pela base do pescoço. É a medida mais importante de todas: a costura da camiseta deve terminar exatamente onde o osso termina." },
          { t: "Peito (tórax)", d: "Passe a fita na parte mais larga do peito, na linha dos mamilos, por baixo dos braços. Mantenha a fita reta nas costas e respire normalmente — não estufe o peito." },
          { t: "Cintura", d: "Meça na altura onde você realmente usa a calça (geralmente na linha do umbigo ou logo abaixo), sem apertar. Não use a medida da cintura 'de sunga' — calça não fica ali." },
          { t: "Quadril", d: "Passe a fita na parte mais larga do quadril e do bumbum, com os pés juntos. É essa medida que define se uma calça reta ou baggy vai vestir bem." },
          { t: "Entrepernas (inseam)", d: "Do meio da virilha até o chão, com o pé descalço e a perna reta. É o que define o comprimento ideal da calça — a medida que quase ninguém sabe e todo site pergunta." },
          { t: "Comprimento de camiseta", d: "Da base do pescoço (atrás) até onde a camiseta deve terminar: no meio do zíper da calça. Anote esse número para comparar com as tabelas dos sites." },
        ],
      },
      {
        kind: "callout",
        body: "Truque de ouro: em vez de medir só o corpo, meça também a SUA MELHOR PEÇA — aquela camiseta ou calça que veste perfeitamente. Deite a peça em uma superfície plana, meça (largura do peito de costura a costura, comprimento, ombro) e compare com a tabela do site. Peça boa é gabarito.",
      },
      {
        kind: "table",
        title: "Tabela de referência — camisetas (Brasil)",
        note: "Medidas de tórax do corpo. Cada marca varia; use como ponto de partida e confira sempre a tabela do site.",
        head: ["Tamanho", "Tórax (corpo)", "Largura da peça (2x)", "Perfil"],
        rows: [
          ["P", "88–96 cm", "48–51 cm", "Magro / baixo"],
          ["M", "96–104 cm", "51–54 cm", "Médio"],
          ["G", "104–112 cm", "54–57 cm", "Atlético / mais alto"],
          ["GG", "112–120 cm", "57–60 cm", "Forte / largo"],
          ["XGG", "120+ cm", "60+ cm", "Plus / muito alto"],
        ],
      },
      {
        kind: "tips",
        title: "Erros que todo mundo comete",
        items: [
          "Medir por cima de roupa grossa — meça de camiseta fina ou sem camisa",
          "Apertar a fita para 'dar um tamanho menor' — a peça vai marcar",
          "Ignorar o ombro e olhar só o tórax — ombro errado não tem conserto",
          "Comprar oversized 2 tamanhos acima — oversized de verdade é modelagem, não tamanho errado",
          "Esquecer que jeans cede ~2 cm com o uso e algodão encolhe ~3% na primeira lavagem",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "como-combinar-acessorios",
    title: "Como combinar acessórios",
    short: "Relógio, cinto, correntes, óculos e boné: as regras que fazem o acabamento perfeito.",
    icon: Watch,
    minutes: 7,
    sections: [
      {
        kind: "text",
        body: [
          "Acessório é pontuação, não frase. Ele existe para dar acabamento ao look — nunca para competir com ele. A diferença entre um homem bem vestido e um homem 'produzido demais' costuma estar exatamente aqui.",
          "A regra mestra: no máximo 3 acessórios visíveis por look (relógio + cinto + um terceiro). Na dúvida, tire um antes de sair de casa.",
        ],
      },
      {
        kind: "steps",
        title: "As 5 regras de ouro",
        items: [
          { t: "Metais sempre da mesma família", d: "Prata com prata, dourado com dourado. Relógio de aço + corrente prateada + fivela prateada = coeso. Misturar metais no mesmo look quebra a harmonia — é o erro mais visível de todos." },
          { t: "Couros conversando entre si", d: "Cinto, sapato e pulseira do relógio devem estar na mesma família de cor: marrom com marrom, preto com preto. Não precisa ser idêntico — mas caramelo com preto grita." },
          { t: "Proporção com o seu corpo", d: "Pulso fino pede relógio de caixa menor (36–40 mm); pulso largo aguenta 42–45 mm. Corrente fina para look elegante, corrente média para street — corrente grossa quase nunca." },
          { t: "Um acessório de destaque por vez", d: "Se a corrente aparece, o relógio é discreto. Se os óculos são marcantes, o boné fica em casa. O olhar precisa de um ponto focal, não de uma disputa." },
          { t: "Formalidade coerente", d: "Relógio esportivo de borracha com alfaiataria não fecha; relógio social com look de praia também não. O acessório acompanha a escala de formalidade do look." },
        ],
      },
      {
        kind: "table",
        title: "Óculos por formato de rosto",
        head: ["Seu rosto", "O que funciona", "O que evitar"],
        rows: [
          ["Redondo", "Armações retangulares e quadradas — criam ângulo", "Armações redondas (arredondam ainda mais)"],
          ["Quadrado", "Redondas e aviador — suavizam o maxilar", "Quadradas pequenas e retas demais"],
          ["Oval", "Quase tudo: wayfarer, aviador, retangular", "Armações maiores que a largura do rosto"],
          ["Alongado", "Armações mais altas e largas, wayfarer", "Armações estreitas e pequenas"],
        ],
      },
      {
        kind: "table",
        title: "Guia rápido por acessório",
        head: ["Acessório", "Como acertar"],
        rows: [
          ["Relógio", "Couro para looks quentes e clássicos; aço para looks frios e noite. É o acessório masculino nº 1 — se for ter só um, é ele."],
          ["Cinto", "Sempre na cor do calçado. Fivela pequena e sem logo. Com camiseta para dentro, o cinto vira protagonista: capriche."],
          ["Corrente", "Fina (2–4 mm) sobre camiseta lisa. Uma só. Prata combina com quase tudo; dourada pede pele mais quente ou look terroso."],
          ["Boné", "Neutro e sem logo grande. Combina com casual e street; nunca com alfaiataria. Five panel para minimalista, trucker para retrô."],
          ["Meias", "Invisíveis no verão com barra dobrada; escuras lisas com calça escura; brancas só com look street e tênis."],
          ["Anéis", "No máximo 2, prateados e finos. Território avançado — domine o resto antes."],
          ["Pulseiras", "Uma de couro ou aço junto ao relógio. Pilha de pulseiras coloridas envelheceu mal."],
        ],
      },
      {
        kind: "tips",
        title: "Checklist antes de sair",
        items: [
          "Metais do mesmo tom? (prata OU dourado)",
          "Cinto na cor do sapato?",
          "No máximo 3 acessórios visíveis?",
          "Só 1 acessório chamando atenção?",
          "O relógio combina com a formalidade do look?",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "como-combinar-cores",
    title: "Como combinar cores",
    short: "Do neutro absoluto às combinações avançadas — com o combinador interativo de cores.",
    icon: Palette,
    minutes: 8,
    interactive: { kind: "cores", after: 1 },
    sections: [
      {
        kind: "text",
        body: [
          "Cor é onde a maioria trava — e é também o atalho mais rápido para parecer que você entende de moda. A boa notícia: você não precisa de teoria de círculo cromático. Precisa de um sistema simples e à prova de erro.",
          "O sistema: 80% do look em neutros (preto, branco, off-white, cinza, navy, bege, marrom) e no máximo 20% em cor. Domine isso e você nunca mais monta um look ruim. Escolha uma cor base abaixo e veja o que combina com ela.",
        ],
      },
      {
        kind: "steps",
        title: "As 4 leis da cor masculina",
        items: [
          { t: "Neutro com neutro sempre funciona", d: "Qualquer neutro combina com qualquer neutro. Preto + cinza, navy + bege, branco + marrom: são combinações impossíveis de errar. Comece 100% aqui." },
          { t: "Regra 60/30/10", d: "60% do look na cor dominante (geralmente a calça ou a terceira peça), 30% na secundária, 10% no detalhe (calçado, boné, acessório). Essa proporção é o que faz o look parecer 'pensado'." },
          { t: "Uma cor viva por look — no máximo", d: "Verde militar, vinho, azul petróleo, terracota: entram UMA por vez, sempre ancoradas em neutros. Duas cores fortes no mesmo look competem entre si e você perde." },
          { t: "Respeite a temperatura", d: "Cores quentes (bege, marrom, caramelo, terracota, verde-oliva) combinam entre si. Cores frias (preto, cinza, azul, branco puro) também. Misturar temperatura exige prática — deixe para depois." },
        ],
      },
      {
        kind: "table",
        title: "Contraste com o seu tom de pele",
        note: "Não é regra rígida — é um empurrão na direção certa.",
        head: ["Tom de pele", "Brilha com", "Cuidado com"],
        rows: [
          ["Clara", "Navy, verde-oliva, cinza escuro, terracota", "Tons pastéis muito claros (apagam)"],
          ["Morena", "Quase tudo — privilégio: off-white, vinho, verde, caramelo", "Tons muito próximos do seu tom de pele"],
          ["Negra", "Cores claras e vibrantes: off-white, bege, verde, azul royal", "Marrom muito escuro fechado no corpo todo"],
        ],
      },
      {
        kind: "tips",
        title: "Erros de cor que denunciam iniciante",
        items: [
          "Preto + azul marinho na mesma peça de cima e de baixo (parecem 'quase iguais' — escolha um)",
          "Mais de 3 cores no mesmo look",
          "Cor viva em cima E embaixo ao mesmo tempo",
          "Branco total sem nenhuma âncora escura (cinto, calçado ou óculos resolvem)",
          "Estampa colorida + peça colorida juntas",
        ],
      },
      {
        kind: "callout",
        body: "Exercício prático: abra seu guarda-roupa e separe as peças por temperatura (quentes × frias). Você vai descobrir em 5 minutos por que alguns looks seus nunca fecham — e quais peças destravam mais combinações se comprar a seguir.",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "modelagem-ideal-para-seu-corpo",
    title: "A modelagem ideal pro seu tipo de corpo",
    short: "Slim, reto, relaxed ou oversized? Descubra o caimento que valoriza a sua estrutura.",
    icon: PersonStanding,
    minutes: 8,
    sections: [
      {
        kind: "text",
        body: [
          "Não existe modelagem 'da moda' — existe modelagem que funciona no SEU corpo. A mesma calça baggy que fica incrível em um cara de 1,85 m pode achatar um cara de 1,68 m. Vestir bem é jogar com as suas proporções, não contra elas.",
          "Primeiro, entenda as 4 modelagens básicas. Depois, encontre seu tipo de corpo abaixo e veja o mapa completo.",
        ],
      },
      {
        kind: "table",
        title: "As 4 modelagens",
        head: ["Modelagem", "Como veste", "Para quem"],
        rows: [
          ["Slim", "Acompanha o corpo sem apertar", "Magros e baixos — cria linhas limpas e alonga"],
          ["Reta (regular)", "Cai reto do quadril ao tornozelo", "Todos os corpos — é o ponto de partida universal"],
          ["Relaxed", "Folga controlada, sem excesso", "Atléticos e fortes — conforto sem perder a forma"],
          ["Oversized / baggy", "Volume proposital e estruturado", "Altos e magros — exige equilíbrio de proporções"],
        ],
      },
      {
        kind: "steps",
        title: "O mapa por tipo de corpo",
        items: [
          { t: "Magro / longilíneo", d: "Objetivo: criar presença. Use camadas (camiseta + camisa aberta + jaqueta), texturas grossas (tricô, moletom pesado, sarja) e modelagem reta ou levemente relaxed. Evite slim colado no corpo inteiro (afina ainda mais) e oversized gigante sem estrutura (parece emprestado)." },
          { t: "Atlético / ombros largos", d: "Objetivo: não virar 'triângulo'. Parte de cima reta ou relaxed (nunca super justa marcando tudo — parece esforço), parte de baixo com algum volume para equilibrar os ombros. Cuidado com gola V profunda e camiseta 1 número menor." },
          { t: "Forte / corpo maior", d: "Objetivo: estrutura e linhas verticais. Modelagem reta com o OMBRO no lugar certo é tudo. Cores escuras e monocromia alongam; camisa aberta sobre camiseta cria linha vertical poderosa. Evite peças apertadas (marcam) E peças enormes (aumentam) — o meio-termo exato é seu melhor amigo. Terceira peça sempre." },
          { t: "Baixo (até ~1,70 m)", d: "Objetivo: alongar. Monocromia ou tons próximos da cintura para baixo (calça + calçado na mesma família), calça SEM dobra acumulada no tornozelo (faça barra!), camiseta terminando no meio do zíper, cintura da calça mais alta. Evite calça muito larga arrastando, camiseta comprida demais e contraste forte na linha da cintura (corta o corpo ao meio)." },
          { t: "Alto (1,85 m+)", d: "Objetivo: quebrar a verticalidade. Você é quem mais aproveita volume: baggy, oversized e camadas ficam editoriais. Contrastes de cor entre cima e baixo funcionam a seu favor. Só cuide dos comprimentos: manga e barra curtas demais denunciam — procure marcas com opção 'tall' ou ajuste no costureiro." },
        ],
      },
      {
        kind: "callout",
        body: "Regra que vale para todos os corpos: o OMBRO é a medida inegociável. Costura caindo antes do osso = peça pequena; caindo muito depois = peça grande (a menos que seja oversized proposital, com o resto do look equilibrado). Tórax e comprimento têm margem; ombro não tem.",
      },
      {
        kind: "tips",
        title: "Ajustes de costureiro que custam pouco e mudam tudo",
        items: [
          "Barra de calça no comprimento exato (R$ 15–30) — o ajuste com melhor custo-benefício que existe",
          "Afinar lateral de camiseta larga demais",
          "Encurtar manga de camisa",
          "Ajustar cintura de calça que serve no quadril",
          "Barra italiana em alfaiataria casual",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "hacks-rapidos",
    title: "Hacks rápidos pra se vestir melhor",
    short: "As regras de bolso de volume, textura, estampa e cor — decore e nunca mais monte um look errado.",
    icon: Zap,
    minutes: 4,
    sections: [
      {
        kind: "text",
        body: [
          "Não precisa decorar looks prontos: decore REGRAS. As fórmulas abaixo resolvem 90% das decisões na frente do espelho — é sempre um jogo de equilíbrio: se um lado tem volume, textura ou estampa, o outro lado compensa ficando limpo.",
        ],
      },
      {
        kind: "steps",
        title: "Equilíbrio de volume",
        items: [
          { t: "Parte de baixo larga → parte de cima ajustada", d: "Baggy, cargo ampla ou parachute pedem uma peça de cima mais próxima do corpo. O contraste define a silhueta em vez de te engolir." },
          { t: "Parte de cima larga → parte de baixo reta ou larga", d: "Camiseta oversized ou moletom amplo com calça skinny cria formato de pirulito. Embaixo, vá de reta ou também ampla." },
        ],
      },
      {
        kind: "steps",
        title: "Textura e estampa: um lado fala, o outro escuta",
        items: [
          { t: "Parte de cima com textura → parte de baixo lisa", d: "Tricô encorpado, moletom pesado ou veludo em cima pedem calça de superfície limpa." },
          { t: "Parte de baixo com textura → parte de cima lisa", d: "Veludo cotelê, sarja grossa ou denim cru embaixo pedem camiseta ou camisa lisa em cima." },
          { t: "Parte de cima estampada → parte de baixo lisa", d: "Camiseta gráfica, floral ou listrada é a protagonista — a calça vira moldura neutra." },
          { t: "Parte de baixo estampada → parte de cima lisa", d: "Calça camuflada ou estampada só funciona com a parte de cima em paz. Duas estampas no mesmo look = briga que ninguém vence." },
        ],
      },
      {
        kind: "table",
        title: "A parte de cima certa pra cada jeans",
        head: ["Seu jeans", "Parte de cima ideal"],
        rows: [
          ["Jeans azul", "Tons pastéis: off-white, azul-claro, rosa seco, verde-menta"],
          ["Jeans marrom", "Tons terrosos: bege, caramelo, verde-oliva, cru"],
          ["Jeans preto", "Tons neutros: preto, branco, cinza, grafite"],
        ],
      },
      {
        kind: "steps",
        title: "Cores × joias",
        items: [
          { t: "Cores frias → joias prata", d: "Preto, cinza, azul e branco puro pedem corrente, anel e relógio prateados — mesma temperatura, look coeso." },
          { t: "Cores quentes → joias douradas", d: "Bege, marrom, terracota, verde-oliva e cru brilham com dourado — o metal quente completa a paleta." },
        ],
      },
      {
        kind: "callout",
        body: "Teste rápido no espelho: olhe o look e pergunte 'os dois lados estão falando ao mesmo tempo?'. Se cima e baixo têm volume, textura ou estampa juntos, simplifique um deles. Equilíbrio é o hack por trás de todos os hacks.",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "calca-ideal-para-cada-tenis",
    title: "A calça ideal pra cada tipo de tênis",
    short: "O tênis define a barra: aprenda a proporção exata entre calça e calçado.",
    icon: Layers,
    minutes: 6,
    sections: [
      {
        kind: "text",
        body: [
          "A regra que ninguém te contou: quem manda na escolha da calça é o TÊNIS. O volume do calçado define a largura da barra, e o encontro entre os dois (o 'break') define se o look parece intencional ou acidental.",
          "Princípio geral: tênis volumoso pede calça com mais tecido; tênis baixo e fino pede barra mais limpa. Barra estreita com tênis gigante parece pé de palhaço; calça larga sobre tênis fininho engole o calçado.",
        ],
      },
      {
        kind: "table",
        title: "O mapa tênis → calça",
        head: ["Seu tênis", "Calça ideal"],
        rows: [
          ["Minimalista branco (couro, clean)", "Reta ou alfaiataria casual"],
          ["Chunky (sola grossa)", "Baggy, cargo ampla ou parachute"],
          ["Retrô baixo (Samba, campus, court)", "Reta ou baggy com cuff"],
          ["Running / tech", "Calça técnica ou cargo"],
          ["Skate clássico (Old Skool, Dunk)", "Jeans reto ou jorts"],
          ["Bota (chelsea, coturno, work)", "Reta, bootcut ou cargo"],
        ],
      },
      {
        kind: "tips",
        title: "Erros de proporção que estragam o look",
        items: [
          "Calça skinny com tênis chunky (o contraste achata você)",
          "Barra acumulada SEM intenção sobre tênis fino (parece calça de irmão mais velho)",
          "Calça larga demais escondendo o tênis inteiro",
          "Bota com barra enfiada pra dentro em look casual",
          "Comprar calça sem saber com quais 2–3 calçados ela vai viver",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "tenis-ideal-para-cada-roupa",
    title: "O tênis ideal pra cada roupa",
    short: "O caminho inverso: já sabe o look? Descubra qual calçado fecha a proposta.",
    icon: Footprints,
    minutes: 6,
    sections: [
      {
        kind: "text",
        body: [
          "Você montou o look e travou na hora do calçado? Este guia resolve. O tênis é quem assina a proposta do look: o MESMO jeans com camiseta branca vira casual premium com um couro branco, vira street com um chunky e vira retrô com um Samba.",
          "Se for para ter poucos, tenha estes três: um branco minimalista (o coringa absoluto), um retrô baixo (personalidade) e uma bota ou robusto (frio, noite e workwear). Com esse trio você fecha 95% dos looks.",
        ],
      },
      {
        kind: "table",
        title: "O mapa roupa → tênis",
        head: ["Seu look", "Calçado certo", "Por quê"],
        rows: [
          ["Alfaiataria casual (calça de tecido + tricô/camisa)", "Minimalista branco ou couro clean", "O tênis limpo moderniza a alfaiataria sem roubar a elegância."],
          ["Jeans reto + camiseta", "Retrô baixo ou branco minimalista", "Base clássica pede calçado clássico — o retrô adiciona personalidade."],
          ["Cargo / baggy / parachute", "Chunky ou trail robusto", "Volume embaixo pede volume no pé — proporção é tudo."],
          ["All black noturno", "Tênis preto limpo ou chelsea boot", "Continuidade da cor alonga a silhueta e mantém a presença."],
          ["Workwear (jaqueta utilitária, sarja)", "Bota de trabalho ou couro robusto", "A bota é a raiz do estilo — tênis fino quebraria o código."],
          ["Bermuda / jorts no verão", "Perfil baixo (court, vulcanizado)", "Perna de fora pede calçado discreto — chunky com bermuda desequilibra."],
          ["Look técnico / gorpcore", "Trail running", "A sola dentada e as cores técnicas SÃO o estilo."],
          ["Smart casual de trabalho", "Couro branco ou marrom clean", "Formal o bastante para reunião, casual o bastante para o happy hour."],
        ],
      },
      {
        kind: "steps",
        title: "E a cor do tênis?",
        items: [
          { t: "Branco", d: "Combina com absolutamente tudo. Se o look já tem muita informação, o branco acalma. Único cuidado: manter limpo." },
          { t: "Preto", d: "O rei da noite e dos looks escuros. Com look claro, cria âncora de contraste no pé — funciona, mas pesa." },
          { t: "Terroso (bege, caramelo, marrom)", d: "Par perfeito de looks quentes: bege, verde-oliva, marrom, cru. O segredo dos looks de outono." },
          { t: "Colorido / statement", d: "É o SEU 10% de destaque. O resto do look inteiro vira moldura neutra. Um por look, sem exceção." },
        ],
      },
      {
        kind: "callout",
        body: "Teste dos 3 segundos: olhe o look no espelho e pergunte 'o tênis está conversando com a calça ou só estava na sapateira?'. Se a resposta for a segunda, troque. O pé é onde o olhar termina — e onde o capricho aparece.",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "monte-27-outfits-com-9-pecas",
    title: "Monte 27 outfits com 9 peças",
    short: "A matemática do guarda-roupa cápsula — com montador interativo de combinações.",
    icon: Grid3x3,
    minutes: 10,
    interactive: { kind: "outfits", after: 1 },
    sections: [
      {
        kind: "text",
        body: [
          "3 partes de cima × 3 partes de baixo × 3 calçados = 27 combinações diferentes. Essa é a mágica do guarda-roupa cápsula: quando TODAS as peças conversam entre si, cada item novo multiplica (e não soma) suas opções.",
          "Escolhemos as 9 peças abaixo porque cada uma combina com TODAS as outras — não existe combinação proibida entre elas. Use o montador para explorar as 27 e descobrir as que mais têm a ver com você. Depois, preencha a tabela com as SUAS 9 peças e monte os 27 outfits com o que já está no seu guarda-roupa.",
        ],
      },
      {
        kind: "steps",
        title: "Por que essas 9 peças",
        items: [
          { t: "Camiseta lisa branca", d: "A base universal. Ilumina looks escuros, sustenta looks claros e aceita qualquer terceira peça por cima." },
          { t: "Moletom cinza", d: "O conforto que não desiste do estilo: camada de frio, casual de domingo e par perfeito de qualquer calça da cápsula." },
          { t: "Camisa azul-clara", d: "O 'arrumado' do trio. Fechada = trabalho; aberta sobre a camiseta = terceira peça casual." },
          { t: "Jeans azul baggy", d: "O volume street da cápsula. A barra empilhando de leve sobre o tênis faz o look inteiro parecer intencional." },
          { t: "Jorts camuflado", d: "A peça de personalidade do verão — o camuflado funciona como um neutro texturizado quando o resto do look é liso." },
          { t: "Calça preta reta", d: "A mais versátil pra noite: alonga a silhueta e aceita qualquer parte de cima sem esforço." },
          { t: "Retrô runner", d: "O tênis de corrida vintage: perfil fino e visual atemporal que injeta personalidade nas bases simples." },
          { t: "Tênis fino (Samba, Onitsuka, Speedcat)", d: "Perfil baixo que limpa e atualiza qualquer combinação — do jorts à calça preta." },
          { t: "Work boot", d: "Textura e presença pro frio: transforma qualquer combinação em look workwear." },
        ],
      },
      {
        kind: "text",
        title: "Como usar a cápsula na vida real",
        body: [
          "Dia a dia: camiseta branca + jeans baggy + retrô runner. Verão: camiseta ou moletom leve + jorts camuflado + tênis fino. Dia mais arrumado ou noite: camisa azul-clara + calça preta reta + tênis fino ou work boot. Frio: moletom cinza + calça preta + work boot.",
          "O melhor efeito colateral: com 27 combinações fáceis no armário, você para de comprar por impulso. Toda peça nova passa a responder uma pergunta — 'você multiplica minhas opções ou só ocupa cabide?'",
        ],
      },
      {
        kind: "tips",
        title: "Regras da cápsula",
        items: [
          "As 9 peças precisam estar SEMPRE limpas e passadas — cápsula pequena exige manutenção",
          "Caimento impecável em todas (releia o guia de medidas)",
          "Prefira tecidos melhores: são poucas peças, dá para investir mais em cada uma",
          "Terceira peça (jaqueta, overshirt) entra POR CIMA da cápsula e multiplica ainda mais",
          "Complete as 27 no montador acima antes de comprar qualquer peça nova",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "melhores-marcas",
    title: "As melhores marcas pra se comprar",
    short: "O mapa de onde investir cada real — do básico bem-feito à peça de elevação.",
    icon: Store,
    minutes: 8,
    sections: [
      {
        kind: "text",
        body: [
          "Marca certa não é a mais cara — é a que entrega o melhor tecido e caimento pelo preço que você pode pagar HOJE. Este guia lista, por categoria, as marcas que a gente realmente recomenda para montar o guarda-roupa sem desperdiçar dinheiro.",
          "Antes da lista, a estratégia: gaste POUCO em tendências e camisetas de giro rápido; gaste BEM em calçado, terceira peça e alfaiataria — as peças que aparecem mais e duram anos.",
        ],
      },
      {
        kind: "table",
        title: "Básicos (camiseta, malha)",
        head: ["Marcas"],
        rows: [
          ["Hering"],
          ["Zara"],
          ["Romã"],
          ["Rapha (cupom “Family” 15% off)"],
          ["H&M"],
          ["Uniqlo"],
        ],
      },
      {
        kind: "table",
        title: "Streetwear",
        head: ["Marcas"],
        rows: [
          ["Youcom"],
          ["Renner"],
          ["Bershka"],
          ["Zara"],
          ["Aphase"],
          ["Singa"],
          ["Droper"],
          ["All Glory"],
        ],
      },
      {
        kind: "table",
        title: "Tênis",
        head: ["Marcas"],
        rows: [
          ["Öus"],
          ["Converse"],
          ["Hocks"],
          ["Tesla"],
          ["Olympikus"],
          ["Logus"],
          ["Vans"],
          ["Artwalk"],
          ["YourID"],
          ["Guadalupe"],
          ["Droper"],
        ],
      },
      {
        kind: "table",
        title: "Acessórios",
        head: ["Marcas"],
        rows: [
          ["Catena Chains"],
          ["Casio & G-Shock (cupom “RAPHAGSHOCK” 15% off)"],
          ["The New Days Eyeworks"],
          ["Key Design"],
        ],
      },
      {
        kind: "table",
        title: "Bonés",
        head: ["Marcas"],
        rows: [
          ["New Era"],
          ["Mitchell & Ness"],
          ["Droper"],
          ["Otto Cap"],
        ],
      },
      {
        kind: "table",
        title: "Jeans",
        head: ["Marcas"],
        rows: [
          ["Levi’s"],
          ["Delafoe"],
          ["Aphase"],
          ["Rapha (cupom “Family” 15% off)"],
          ["Onyx"],
        ],
      },
      {
        kind: "table",
        title: "Jorts",
        head: ["Marcas"],
        rows: [
          ["Takeoff"],
          ["L’Ordre"],
          ["Delafoe"],
          ["Rapha (cupom “Family” 15% off)"],
        ],
      },
      {
        kind: "tips",
        title: "Estratégias de compra inteligente",
        items: [
          "Brechós e garimpos: jaquetas de couro, trucker jackets e peças vintage por 1/5 do preço — com mais história",
          "Outlets valem para tênis clássico e alfaiataria; desconfie de 'coleção feita para outlet'",
          "Black Friday: liste ANTES o que falta (use sua lista do Guarda-Roupa aqui do app) e ignore o resto",
          "1 peça boa > 3 peças médias — sempre",
          "Nenhuma marca substitui caimento: peça barata ajustada no costureiro vence peça cara no tamanho errado",
        ],
      },
      {
        kind: "callout",
        body: "Aproveite os cupons: “Family” dá 15% off na Rapha e “RAPHAGSHOCK” dá 15% off na Casio & G-Shock. Preços e disponibilidade mudam — use a lista como bússola, não como regra.",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "como-fazer-suas-pecas-durarem-mais",
    title: "Como fazer suas peças durarem mais",
    short: "O manual de cuidado por material: lavar menos, lavar certo e dobrar o tempo de vida.",
    icon: Sparkles,
    minutes: 9,
    sections: [
      {
        kind: "text",
        body: [
          "A peça mais sustentável (e mais barata) é a que você já tem. A maior parte do desgaste das roupas não vem do uso — vem da LAVAGEM errada. Aprender a cuidar dobra a vida útil do guarda-roupa e mantém aquele caimento de peça nova por anos.",
          "Regra número zero, válida para tudo: lave MENOS. Roupa usada uma vez sem suor não precisa de máquina — precisa de ar. Pendure, deixe respirar uma noite e ela volta pro armário.",
        ],
      },
      {
        kind: "steps",
        title: "Cuidado por material",
        items: [
          { t: "Camisetas de algodão", d: "Lave fria (30°) e do avesso — protege a cor e a estampa. Nada de secadora: é ela que encolhe e deforma gola. Seque à sombra, pendurada pela barra (não pelos ombros, que estica). Gola ondulada = fim precoce; cuidando, uma boa camiseta dura 3+ anos." },
          { t: "Jeans", d: "O segredo dos obcecados: lave o mínimo possível (a cada 8–10 usos). Do avesso, água fria, sem amaciante em excesso. Manchinha pontual? Pano úmido resolve. Jeans que quase não lava desenvolve o desbote natural que as marcas tentam imitar." },
          { t: "Tricô e lã", d: "NUNCA pendure (deforma os ombros) — sempre dobrado na prateleira. Lave à mão ou no ciclo delicado dentro de saquinho, com sabão neutro. Seque na horizontal sobre uma toalha. Bolinhas? Removedor de pilling (ou lâmina com MUITO cuidado) renova a peça em 5 minutos." },
          { t: "Couro e camurça", d: "Longe do sol e da umidade. Hidrate o couro 2x por ano com creme específico. Camurça pede escova própria e spray impermeabilizante ao comprar. Molhou? Seque naturalmente, NUNCA com secador. Cabide largo de madeira para jaquetas — os finos deformam o ombro." },
          { t: "Tênis", d: "Limpeza rápida semanal (escova macia + pano) evita a faxina impossível depois. Sola e entressola: escova + sabão neutro. Cabedal de couro: pano úmido. Camurça: só escova a seco. Palmilhas para fora para arejar. Papel dentro na secagem mantém a forma. Rotacione: 2 pares alternados duram mais que o dobro de 1." },
          { t: "Alfaiataria", d: "Cabide estruturado sempre. Vapor no lugar de ferro (o brilho de ferro em tecido de alfaiataria não sai mais). Lavagem a seco só quando necessário de verdade — 2–3x por ano é suficiente com bom arejamento." },
        ],
      },
      {
        kind: "table",
        title: "Guia rápido de lavagem",
        head: ["Peça", "Frequência", "Temperatura", "Segredo"],
        rows: [
          ["Camiseta", "A cada uso", "Fria (30°)", "Do avesso, secar à sombra"],
          ["Camisa", "A cada 1–2 usos", "Fria/morna", "Pendurar ainda úmida = quase não passa"],
          ["Jeans", "A cada 8–10 usos", "Fria", "Do avesso, pouco sabão"],
          ["Tricô", "A cada 4–5 usos", "Fria, à mão", "Secar deitado, guardar dobrado"],
          ["Moletom", "A cada 3–4 usos", "Fria", "Do avesso, sem secadora"],
          ["Alfaiataria", "2–3x por ano (a seco)", "—", "Vapor + arejamento entre usos"],
        ],
      },
      {
        kind: "tips",
        title: "Hábitos que salvam o guarda-roupa",
        items: [
          "Menos sabão do que você acha: excesso desgasta fibra e desbota",
          "Amaciante quase nunca (destrói elastano, impermeabiliza toalhas e roupas técnicas)",
          "Zíperes fechados e velcros colados antes da máquina (são eles que puxam fio)",
          "Costureiro aos primeiros sinais: barra descosturada e botão frouxo custam centavos hoje, a peça inteira depois",
          "Guarde sapatos com forma (shoe tree) ou papel — dobra a vida do couro",
          "Traça no armário? Cedro ou lavanda, e lã sempre limpa antes de guardar na estação",
        ],
      },
      {
        kind: "callout",
        body: "Faça as contas: uma camiseta de R$ 120 que dura 3 anos custa R$ 3,30/mês. A de R$ 40 que deforma em 4 meses custa R$ 10/mês. Cuidar bem é o maior desconto que existe.",
      },
    ],
  },

  /* ------------------------------------------------------------ */
  {
    slug: "combinacoes-simples-com-jeans",
    title: "Combinações simples com jeans",
    short: "A peça mais democrática do mundo — 9 fórmulas prontas por lavagem e ocasião.",
    icon: Shirt,
    minutes: 7,
    sections: [
      {
        kind: "text",
        body: [
          "Se existe uma peça que todo homem tem, é o jeans. E é justamente por ser tão comum que ele separa quem entende de proporção de quem veste no automático. A variável-chave é a LAVAGEM: cada tom de azul tem seu território.",
          "Regra de bolso: quanto mais ESCURO o jeans, mais elegante e noturno; quanto mais CLARO, mais casual e diurno. O corte reto de lavagem escura é o mais versátil de todos — se tiver um só, é esse.",
        ],
      },
      {
        kind: "steps",
        title: "9 fórmulas prontas",
        items: [
          { t: "1. Jeans escuro + camiseta branca + tênis branco", d: "O look mais confiável da história. Funciona em 90% das situações casuais. Acrescente relógio e pronto." },
          { t: "2. Jeans escuro + camiseta preta + chelsea boot", d: "Modo noite ativado: bar, jantar, encontro. Jaqueta de couro por cima se esfriar = look completo." },
          { t: "3. Jeans escuro + camisa azul-clara + couro marrom", d: "O smart casual com denim: casual friday, almoço de trabalho, reunião leve. Cinto marrom fecha o conjunto." },
          { t: "4. Jeans claro + camiseta off-white + tênis retrô", d: "Verão em fórmula: leve, retrô e fácil. Óculos escuros elevam." },
          { t: "5. Jeans claro + tricô creme + couro claro", d: "Tom sobre tom claro = editorial de outono. Uma das combinações mais subestimadas que existem." },
          { t: "6. Jeans preto + tudo preto + tênis preto", d: "All black com denim: mais texturizado (e mais casual) que alfaiataria preta. Corrente prata como único brilho." },
          { t: "7. Jeans médio + moletom cinza + tênis branco", d: "O casual de domingo elevado: conforto total sem parecer pijama. Boné neutro combina." },
          { t: "8. Double denim (jaqueta + calça)", d: "A regra inegociável: lavagens BEM diferentes (jaqueta clara + calça escura, ou o inverso) e camiseta branca separando. Lavagens iguais = macacão acidental." },
          { t: "9. Jeans reto + blazer desestruturado", d: "O contraste esperto: a peça mais formal com a mais casual. Camiseta branca ou tricô fino por baixo — nunca camisa social engomada." },
        ],
      },
      {
        kind: "table",
        title: "Lavagem × ocasião",
        head: ["Lavagem", "Território", "Evite em"],
        rows: [
          ["Escura (raw, índigo)", "Noite, trabalho casual, date, eventos", "Praia e calor extremo (esquenta e pesa)"],
          ["Média (stone)", "Dia a dia, faculdade, fim de semana", "Ocasiões mais arrumadas à noite"],
          ["Clara (delavê)", "Verão, viagens, looks retrô e street", "Trabalho formal e jantares elegantes"],
          ["Preta", "Noite, shows, looks minimalistas e street", "Sol forte constante (desbota rápido — lave sempre do avesso)"],
        ],
      },
      {
        kind: "tips",
        title: "O que separa o jeans bom do jeans datado",
        items: [
          "Corte reto ou levemente amplo — o skinny colado ficou em 2015",
          "Lavagem uniforme, sem 'bigodes' marcados ou puídos artificiais exagerados",
          "Sem strass, bordado ou rasgo excessivo — o jeans é base, não estampa",
          "Barra no comprimento certo (releia o guia da calça × tênis)",
          "Cós na cintura natural — nem surrando o quadril, nem no umbigo",
        ],
      },
      {
        kind: "callout",
        body: "Quer ver essas fórmulas aplicadas? Abra as Combinações e filtre pela cor Azul — boa parte dos looks do lookbook usa denim como base.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
