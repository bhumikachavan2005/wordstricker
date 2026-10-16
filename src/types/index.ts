// Global TypeScript type extensions for WordStreak

import type { DefaultSession } from "next-auth";

// Extend next-auth session to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }
}

// ─────────────────────────────────────────────
// WORD TYPES
// ─────────────────────────────────────────────

export interface WordFormData {
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  exampleSentence: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface VocabularyWordWithMeta extends WordFormData {
  id: string;
  normalizedWord: string;
  submittedById: string;
  submitterName: string;
  createdAt: string;
}

export interface DuplicateInfo {
  word: string;
  normalizedWord: string;
  originalDate: string;
  originalContributor: string;
  message: string;
}

// ─────────────────────────────────────────────
// DAILY WORD SET TYPES
// ─────────────────────────────────────────────

export type DailySetStatus = "draft" | "pending_review" | "published" | "rejected";

export interface DailyWordSetWithItems {
  id: string;
  date: string;
  status: DailySetStatus;
  submittedById: string;
  submitterName: string;
  reviewedById: string | null;
  publishedAt: string | null;
  items: Array<{
    id: string;
    position: number;
    vocabularyWord: VocabularyWordWithMeta;
  }>;
}

// ─────────────────────────────────────────────
// USER PROGRESS TYPES
// ─────────────────────────────────────────────

export type ProgressStatus = "not_started" | "learning" | "completed" | "locked_in";

export interface UserProgressSummary {
  userId: string;
  username: string;
  displayName: string;
  theme: string;
  date: string;
  wordsReviewed: number;
  quizScore: number | null;
  quizTotal: number | null;
  quizAccuracy: number | null;
  isLockedIn: boolean;
  lockedInAt: string | null;
  status: ProgressStatus;
  lastActivityAt: string | null;
  xp: number;
  level: number;
  streakFreezeTokens: number;
}

// ─────────────────────────────────────────────
// DASHBOARD TYPES
// ─────────────────────────────────────────────

export interface DashboardData {
  currentDate: string;
  currentUser: {
    id: string;
    username: string;
    displayName: string;
    theme: string;
    avatarColor: string;
    xp: number;
    level: number;
    streakFreezeTokens: number;
    unreadNotifications: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalSuccessfulDays: number;
    lastSuccessDate: string | null;
  };
  weekCompletion: Array<{
    date: string;
    completed: boolean;
  }>;
  todaySet: DailyWordSetWithItems | null;
  vinuuProgress: UserProgressSummary;
  bhuuProgress: UserProgressSummary;
  recentHistory: Array<{
    date: string;
    wordCount: number;
    bothCompleted: boolean;
  }>;
  analyticsData: AnalyticsData;
  achievements: UserAchievementDisplay[];
  totalUniqueWords: number;
}

export interface AnalyticsData {
  wordsOverTime: Array<{ date: string; count: number; cumulative: number }>;
  completionByDay: Array<{ date: string; vinuu: boolean; bhuu: boolean }>;
  quizAccuracy: Array<{ date: string; vinuuScore: number; bhuuScore: number }>;
  streakHistory: Array<{ date: string; streak: number }>;
}

export interface UserAchievementDisplay {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  awardedAt: string;
  xpAwarded: number;
}

// ─────────────────────────────────────────────
// QUIZ TYPES
// ─────────────────────────────────────────────

export interface QuizQuestionDisplay {
  id: string;
  questionType: string;
  questionText: string;
  options: string[];
  position: number;
  // correctAnswer is NOT sent to client
}

export interface QuizAnswerPayload {
  quizId: string;
  answers: Record<string, string>; // questionId -> answer
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
