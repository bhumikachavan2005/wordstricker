-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL DEFAULT '#7C3AED',
    "theme" TEXT NOT NULL DEFAULT 'purple',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vocabulary_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT NOT NULL DEFAULT '',
    "partOfSpeech" TEXT NOT NULL DEFAULT 'noun',
    "exampleSentence" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "submittedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vocabulary_words_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_word_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "publishedAt" DATETIME,
    "rejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "daily_word_sets_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "daily_word_sets_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_word_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyWordSetId" TEXT NOT NULL,
    "vocabularyWordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "daily_word_items_dailyWordSetId_fkey" FOREIGN KEY ("dailyWordSetId") REFERENCES "daily_word_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_word_items_vocabularyWordId_fkey" FOREIGN KEY ("vocabularyWordId") REFERENCES "vocabulary_words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_daily_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyWordSetId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "wordsReviewed" INTEGER NOT NULL DEFAULT 0,
    "quizScore" INTEGER,
    "quizTotal" INTEGER,
    "isLockedIn" BOOLEAN NOT NULL DEFAULT false,
    "lockedInAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_daily_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_daily_progress_dailyWordSetId_fkey" FOREIGN KEY ("dailyWordSetId") REFERENCES "daily_word_sets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "word_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vocabularyWordId" TEXT NOT NULL,
    "understood" BOOLEAN NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "word_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "word_reviews_vocabularyWordId_fkey" FOREIGN KEY ("vocabularyWordId") REFERENCES "vocabulary_words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "vocabularyWordId" TEXT,
    "questionType" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL,
    CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vocabularyWordId" TEXT NOT NULL,
    "isFavorited" BOOLEAN NOT NULL DEFAULT true,
    "privateNotes" TEXT NOT NULL DEFAULT '',
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "nextReviewDate" DATETIME,
    "reviewInterval" INTEGER NOT NULL DEFAULT 1,
    "timesReviewed" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "saved_words_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "saved_words_vocabularyWordId_fkey" FOREIGN KEY ("vocabularyWordId") REFERENCES "vocabulary_words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shared_streak" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalSuccessfulDays" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessDate" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "streak_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "dailyWordSetId" TEXT,
    "vinuuCompleted" BOOLEAN NOT NULL DEFAULT false,
    "bhuuCompleted" BOOLEAN NOT NULL DEFAULT false,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "frozenUsed" BOOLEAN NOT NULL DEFAULT false,
    "rescuedUsed" BOOLEAN NOT NULL DEFAULT false,
    "bothCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "streak_history_dailyWordSetId_fkey" FOREIGN KEY ("dailyWordSetId") REFERENCES "daily_word_sets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "streak_freeze_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardReason" TEXT NOT NULL DEFAULT 'milestone',
    "usedAt" DATETIME,
    "usedForDate" TEXT,
    CONSTRAINT "streak_freeze_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "category" TEXT NOT NULL DEFAULT 'general',
    "threshold" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpAwarded" INTEGER NOT NULL,
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyWordSetId" TEXT NOT NULL,
    "storyText" TEXT NOT NULL,
    "allWordsUsed" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL DEFAULT 'gemini'
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_words_normalizedWord_key" ON "vocabulary_words"("normalizedWord");

-- CreateIndex
CREATE INDEX "vocabulary_words_normalizedWord_idx" ON "vocabulary_words"("normalizedWord");

-- CreateIndex
CREATE UNIQUE INDEX "daily_word_sets_date_key" ON "daily_word_sets"("date");

-- CreateIndex
CREATE INDEX "daily_word_sets_date_idx" ON "daily_word_sets"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_word_items_dailyWordSetId_position_key" ON "daily_word_items"("dailyWordSetId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "daily_word_items_dailyWordSetId_vocabularyWordId_key" ON "daily_word_items"("dailyWordSetId", "vocabularyWordId");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_progress_userId_date_key" ON "user_daily_progress"("userId", "date");

-- CreateIndex
CREATE INDEX "word_reviews_userId_vocabularyWordId_idx" ON "word_reviews"("userId", "vocabularyWordId");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_type_date_key" ON "quizzes"("type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_userId_quizId_key" ON "quiz_attempts"("userId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_words_userId_vocabularyWordId_key" ON "saved_words"("userId", "vocabularyWordId");

-- CreateIndex
CREATE UNIQUE INDEX "streak_history_date_key" ON "streak_history"("date");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "ai_stories_dailyWordSetId_key" ON "ai_stories"("dailyWordSetId");
