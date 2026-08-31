export type FunnelAnswers = {
  name: string;
  mainGoal: string;
  painPoint: string;
  desiredStyle: string;
  bodyType: string;
  frustrationScore?: number;
};

export type QuizOption = {
  id: string;
  label: string;
  description?: string;
  iconName?: string;
  image?: string;
};

export type QuizQuestion = {
  id: string;
  title: string;
  subtitle: string;
  type: "text" | "single_choice" | "visual_choice";
  options?: QuizOption[];
  placeholder?: string;
};

export type ChatMessage = {
  id: string;
  sender: "raphael" | "user";
  text?: string;
  audioDuration?: string;
  audioTranscription?: string;
  audioSrc?: string;
  audioBase64?: string;
  audioSources?: {
    m4a?: string;
    url?: string;
    urlWav?: string;
    urlOgg?: string;
    durationSec?: number;
    durationFormatted?: string;
  };
  image?: string;
  imageCaption?: string;
  timestamp?: string;
  isQuickReplyPrompt?: boolean;
};

export type QuickReply = {
  id: string;
  text: string;
  nextStepId: string;
};

export type FunnelStep = "quiz" | "analyzing" | "chat" | "sales";
