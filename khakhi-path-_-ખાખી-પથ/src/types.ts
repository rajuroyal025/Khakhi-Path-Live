export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  durationMinutes: number;
  totalMarks: number;
}

export interface UserAttempt {
  testId: string;
  answers: (number | null)[];
  score: number;
  totalMarks: number;
  timeTaken: number; // in seconds
  isFirstAttempt: boolean;
  completedAt: Date;
}

export interface DuelPlayer {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
  currentQuestionIndex: number;
  answers: { questionId: string, answerIndex: number, timeTaken: number, isCorrect: boolean }[];
  isReady: boolean;
  isBot?: boolean;
  elo?: number;
}

export interface Duel {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  topic: string;
  questions: Question[];
  players: { [uid: string]: DuelPlayer };
  createdAt: any;
  startTime?: any;
  winnerUid?: string;
  hostId?: string;
  currentQuestionIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  description: string;
  content?: string;
  audioUrl?: string;
  pptUrl?: string;
  status: 'locked' | 'active' | 'completed';
  level: string;
  icon: string;
  color: string;
}

export interface MatchmakingQueue {
  uid: string;
  displayName: string;
  photoURL: string;
  elo: number;
  topic: string;
  joinedAt: any;
}

export interface CurrentAffairsArticle {
  id: number;
  category: string;
  headline_gu: string;
  details_gu: string;
  key_takeaway_for_exam: string;
  tags: string[];
}

export interface CurrentAffairsDaily {
  date: string;
  total_news_count: number;
  articles: CurrentAffairsArticle[];
}
