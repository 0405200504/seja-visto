import { QuizQuestion } from "@/components/funnel/types";

export const FUNNEL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "name",
    title: "Antes de começar: como posso te chamar?",
    subtitle: "Vou analisar suas respostas pessoalmente para traçar seu diagnóstico de estilo.",
    type: "text",
    placeholder: "Digite seu primeiro nome...",
  },
  {
    id: "mainGoal",
    title: "Qual é o seu principal objetivo com o seu visual hoje?",
    subtitle: "Escolha o que mais mexe com a sua ambição neste momento.",
    type: "single_choice",
    options: [
      {
        id: "attraction",
        label: "Ser mais atraente e magnético",
        description: "Quero chamar atenção positiva em dates, festas e na vida social.",
        iconName: "Flame",
      },
      {
        id: "authority",
        label: "Transmitir autoridade e respeito",
        description: "Quero ser levado a sério em reuniões e no trabalho antes de abrir a boca.",
        iconName: "Briefcase",
      },
      {
        id: "maturity",
        label: "Parar de parecer um adolescente",
        description: "Quero me vestir como um homem de presença e postura madura.",
        iconName: "Crown",
      },
      {
        id: "confidence",
        label: "Segurança rápida sem perder tempo",
        description: "Quero abrir o armário, pegar a roupa certa e saber que estou impecável.",
        iconName: "Sparkles",
      },
    ],
  },
  {
    id: "painPoint",
    title: "Qual dessas situações mais te irrita ou te deixa inseguro?",
    subtitle: "Seja 100% sincero. 90% dos homens erram aqui sem perceber.",
    type: "single_choice",
    options: [
      {
        id: "full_closet_nothing_to_wear",
        label: "Armário cheio de roupas, mas nada combina",
        description: "Fico minutos provando peças e acabo saindo com o mesmo básico sem graça.",
        iconName: "Shirt",
      },
      {
        id: "invisible_nice_guy",
        label: "Sensação de ser 'invisível' ou só o 'cara legal'",
        description: "Entro nos lugares e sinto que ninguém repara ou não causo impacto.",
        iconName: "EyeOff",
      },
      {
        id: "waste_money",
        label: "Gasto dinheiro em roupas caras e continuo sem estilo",
        description: "Compro peças de marca no shopping que ficam encostadas ou não vestem bem.",
        iconName: "Coins",
      },
      {
        id: "date_anxiety",
        label: "Insegurança na hora de sair pra um date importante",
        description: "A dúvida constante: 'será que tô estranho, cafona ou arrumado demais?'",
        iconName: "HeartCrack",
      },
    ],
  },
  {
    id: "desiredStyle",
    title: "Qual dessas estéticas você gostaria de dominar no seu dia a dia?",
    subtitle: "Toque na referência que mais reflete o homem que você quer ser.",
    type: "visual_choice",
    options: [
      {
        id: "casual",
        label: "Casual Sofisticado",
        description: "O básico de alto nível: camisetas impecáveis, jeans reto, tênis clean.",
        image: "/estilos/casual/01.jpg",
      },
      {
        id: "oldmoney",
        label: "Old Money / Elegância",
        description: "Linho, polos discretas, alfaiataria leve e presença aristocrática.",
        image: "/estilos/oldmoney/01.jpg",
      },
      {
        id: "smartcasual",
        label: "Smart Casual",
        description: "O equilíbrio perfeito entre o formal e o descontraído para trabalho e jantares.",
        image: "/estilos/smartcasual/01.jpg",
      },
      {
        id: "streetwear",
        label: "Streetwear Premium",
        description: "Urbano, oversized com caimento intencional, presença jovem e estilosa.",
        image: "/estilos/streetwear/01.jpg",
      },
      {
        id: "minimalista",
        label: "Minimalista",
        description: "Cores neutras, cortes limpos, zero logos chamativos e sofisticação pura.",
        image: "/estilos/minimalista/01.jpg",
      },
      {
        id: "workwear",
        label: "Workwear / Robusto",
        description: "Jaquetas de lona, jeans encorpado, botas e visual masculino imponente.",
        image: "/estilos/workwear/01.jpg",
      },
    ],
  },
  {
    id: "bodyType",
    title: "Qual é o seu maior desafio em relação a caimento e corpo?",
    subtitle: "O caimento é responsável por 70% da atração de um outfit.",
    type: "single_choice",
    options: [
      {
        id: "skinny",
        label: "Sou magro e as roupas parecem que sobram em mim",
        description: "Quero parecer mais estruturado, com ombros largos e peitoral definido.",
        iconName: "Maximize2",
      },
      {
        id: "overweight",
        label: "Estou acima do peso ou com barriga evidente",
        description: "Quero disfarçar as gordurinhas e alongar minha silhueta sem marcar.",
        iconName: "Minimize2",
      },
      {
        id: "short_tall",
        label: "Sou baixo ou muito alto e as proporções ficam erradas",
        description: "As calças arrastam ou as camisas ficam curtas no tronco.",
        iconName: "MoveVertical",
      },
      {
        id: "proportions",
        label: "Corpo normal, mas não sei equilibrar volumes e cores",
        description: "Não sei se uso slim, regular ou oversized para valorizar minha postura.",
        iconName: "CheckCircle2",
      },
    ],
  },
];

export const STYLE_NAMES_MAP: Record<string, string> = {
  casual: "Casual Sofisticado",
  oldmoney: "Old Money & Elegância Clássica",
  smartcasual: "Smart Casual Executivo",
  streetwear: "Streetwear Premium",
  minimalista: "Minimalismo Sofisticado",
  workwear: "Workwear & Estilo Robusto",
};

export const STYLE_IMAGES_MAP: Record<string, string> = {
  casual: "/estilos/casual/01.jpg",
  oldmoney: "/estilos/oldmoney/01.jpg",
  smartcasual: "/estilos/smartcasual/01.jpg",
  streetwear: "/estilos/streetwear/01.jpg",
  minimalista: "/estilos/minimalista/01.jpg",
  workwear: "/estilos/workwear/01.jpg",
};

export const GOAL_NAMES_MAP: Record<string, string> = {
  attraction: "aumentar seu magnetismo, atração e poder de conquista",
  authority: "impor respeito imediato e autoridade profissional",
  maturity: "abandonar o visual de garoto e assumir a postura de homem",
  confidence: "ter segurança inabalável ao se vestir sem perder horas",
};

export const PAIN_NAMES_MAP: Record<string, string> = {
  full_closet_nothing_to_wear: "ter o armário cheio mas achar que nada combina",
  invisible_nice_guy: "sentir que passa despercebido ou é visto apenas como o 'cara legal'",
  waste_money: "já ter gasto dinheiro com roupa cara e continuar sem presença",
  date_anxiety: "ficar com aquela insegurança antes de sair de casa para um encontro",
};

/**
 * Mensagens sequenciais do chat fake com Raphael Pereira baseadas nas respostas do usuário.
 */
export function getChatScript(name: string, answers: {
  mainGoal: string;
  painPoint: string;
  desiredStyle: string;
  bodyType: string;
}) {
  const cleanName = name?.trim() ? name.trim() : "meu amigo";
  const styleLabel = STYLE_NAMES_MAP[answers.desiredStyle] || "Casual Sofisticado";
  const styleImg = STYLE_IMAGES_MAP[answers.desiredStyle] || "/estilos/casual/01.jpg";
  const goalLabel = GOAL_NAMES_MAP[answers.mainGoal] || "ser mais atraente e seguro";
  const painLabel = PAIN_NAMES_MAP[answers.painPoint] || "ter roupas que não combinam";

  return [
    {
      id: "msg_1",
      step: 1,
      sender: "raphael" as const,
      text: `Fala ${cleanName}, beleza irmão? Sou o Raphael Pereira.`,
      delayMs: 1200,
    },
    {
      id: "msg_2",
      step: 1,
      sender: "raphael" as const,
      text: `Acabei de receber seu diagnóstico aqui na minha tela. Parei o que estava fazendo no estúdio pra trocar essa ideia direta contigo.`,
      delayMs: 2200,
    },
    {
      id: "msg_3",
      step: 1,
      sender: "raphael" as const,
      text: `Vi que o seu foco principal é **${goalLabel}** e que você se incomoda com **${painLabel}**.`,
      delayMs: 2500,
    },
    {
      id: "msg_4_audio",
      step: 1,
      sender: "raphael" as const,
      audioDuration: "0:24",
      audioTranscription: `Irmão, escuta isso com atenção: em quase 10 anos vestindo os maiores artistas do país e milhares de caras comuns, eu percebi uma regra brutal. As pessoas decidem se te respeitam ou se sentem atração por você nos PRIMEIROS 7 SEGUNDOS. E não tem nada a ver com gastar 3 mil reais em roupa de grife. Tem a ver com proporção e intenção.`,
      delayMs: 3000,
      quickReplies: [
        {
          id: "qr_1",
          text: "Faz total sentido, Rapha. Como eu resolvo isso?",
          nextStepId: "step_2",
        },
        {
          id: "qr_2",
          text: "É exatamente isso que eu sinto quando saio!",
          nextStepId: "step_2",
        },
      ],
    },
    // Step 2
    {
      id: "msg_5",
      step: 2,
      sender: "raphael" as const,
      text: `Olha só essa foto de bastidor de quando montei outfits pra artistas de topo:`,
      delayMs: 1400,
    },
    {
      id: "msg_6_img",
      step: 2,
      sender: "raphael" as const,
      image: "/images/raphael/artistas/artista-01.jpg",
      imageCaption: "Raphael Pereira nos bastidores — ajustando proporções e presença de palco.",
      delayMs: 2200,
    },
    {
      id: "msg_7",
      step: 2,
      sender: "raphael" as const,
      text: `Sabe qual é a maior ilusão? Achar que pra ter presença você precisa de um guarda-roupa gigante ou de marca cara. Roupa cara qualquer um compra no shopping. Mas quando o caimento tá errado, o cara continua parecendo um garoto desajeitado.`,
      delayMs: 3000,
    },
    {
      id: "msg_8",
      step: 2,
      sender: "raphael" as const,
      text: `Você escolheu a estética **${styleLabel}**. É um estilo absurdamente magnético quando montado com a regra de 3 camadas e caimento nos ombros.`,
      delayMs: 2400,
    },
    {
      id: "msg_9_style_img",
      step: 2,
      sender: "raphael" as const,
      image: styleImg,
      imageCaption: `Referência de combinação calibrada para o seu perfil (${styleLabel}).`,
      delayMs: 2200,
      quickReplies: [
        {
          id: "qr_3",
          text: "Animal! Como faço pra ter esses outfits montados pra mim?",
          nextStepId: "step_3",
        },
        {
          id: "qr_4",
          text: "Preciso de um guia prático assim pro meu dia a dia!",
          nextStepId: "step_3",
        },
      ],
    },
    // Step 3
    {
      id: "msg_10_audio",
      step: 3,
      sender: "raphael" as const,
      audioDuration: "0:21",
      audioTranscription: `${cleanName}, pra você não depender de sorte nem perder horas na frente do espelho, eu criei o MPO: são 228 combinações prontas divididas por ocasião, mais o Fit Check com IA que avalia a foto do seu look na hora, direto no seu celular. Eu montei sua prescrição exclusiva com tudo o que você precisa pra destravar seu visual essa semana.`,
      delayMs: 2500,
    },
    {
      id: "msg_11",
      step: 3,
      sender: "raphael" as const,
      text: `Eu condensei anos de consultoria VIP (que custa R$ 2.500) em uma plataforma prática no seu bolso por **menos de R$ 0,90 por dia**.`,
      delayMs: 2600,
    },
    {
      id: "msg_12",
      step: 3,
      sender: "raphael" as const,
      text: `Liberei a sua **Página de Prescrição Exclusiva** com a sua rota de 7 dias e todos os bônus. Clica no botão abaixo pra ver o seu plano completo antes que a sessão expire!`,
      delayMs: 2000,
      isFinalCta: true,
    },
  ];
}
