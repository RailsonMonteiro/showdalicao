
export enum LifelineType {
  FIFTY_FIFTY = "50_50",
  AUDIENCE = "plateia",
  UNIVERSITY = "universitarios",
  SKIP = "pular"
}

export type QuestionOptionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type QuestionOptions = Partial<Record<QuestionOptionKey, string>>;

export interface Question {
  id: number;
  topic: string;
  question: string;
  options: QuestionOptions;
  answer: QuestionOptionKey;
  source: {
    type: "licao" | "biblia";
    reference: string;
  };
  optionCount?: number;
  points?: number;
}

export interface Team {
  name: string;
  score: number;
  lifelinesUsed: LifelineType[];
}

export interface GameState {
  mode: 'setup' | 'playing' | 'gameover';
  currentQuestionIndex: number;
  currentTeamIndex: number;
  teams: [Team, Team];
  selectedOption: QuestionOptionKey | null;
  showExplanation: boolean;
  explanationType: 'correct' | 'wrong' | null;
  lifelineResult: any | null;
  hiddenOptions: QuestionOptionKey[];
  shuffledQuestions: Question[];
  isSoloMode: boolean;
}
export interface RankingEntry {
  name: string;
  score: number;
  date: string;
}
