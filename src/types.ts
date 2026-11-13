export interface Building {
  code: string;
  name: string;
  submateri: string;
  materi: string;
  icon: string;
  color: string;
  x: number;
  z: number;
  summary: string;
}

export interface Question {
  id: string;
  origNum: number;
  buildingCode: string;
  materi: string;
  submateri: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceType?: 'ASLI' | 'TAMBAHAN AI';
}

export interface ShuffledQuestion extends Question {
  shuffledOptions: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  shuffledAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface Player {
  id: string; // 'P1' | 'P2' | 'P3' | 'P4'
  name: string;
  avatarId: string;
  score: number;
  coins: number;
  x: number;
  z: number;
  y: number;
  vy: number;
  rot: number;
  jumpBoost: number;
}

export interface AvatarPreset {
  id: string;
  name: string;
  head: string;
  torso: string;
  legs: string;
  hat: 'crown' | 'ears' | 'cap' | 'helmet' | 'wizard' | 'none';
  hatColor: string;
}

export interface CanteenItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  color: string;
  desc: string;
}

export interface RecapRecord {
  timestamp: string;
  className: string;
  studentName: string;
  playerId: string;
  buildingCode: string;
  materi: string;
  submateri: string;
  origNum: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  totalScore: number;
}

export interface AppSettings {
  subjectName: string;
  className: string;
  arenaName: string;
  quizDuration: number;
  questionsPerSession: number;
  pointsCorrect: number;
  coinsCorrect: number;
  webhookUrl: string;
}

export type QuizMode = 'individu' | 'kelompok' | 'split4';

export interface QuizSessionState {
  building: Building;
  mode: QuizMode;
  questions: ShuffledQuestion[];
  currentIndex: number;
  timeLeft: number;
  answered: boolean;
  playerAnswers: (('A' | 'B' | 'C' | 'D') | null)[];
  sessionScores: number[];
  sessionCorrect: number[];
  teamName: string;
}
