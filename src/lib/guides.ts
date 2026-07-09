import {
  Ruler,
  Watch,
  Palette,
  PersonStanding,
  Zap,
  Footprints,
  Shirt,
  Tag,
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
    short: "17 truques de efeito imediato — do meio tuck à regra do espelho.",
    icon: Zap,
    minutes: 6,
    sections: [
      {
        kind: "text",
        body: [
          "Estilo é um jogo de detalhes acumulados. Cada hack abaixo leva menos de um minuto e sobe o nível do look na hora. Aplique 3 ou 4 no mesmo dia e as pessoas vão notar que algo mudou — sem saber dizer o quê.",
        ],
      },
      {
        kind: "steps",
        title: "Os 17 hacks",
        items: [
          { t: "1. Meio tuck (french tuck)", d: "Coloque só a frente da camiseta para dentro da calça. Mostra o cinto, define a cintura e deixa o look intencional em 5 segundos." },
          { t: "2. Dobra na manga da camisa", d: "Duas dobras largas até o meio do antebraço. Camisa arregaçada = relaxado com propósito. Camisa de punho fechado no calor = desconforto visível." },
          { t: "3. Cuff na barra da calça", d: "Uma ou duas dobras de 3–4 cm mostrando o tênis (e o tornozelo no verão). Alinha a proporção da perna e destaca o calçado." },
          { t: "4. Terceira peça sempre que possível", d: "Camisa aberta, overshirt ou jaqueta sobre a base. É a diferença entre 'se vestiu' e 'se arrumou'." },
          { t: "5. Tênis branco impecável", d: "Limpe semanalmente (escova + sabão neutro). Tênis branco sujo derruba QUALQUER look; limpo, eleva até o mais básico." },
          { t: "6. Passe a roupa (ou vapor)", d: "Camiseta amassada anula peça cara. Um steamer portátil resolve em 2 minutos e é o investimento mais subestimado do guarda-roupa." },
          { t: "7. Monocromático em 1 minuto", d: "Sem tempo para pensar? Tons da mesma família da cabeça aos pés (preto+grafite, bege+cru). Parece estiloso, é só preguiça inteligente." },
          { t: "8. Camadas com comprimentos diferentes", d: "Camiseta um pouco mais longa aparecendo sob o moletom ou jaqueta: profundidade instantânea no look." },
          { t: "9. Regra do espelho de corpo inteiro", d: "Foto no espelho antes de sair, de corpo inteiro. O olho percebe na foto o que não percebe ao vivo. 10 segundos que salvam o dia." },
          { t: "10. Óculos de sol como acessório fixo", d: "Um wayfarer ou retangular preto no rosto ou pendurado na gola muda a atitude do look de dia." },
          { t: "11. Tire 1 antes de sair", d: "Look pronto? Remova um acessório ou uma peça de destaque. Menos é sempre mais seguro que mais." },
          { t: "12. Meia invisível no verão", d: "Barra dobrada + tornozelo à mostra + meia invisível = frescor e proporção. Meia branca aparecendo com look elegante = quebra tudo." },
          { t: "13. Perfume no ponto certo", d: "Pescoço e pulsos, 2–3 borrifadas. Estilo também é memória olfativa — ninguém esquece o cara que cheira bem e discretamente." },
          { t: "14. Postura de dono", d: "Ombros para trás, peito aberto. A mesma roupa fica 2 níveis melhor num corpo bem postado. É de graça." },
          { t: "15. Cabelo e barba na régua", d: "Corte a cada 3–4 semanas. O melhor look do mundo perde para um acabamento desleixado no espelho." },
          { t: "16. Cabides iguais e finos", d: "Guarda-roupa organizado com cabides uniformes = você VÊ suas opções = combina melhor. Bagunça esconde peça boa." },
          { t: "17. Uniforme pessoal", d: "Encontrou uma fórmula que funciona? Repita com pequenas variações. Os homens mais estilosos do mundo usam 'sempre o mesmo' — e é por isso que têm identidade." },
        ],
      },
      {
        kind: "callout",
        body: "Desafio: escolha 3 hacks desta lista e aplique amanhã. Depois registre no seu Plano de Ação o que funcionou — repetição transforma truque em hábito.",
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
        head: ["Seu tênis", "Calça ideal", "Como acertar a barra"],
        rows: [
          ["Minimalista branco (couro, clean)", "Reta, slim ou alfaiataria casual", "Barra tocando de leve o tênis, sem acumular. Versão verão: cuff mostrando o tornozelo."],
          ["Chunky (sola grossa)", "Baggy, cargo ampla ou parachute", "Barra larga cobrindo o cadarço, empilhando de leve. É o par natural do volume."],
          ["Retrô baixo (Samba, campus, court)", "Reta ou baggy com cuff", "Barra levemente acima ou com dobra — o perfil baixo do tênis merece aparecer inteiro."],
          ["Running / tech", "Calça técnica, jogger ou cargo", "Barra com ajuste (elástico/cordão) abraçando o tornozelo ou caindo limpa sobre o cabedal."],
          ["Skate clássico (Old Skool, Dunk)", "Jeans reto ou jorts", "Barra reta batendo no colarinho do tênis; com jorts, comprimento abaixo do joelho."],
          ["Bota (chelsea, coturno, work)", "Reta ou cargo", "Barra por cima do cano (nunca enfiada dentro, exceto coturno + look militar proposital) ou dobra dupla mostrando o cano."],
        ],
      },
      {
        kind: "steps",
        title: "Os 3 tipos de barra (break)",
        items: [
          { t: "No break — barra limpa", d: "A calça termina exatamente onde o tênis começa, sem dobrar o tecido. Visual mais elegante e alongado. Ideal para alfaiataria casual e tênis minimalista." },
          { t: "Slight break — toque leve", d: "A barra encosta no tênis e dobra 1 dedo de tecido. O meio-termo universal: funciona com jeans reto e quase todo calçado." },
          { t: "Stacked — empilhado", d: "Tecido sobrando de propósito, empilhando sobre o tênis. Código do street e do workwear com baggy, cargo e denim pesado. Exige tênis volumoso para equilibrar." },
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
          "Escolhemos as 9 peças abaixo porque cada uma combina com TODAS as outras — não existe combinação proibida entre elas. Use o montador para explorar as 27 e descobrir as que mais têm a ver com você.",
        ],
      },
      {
        kind: "steps",
        title: "Por que essas 9 peças",
        items: [
          { t: "Camiseta branca lisa", d: "A base universal. Ilumina looks escuros, sustenta looks claros e aceita qualquer terceira peça por cima." },
          { t: "Camiseta preta lisa", d: "Presença instantânea. É a base dos looks de noite e o contraste dos looks claros." },
          { t: "Camisa azul-clara (oxford)", d: "O 'arrumado' do trio. Fechada = trabalho; aberta sobre camiseta = terceira peça casual." },
          { t: "Jeans escuro reto", d: "A calça mais versátil que existe: do churrasco à reunião casual sem trocar nada." },
          { t: "Chino bege", d: "O neutro quente que destrava looks claros e combinações de verão." },
          { t: "Alfaiataria cinza", d: "Eleva qualquer parte de cima. Com camiseta preta, é elegância sem esforço." },
          { t: "Tênis branco minimalista", d: "Combina com as 9 combinações de cima e baixo. O coringa absoluto." },
          { t: "Chelsea boot preta", d: "Transforma qualquer combinação em look de noite ou inverno." },
          { t: "Tênis retrô", d: "Injeta personalidade nas bases mais simples." },
        ],
      },
      {
        kind: "text",
        title: "Como usar a cápsula na vida real",
        body: [
          "Semana de trabalho: segunda a sexta resolvida com camisa + alfaiataria + couro/branco, variando as camisetas nos dias mais leves. Fim de semana: camisetas + jeans/chino + retrô. Encontro à noite: preto + jeans escuro + chelsea.",
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
          "Marca certa não é a mais cara — é a que entrega o melhor tecido e caimento pelo preço que você pode pagar HOJE. Este guia organiza o mercado brasileiro em três faixas, por categoria, para você montar o guarda-roupa sem desperdiçar dinheiro.",
          "Antes da lista, a estratégia: gaste POUCO em tendências e camisetas de giro rápido; gaste BEM em calçado, terceira peça e alfaiataria — as peças que aparecem mais e duram anos.",
        ],
      },
      {
        kind: "table",
        title: "Básicos (camisetas, malha)",
        head: ["Faixa", "Marcas", "O que esperar"],
        rows: [
          ["Econômica", "Hering, Renner, C&A, Youcom", "Ótimo custo-benefício em camisetas lisas. Prove sempre: modelagens variam muito."],
          ["Média", "Zara, Reserva, Osklen básicos, Insider", "Tecido melhor, caimento mais moderno. Insider brilha em básicos tecnológicos."],
          ["Investimento", "Osklen, Handred, básicos premium importados", "Peso de tecido e acabamento visivelmente superiores. Para as peças que você usa toda semana."],
        ],
      },
      {
        kind: "table",
        title: "Alfaiataria casual e smart casual",
        head: ["Faixa", "Marcas", "O que esperar"],
        rows: [
          ["Econômica", "Renner (linha alfaiataria), C&A, Zara básicos", "Boas calças de alfaiataria casual para começar."],
          ["Média", "Aramis, VR, Zara premium, Reserva", "Caimento superior, tecidos com elastano e melhor estrutura."],
          ["Investimento", "Richards, Foxton, alfaiatarias locais", "Tecidos nobres e acabamento fino. Alfaiataria local sob medida costuma valer mais que grife."],
        ],
      },
      {
        kind: "table",
        title: "Streetwear",
        head: ["Faixa", "Marcas", "O que esperar"],
        rows: [
          ["Econômica", "Youcom, Renner street, marcas de fast fashion", "Volume e modelagem atual sem comprometer o orçamento."],
          ["Média", "Baw, Approve, Class, Vans (vestuário)", "As marcas nacionais que definem o street brasileiro atual."],
          ["Investimento", "Piet, High Company, Sufgang, importados", "Design autoral, drops limitados e qualidade de tecido acima da média."],
        ],
      },
      {
        kind: "table",
        title: "Tênis e calçados",
        head: ["Faixa", "Marcas", "O que esperar"],
        rows: [
          ["Econômica", "Vans, Converse, adidas/Nike linhas clássicas", "Clássicos atemporais por preço justo — Old Skool e Chuck seguram qualquer look."],
          ["Média", "New Balance, adidas Originals (Samba/Campus), Nike retrôs, Veja", "O ponto ideal entre qualidade, conforto e estética atual."],
          ["Investimento", "New Balance Made in USA, colaborações, couro premium europeu", "Materiais e construção de outro nível. Para quem já tem a base resolvida."],
        ],
      },
      {
        kind: "table",
        title: "Acessórios",
        head: ["Categoria", "Recomendações"],
        rows: [
          ["Relógios", "Casio (vintage e G-Shock), Seiko, Orient — os três entregam MUITO acima do preço. Seiko 5 é o melhor primeiro relógio automático."],
          ["Óculos", "Ray-Ban (clássicos wayfarer/aviador), Chilli Beans para experimentar formatos, óticas locais para grau + estilo."],
          ["Cintos e couro", "Sacola de couro de fábrica local > logo de grife. Procure couro legítimo com fivela discreta."],
          ["Meias e underwear", "Insider, Mash, Zee.Dog Human — conforto e durabilidade nos itens que você usa todo dia."],
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
        body: "Transparência: nenhuma marca citada patrocina esta lista. São referências de mercado pela relação qualidade × preço × disponibilidade no Brasil — e preços mudam. Use as faixas como bússola, não como regra.",
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
