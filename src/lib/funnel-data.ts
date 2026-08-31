import { QuizQuestion } from "@/components/funnel/types";

export const FUNNEL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "name",
    title: "Antes de começar: como posso te chamar?",
    subtitle: "Vou analisar suas respostas pessoalmente para montar seu diagnóstico de estilo.",
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
    subtitle: "Seja 100% sincero. Quase todo homem erra aqui sem perceber.",
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
  attraction: "aumentar seu poder de atração e presença em encontros",
  authority: "impor respeito e autoridade antes de abrir a boca",
  maturity: "abandonar o visual de garoto e assumir postura de homem",
  confidence: "ter segurança inabalável ao se vestir sem perder tempo",
};

export const PAIN_NAMES_MAP: Record<string, string> = {
  full_closet_nothing_to_wear: "ter o armário cheio mas achar que nada combina",
  invisible_nice_guy: "sentir que passa despercebido ou é visto apenas como o 'cara legal'",
  waste_money: "já ter gasto dinheiro com roupa cara e continuar sem presença",
  date_anxiety: "ficar com aquela insegurança antes de sair de casa para um encontro",
};

/**
 * Roteiro ultra-humanizado do chat com Raphael Pereira.
 * Tom: Stylist de elite trocando ideia direta no WhatsApp, citando grandes artistas (Matuê, Teto, WIU, clipes, festivais).
 */
export function getChatScript(name: string, answers: {
  mainGoal: string;
  painPoint: string;
  desiredStyle: string;
  bodyType: string;
}) {
  const cleanName = name?.trim() ? name.trim() : "irmão";
  const styleLabel = STYLE_NAMES_MAP[answers.desiredStyle] || "Casual Sofisticado";
  const styleImg = STYLE_IMAGES_MAP[answers.desiredStyle] || "/estilos/casual/01.jpg";
  const goalLabel = GOAL_NAMES_MAP[answers.mainGoal] || "ser mais atraente e seguro";
  const painLabel = PAIN_NAMES_MAP[answers.painPoint] || "ter roupas que não combinam";

  return [
    // ETAPA 1 DO CHAT: Conexão & Diagnóstico Inicial
    {
      id: "msg_1",
      step: 1,
      sender: "raphael" as const,
      text: `Fala ${cleanName}, beleza? Raphael aqui.`,
      delayMs: 2200,
    },
    {
      id: "msg_2",
      step: 1,
      sender: "raphael" as const,
      text: `Tava olhando suas respostas do diagnóstico... vi que você quer focar em **${goalLabel}** e que hoje o que mais te pega é **${painLabel}**.`,
      delayMs: 3800,
    },
    {
      id: "msg_3_audio",
      step: 1,
      sender: "raphael" as const,
      audioDuration: "0:26",
      audioSrc: "/audios/audio-1.m4a",
      audioTranscription: `Irmão, te mandando esse áudio porque isso é muito mais comum do que você imagina. Desde 2017 eu trabalho vestindo os maiores artistas da cena — Matuê, Teto, WIU, grandes festivais e clipes —, e a primeira coisa que eu sempre falo pra eles no camarim é: as pessoas te julgam e decidem se te respeitam ou se sentem atração por você nos PRIMEIROS 7 SEGUNDOS. E isso não tem nada a ver com grife ou gastar rios de dinheiro. Tem a ver com a mensagem que o seu corte e a sua proporção tão passando.`,
      delayMs: 4500,
      quickReplies: [
        {
          id: "qr_1",
          text: "Total sentido, Rapha. Qual é o segredo então?",
          nextStepId: "step_2",
        },
        {
          id: "qr_2",
          text: "Caramba, é exatamente essa sensação dos 7 segundos!",
          nextStepId: "step_2",
        },
      ],
    },

    // ETAPA 2 DO CHAT: Autoridade, Prova com Artistas & Quebra de Mito
    {
      id: "msg_4",
      step: 2,
      sender: "raphael" as const,
      text: `Dá uma olhada nessa foto de bastidor. Aqui eu tava montando a composição pro palco:`,
      delayMs: 2600,
    },
    {
      id: "msg_5_img",
      step: 2,
      sender: "raphael" as const,
      image: "/images/raphael/artistas/IMG_6101.jpg",
      imageCaption: "Raphael Pereira nos bastidores com artistas da cena — proporção, contraste e impacto visual.",
      delayMs: 3200,
    },
    {
      id: "msg_6",
      step: 2,
      sender: "raphael" as const,
      text: `Eu já fiz trabalhos com grandes marcas como Renner, PlayStation e dirigi figurinos de clipes com milhões de views. E o grande erro que vejo 99% dos homens cometerem é comprar roupa cara no shopping achando que a etiqueta vai fazer o trabalho por eles.`,
      delayMs: 4400,
    },
    {
      id: "msg_7",
      step: 2,
      sender: "raphael" as const,
      text: `Se a camiseta sobra no ombro ou a calça embola no tornozelo, você pode estar com R$ 5.000 no corpo que ainda vai parecer desajeitado. Por outro lado, com as peças certas e o caimento calibrado, uma roupa simples de R$ 80 faz você parecer o cara mais interessante do ambiente.`,
      delayMs: 4600,
    },
    {
      id: "msg_8_audio",
      step: 2,
      sender: "raphael" as const,
      audioDuration: "0:22",
      audioSrc: "/audios/audio-2.m4a",
      audioTranscription: `${cleanName}, você marcou a estética ${styleLabel}. É uma das minhas favoritas. Se você souber usar a regra das 3 peças-chave e o contraste certo de cores neutras, você muda da água pro vinho em menos de uma semana. Olha só essa referência que separei pro seu caso:`,
      delayMs: 4000,
    },
    {
      id: "msg_9_style_img",
      step: 2,
      sender: "raphael" as const,
      image: styleImg,
      imageCaption: `Referência de combinação pronta para o estilo ${styleLabel}.`,
      delayMs: 3000,
      quickReplies: [
        {
          id: "qr_3",
          text: "Muito foda! Como eu monto isso com o que já tenho?",
          nextStepId: "step_3",
        },
        {
          id: "qr_4",
          text: "Preciso exatamente desse passo a passo no meu dia a dia!",
          nextStepId: "step_3",
        },
      ],
    },

    // ETAPA 3 DO CHAT: Apresentação da Solução & Convite
    {
      id: "msg_10_audio",
      step: 3,
      sender: "raphael" as const,
      audioDuration: "0:25",
      audioSrc: "/audios/audio-3.m4a",
      audioTranscription: `Seguinte, meu mano: pra você não ter que quebrar a cabeça nem errar na hora de se vestir, eu juntei toda a minha experiência dentro do MPO. Lá dentro você tem 228 combinações prontas pra qualquer ocasião — date, trabalho, noite, churrasco —, mais o Fit Check com inteligência artificial, onde você manda a foto do seu look no espelho e recebe minha análise na hora. É basicamente ter um stylist no seu bolso 24 horas por dia.`,
      delayMs: 4800,
    },
    {
      id: "msg_11",
      step: 3,
      sender: "raphael" as const,
      text: `Uma consultoria individual comigo custa R$ 2.500. Mas eu criei o MPO justamente pra qualquer cara ter acesso a isso por **R$ 27 por mês** (menos que uma cerveja ou R$ 0,90 por dia).`,
      delayMs: 3800,
    },
    {
      id: "msg_12",
      step: 3,
      sender: "raphael" as const,
      text: `Eu deixei a sua **Prescrição Exclusiva** liberada na próxima página com seu plano de 7 dias, a amostra dos outfits e os bônus. Clica no botão abaixo pra destravar antes que o acesso expire! Tamo junto!`,
      delayMs: 3200,
      isFinalCta: true,
    },
  ];
}
