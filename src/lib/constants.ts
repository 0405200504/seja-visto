export const OCCASIONS: Record<string, string> = {
  "dia-a-dia": "Dia a dia",
  trabalho: "Trabalho",
  date: "Date",
  noite: "Noite",
  faculdade: "Faculdade",
  viagem: "Viagem",
  "evento-casual": "Evento casual",
};

export const STYLES: Record<string, string> = {
  casual: "Casual",
  streetwear: "Streetwear",
  workwear: "Workwear",
  smartcasual: "Smart Casual",
  oldmoney: "Old Money",
  preppy: "Preppy",
  minimalista: "Minimalista",
  gorpcore: "Gorpcore",
  vintage: "Vintage",
};

export type StyleProfile = {
  slug: string;
  label: string;
  tagline: string;
  description: string;
  keyPieces: string[];
  imageCount: number;
};

export const STYLE_PROFILES: Record<string, StyleProfile> = {
  casual: {
    slug: "casual",
    label: "Casual",
    tagline: "O básico bem executado",
    description:
      "Peças simples, caimento certo e zero esforço aparente. É o estilo mais versátil: funciona no dia a dia, em encontros e em quase qualquer ocasião informal.",
    keyPieces: ["Camiseta lisa de qualidade", "Jeans reto", "Tênis branco limpo", "Jaqueta versátil"],
    imageCount: 10,
  },
  streetwear: {
    slug: "streetwear",
    label: "Streetwear",
    tagline: "Atitude urbana com identidade",
    description:
      "Volumes amplos, referências de rua e peças statement. Boxy tees, calças largas e sneakers marcantes — presença e autenticidade em primeiro lugar.",
    keyPieces: ["Boxy/oversized tee", "Baggy jeans ou cargo", "Chunky sneakers", "Boné"],
    imageCount: 10,
  },
  workwear: {
    slug: "workwear",
    label: "Workwear",
    tagline: "Robusto, funcional e masculino",
    description:
      "Inspirado no vestuário de trabalho americano: jaquetas utilitárias, tecidos resistentes, tons terrosos e botas. Estética durável, com textura e história.",
    keyPieces: ["Jaqueta utilitária/overshirt", "Calça de sarja robusta", "Bota de trabalho", "Camiseta pesada"],
    imageCount: 10,
  },
  smartcasual: {
    slug: "smartcasual",
    label: "Smart Casual",
    tagline: "Arrumado sem gravata",
    description:
      "O meio-termo perfeito entre o formal e o casual. Alfaiataria leve, camisas e tricôs combinados com peças descontraídas — ideal para trabalho e jantares.",
    keyPieces: ["Camisa oxford", "Calça de alfaiataria casual", "Tricô fino", "Chelsea boot ou tênis limpo"],
    imageCount: 10,
  },
  oldmoney: {
    slug: "oldmoney",
    label: "Old Money",
    tagline: "Elegância discreta e atemporal",
    description:
      "Luxo silencioso: cortes clássicos, tecidos nobres, paleta sóbria e nenhum logo à vista. Navy, caramelo e off-white em peças que atravessam décadas.",
    keyPieces: ["Blazer clássico", "Polo de malha", "Calça de alfaiataria", "Mocassim de couro"],
    imageCount: 12,
  },
  preppy: {
    slug: "preppy",
    label: "Preppy",
    tagline: "Clássico universitário revisitado",
    description:
      "Herança dos campus americanos: polos, suéteres no ombro, listras e cores mais claras. Arrumado, jovem e cheio de charme clássico.",
    keyPieces: ["Polo piquet", "Suéter de tricô", "Chino claro", "Tênis ou mocassim clean"],
    imageCount: 10,
  },
  minimalista: {
    slug: "minimalista",
    label: "Minimalista",
    tagline: "Menos peças, mais intenção",
    description:
      "Paleta neutra, linhas limpas e silhueta impecável. Cada peça é escolhida com critério — o luxo está no corte e no tecido, não nos detalhes.",
    keyPieces: ["Camiseta premium neutra", "Calça reta de alfaiataria", "Tênis minimalista", "Sobretudo limpo"],
    imageCount: 15,
  },
  gorpcore: {
    slug: "gorpcore",
    label: "Gorpcore",
    tagline: "Técnico, outdoor e urbano",
    description:
      "Peças técnicas de trilha usadas na cidade: parkas impermeáveis, fleeces, tênis de trail e utilidade em cada detalhe. Conforto extremo com estética funcional.",
    keyPieces: ["Parka/shell técnica", "Fleece", "Calça técnica ou cargo", "Tênis de trail"],
    imageCount: 15,
  },
  vintage: {
    slug: "vintage",
    label: "Vintage",
    tagline: "Peças com história",
    description:
      "Referências das décadas passadas: lavagens desbotadas, jaquetas retrô, camisetas gráficas antigas e sneakers clássicos. Um estilo com alma e personalidade.",
    keyPieces: ["Trucker jacket", "Camiseta gráfica retrô", "Jeans reto de lavagem clara", "Retro sneakers"],
    imageCount: 16,
  },
};

/** Caminhos das fotos de um estilo em public/estilos/<slug>/NN.jpg */
export function styleImages(slug: string): string[] {
  const profile = STYLE_PROFILES[slug];
  if (!profile) return [];
  return Array.from(
    { length: profile.imageCount },
    (_, i) => `/estilos/${slug}/${String(i + 1).padStart(2, "0")}.jpg`
  );
}

export const CLIMATES: Record<string, string> = {
  calor: "Calor",
  frio: "Frio",
  "meia-estacao": "Meia-estação",
};

export const LEVELS: Record<string, string> = {
  facil: "Fácil",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const BASE_COLORS: Record<string, string> = {
  preto: "Preto",
  branco: "Branco",
  bege: "Bege",
  cinza: "Cinza",
  azul: "Azul",
  marrom: "Marrom",
  verde: "Verde",
  vinho: "Vinho",
};

export const COLOR_SWATCHES: Record<string, string> = {
  preto: "#111318",
  branco: "#f0f0ec",
  bege: "#cbb99a",
  cinza: "#8b8f98",
  azul: "#2f5ea8",
  marrom: "#6b4a34",
  verde: "#3f5c47",
  vinho: "#5d2431",
};

export const WARDROBE_CATEGORIES: Record<string, string> = {
  camisetas: "Camisetas",
  camisas: "Camisas",
  calcas: "Calças",
  jaquetas: "Jaquetas",
  calcados: "Calçados",
  acessorios: "Acessórios",
};

export const PRIORITIES: Record<string, string> = {
  essencial: "Essencial",
  intermediaria: "Intermediária",
  avancada: "Avançada",
};

export const STYLE_GOALS: Record<string, string> = {
  "dia-a-dia": "Me vestir melhor no dia a dia",
  elegancia: "Parecer mais elegante",
  "sair-date": "Melhorar minha imagem para sair/date",
  presenca: "Ter mais presença",
  "guarda-roupa": "Montar um guarda-roupa inteligente",
};

export const MAIN_DIFFICULTIES: Record<string, string> = {
  combinar: "Combinar peças",
  comprar: "Comprar roupas certas",
  cores: "Usar cores",
  ocasioes: "Me vestir para ocasiões",
  comecar: "Não saber por onde começar",
};

/* ---------- Quiz de estilo (onboarding) ---------- */

export type QuizOption = {
  value: string;
  label: string;
  /** Pontos que a resposta soma para cada estilo. */
  points: Record<string, number>;
};

export type QuizQuestion = {
  field: string;
  title: string;
  subtitle: string;
  options: QuizOption[];
};

export const STYLE_QUIZ: QuizQuestion[] = [
  {
    field: "style_goal",
    title: "Qual seu objetivo principal?",
    subtitle: "Isso define o foco das recomendações que você vai receber.",
    options: [
      { value: "dia-a-dia", label: "Me vestir melhor no dia a dia", points: { casual: 1 } },
      { value: "elegancia", label: "Parecer mais elegante", points: { oldmoney: 1, smartcasual: 1 } },
      { value: "sair-date", label: "Melhorar minha imagem para sair/date", points: { smartcasual: 1 } },
      { value: "presenca", label: "Ter mais presença", points: { streetwear: 1 } },
      { value: "guarda-roupa", label: "Montar um guarda-roupa inteligente", points: { minimalista: 1 } },
    ],
  },
  {
    field: "main_difficulty",
    title: "Qual sua maior dificuldade hoje?",
    subtitle: "Vamos priorizar o conteúdo que resolve isso primeiro.",
    options: [
      { value: "combinar", label: "Combinar peças", points: {} },
      { value: "comprar", label: "Comprar roupas certas", points: {} },
      { value: "cores", label: "Usar cores", points: {} },
      { value: "ocasioes", label: "Me vestir para ocasiões", points: {} },
      { value: "comecar", label: "Não saber por onde começar", points: {} },
    ],
  },
  {
    field: "perception",
    title: "Como você quer ser percebido?",
    subtitle: "Escolha a imagem que mais combina com quem você quer ser.",
    options: [
      { value: "autentico", label: "Descolado e autêntico", points: { streetwear: 2, vintage: 1 } },
      { value: "classico", label: "Clássico e sofisticado", points: { oldmoney: 2, preppy: 1 } },
      { value: "moderno", label: "Limpo e moderno", points: { minimalista: 2, smartcasual: 1 } },
      { value: "resolvido", label: "Prático e resolvido", points: { casual: 2, smartcasual: 1 } },
      { value: "funcional", label: "Aventureiro e funcional", points: { gorpcore: 2, workwear: 1 } },
    ],
  },
  {
    field: "weekend_look",
    title: "Qual look você escolheria para um sábado à tarde?",
    subtitle: "Sem pensar muito — o que você vestiria com prazer?",
    options: [
      { value: "street", label: "Camiseta oversized, calça larga e tênis chunky", points: { streetwear: 2 } },
      { value: "polo", label: "Polo ou tricô leve com calça de alfaiataria", points: { preppy: 2, oldmoney: 1 } },
      { value: "basico", label: "Camiseta lisa, jeans reto e tênis branco", points: { casual: 2, minimalista: 1 } },
      { value: "utilitario", label: "Jaqueta utilitária, bota e jeans robusto", points: { workwear: 2, vintage: 1 } },
      { value: "tecnico", label: "Peças técnicas e confortáveis, prontas para qualquer rolê", points: { gorpcore: 2 } },
      { value: "retro", label: "Jaqueta retrô ou peça garimpada com história", points: { vintage: 2 } },
    ],
  },
  {
    field: "palette",
    title: "Qual paleta de cores te atrai mais?",
    subtitle: "Pensando no seu guarda-roupa ideal.",
    options: [
      { value: "pb", label: "Preto, branco e cinza", points: { minimalista: 2, streetwear: 1 } },
      { value: "terrosos", label: "Tons terrosos: bege, marrom e verde oliva", points: { workwear: 2, gorpcore: 1 } },
      { value: "classicos", label: "Navy, off-white e caramelo", points: { oldmoney: 2, preppy: 1, smartcasual: 1 } },
      { value: "lavados", label: "Lavagens desbotadas e cores com memória", points: { vintage: 2, casual: 1 } },
    ],
  },
];

/** Ordem de desempate do quiz (primeiro vence). */
export const QUIZ_TIEBREAK = [
  "casual",
  "streetwear",
  "smartcasual",
  "minimalista",
  "oldmoney",
  "workwear",
  "preppy",
  "gorpcore",
  "vintage",
];

/* ---------- Mais procurados (glossário de peças) ---------- */

export type MostWantedItem = {
  slug: string;
  name: string;
  knownAs: string;
  description: string;
};

export const MOST_WANTED: MostWantedItem[] = [
  { slug: "boxy-tee", name: "Boxy tee", knownAs: "Camiseta larga e quadrada", description: "Corte amplo e reto, mais curto no comprimento — a silhueta quadrada típica do streetwear." },
  { slug: "oversized-tee", name: "Oversized tee", knownAs: "Camiseta larga", description: "Camiseta em tamanho proposital acima do seu: ombros caídos e caimento solto, sem parecer emprestada." },
  { slug: "baggy-jeans", name: "Baggy jeans", knownAs: "Calça jeans larga", description: "Jeans de pernas amplas do quadril ao tornozelo, herança dos anos 90 e do skate." },
  { slug: "cargo-pants", name: "Cargo pants", knownAs: "Calça com bolsos laterais", description: "Calça utilitária com bolsos grandes nas laterais — funcional e cheia de atitude." },
  { slug: "parachute-pants", name: "Parachute pants", knownAs: "Calça larga estilo paraquedas", description: "Calça volumosa de tecido leve (geralmente nylon) com ajustes de cordão — silhueta ampla e fluida." },
  { slug: "jorts", name: "Jorts", knownAs: "Bermuda jeans larga", description: "Jeans + shorts: a bermuda jeans de corte largo e comprimento abaixo do joelho." },
  { slug: "jersey", name: "Football jersey", knownAs: "Camiseta de time", description: "Camisa de futebol usada como peça de estilo — vintage ou atual, dentro ou fora do estádio." },
  { slug: "bomber-jacket", name: "Bomber jacket", knownAs: "Jaqueta curta arredondada", description: "Jaqueta de aviador: curta, com punhos e barra em ribana, silhueta arredondada." },
  { slug: "trucker-jacket", name: "Trucker jacket", knownAs: "Jaqueta jeans clássica", description: "A jaqueta jeans tradicional de corte reto, botões frontais e bolsos no peito." },
  { slug: "chunky-sneakers", name: "Chunky sneakers", knownAs: "Tênis grandão", description: "Tênis de sola volumosa e formas exageradas — presença máxima nos pés." },
  { slug: "retro-sneakers", name: "Retro sneakers", knownAs: "Tênis com estética retrô", description: "Modelos clássicos das décadas de 70–90 (ou releituras): perfil baixo e visual atemporal." },
  { slug: "trucker-cap", name: "Trucker cap", knownAs: "Boné de tela atrás", description: "Boné com frente de espuma e traseira de tela — o clássico americano de estrada." },
  { slug: "five-panel-cap", name: "Five panel cap", knownAs: "Boné baixinho de 5 partes", description: "Boné de perfil baixo construído em 5 painéis — minimalista e urbano." },
];

export type ActionDay = {
  day: number;
  title: string;
  mission: string;
  explanation: string;
  checklist: string[];
};

export const ACTION_PLAN_DAYS: ActionDay[] = [
  {
    day: 1,
    title: "Diagnóstico do guarda-roupa",
    mission: "Abra seu guarda-roupa e separe o que você realmente usa.",
    explanation:
      "Antes de montar looks, você precisa saber com o que está trabalhando. Separe peças por categoria e identifique o que está sobrando e o que está faltando.",
    checklist: [
      "Separe camisetas, camisas, calças, jaquetas e calçados",
      "Descarte (ou doe) peças desgastadas ou que não servem",
      "Anote as peças essenciais que estão faltando",
    ],
  },
  {
    day: 2,
    title: "Monte 3 looks básicos",
    mission: "Monte 3 combinações simples usando só o que você já tem.",
    explanation:
      "Looks básicos bem executados são a fundação do estilo. Foque em caimento e combinações neutras — nada de peças chamativas ainda.",
    checklist: [
      "Look 1: camiseta lisa + calça reta + tênis limpo",
      "Look 2: camisa + calça escura + calçado neutro",
      "Look 3: sua melhor combinação atual, refinada",
    ],
  },
  {
    day: 3,
    title: "Teste uma combinação neutra",
    mission: "Use um look 100% em tons neutros hoje.",
    explanation:
      "Preto, branco, cinza e bege combinam entre si sem esforço. Dominar os neutros te dá segurança antes de avançar para cores.",
    checklist: [
      "Escolha 2 a 3 tons neutros",
      "Confira o caimento de cada peça",
      "Observe como você se sente usando o look",
    ],
  },
  {
    day: 4,
    title: "Use uma terceira peça",
    mission: "Adicione uma terceira peça a um look básico.",
    explanation:
      "Jaqueta, overshirt, cardigan ou blazer casual: a terceira peça transforma um look comum em um look intencional.",
    checklist: [
      "Escolha uma base simples (camiseta + calça)",
      "Adicione jaqueta, overshirt ou camisa aberta",
      "Ajuste o restante para não competir com a terceira peça",
    ],
  },
  {
    day: 5,
    title: "Ajuste calçado e acessórios",
    mission: "Eleve um look só trocando calçado e acessórios.",
    explanation:
      "Calçado limpo e acessórios discretos (relógio, cinto, corrente fina) são o acabamento que separa o básico do premium.",
    checklist: [
      "Limpe seus tênis ou botas",
      "Combine o cinto com o calçado",
      "Adicione no máximo 2 acessórios discretos",
    ],
  },
  {
    day: 6,
    title: "Monte um look para sair",
    mission: "Monte um look completo para uma ocasião noturna.",
    explanation:
      "Aplique tudo: base escura, caimento certo, terceira peça e acessórios. Esse é o look que transmite presença.",
    checklist: [
      "Base escura (preto, navy ou grafite)",
      "Terceira peça intencional",
      "Calçado premium e acessório discreto",
    ],
  },
  {
    day: 7,
    title: "Fotografe e salve referências",
    mission: "Fotografe seus melhores looks e monte seu banco de referências.",
    explanation:
      "Registrar o que funcionou cria seu repertório pessoal. Salve fotos e referências para repetir e evoluir as combinações.",
    checklist: [
      "Fotografe os 3 melhores looks da semana",
      "Salve referências de looks que quer testar",
      "Favorite as combinações da plataforma que mais combinam com você",
    ],
  },
];
