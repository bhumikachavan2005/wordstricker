import { prisma } from "./prisma";
import { getTodayDateString, areConsecutiveDays } from "./dates";

/**
 * Recalculate and persist the shared streak.
 * Called whenever a user locks in or at the start of the day.
 * Uses backend-only logic — never trusts client-supplied streak values.
 */
export async function recalculateSharedStreak(): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalSuccessfulDays: number;
}> {
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  // Get streak history ordered by date descending
  const history = await prisma.streakHistory.findMany({
    orderBy: { date: "desc" },
  });

  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let totalSuccessfulDays = 0;
  let prevDate: string | null = null;
  let inStreak = true;

  const sortedHistory = [...history].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  for (const record of sortedHistory) {
    const wasSuccessful = record.bothCompleted || record.frozenUsed || record.rescuedUsed;

    if (wasSuccessful) {
      totalSuccessfulDays++;
    }

    if (inStreak) {
      if (prevDate === null) {
        // First record (most recent)
        if (wasSuccessful && (record.date === today || areConsecutiveDays(record.date, today))) {
          currentStreak = 1;
          prevDate = record.date;
        } else if (record.date === today && !wasSuccessful) {
          // Today not yet complete
          prevDate = record.date;
        } else {
          inStreak = false;
        }
      } else {
        if (wasSuccessful && areConsecutiveDays(record.date, prevDate!)) {
          currentStreak++;
          prevDate = record.date;
        } else {
          inStreak = false;
        }
      }
    }

    // Track running streak for longest
    // (simplified — full calculation done separately below)
  }

  // Calculate longest streak from all history
  const sortedAsc = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let runningStreak = 0;
  let lastDate: string | null = null;

  for (const record of sortedAsc) {
    const wasSuccessful = record.bothCompleted || record.frozenUsed || record.rescuedUsed;

    if (wasSuccessful) {
      if (lastDate === null || areConsecutiveDays(lastDate, record.date)) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestStreak) longestStreak = runningStreak;
      lastDate = record.date;
    } else {
      runningStreak = 0;
      lastDate = record.date;
    }
  }

  // Upsert the singleton row
  await prisma.sharedStreak.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      currentStreak,
      longestStreak,
      totalSuccessfulDays,
      lastSuccessDate: sortedHistory.find((h) => h.bothCompleted)?.date ?? null,
    },
    update: {
      currentStreak,
      longestStreak,
      totalSuccessfulDays,
      lastSuccessDate: sortedHistory.find((h) => h.bothCompleted)?.date ?? null,
    },
  });

  return { currentStreak, longestStreak, totalSuccessfulDays };
}

/**
 * Try to update the streak history for today after a lock-in.
 * This is idempotent — safe to call multiple times.
 */
export async function tryUpdateTodayStreak(_userId?: string): Promise<void> {
  void _userId;
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  // Fetch both users' progress for today
  const [vinuu, bhuu] = await Promise.all([
    prisma.user.findUnique({ where: { username: "vinuu" } }),
    prisma.user.findUnique({ where: { username: "bhuu" } }),
  ]);

  if (!vinuu || !bhuu) return;

  const [vinuuProgress, bhuuProgress] = await Promise.all([
    prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId: vinuu.id, date: today } },
    }),
    prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId: bhuu.id, date: today } },
    }),
  ]);

  const vinuuDone = vinuuProgress?.isLockedIn ?? false;
  const bhuuDone = bhuuProgress?.isLockedIn ?? false;
  const bothDone = vinuuDone && bhuuDone;

  // Get the published daily word set for today
  const dailySet = await prisma.dailyWordSet.findUnique({
    where: { date: today },
  });

  await prisma.streakHistory.upsert({
    where: { date: today },
    create: {
      date: today,
      dailyWordSetId: dailySet?.id ?? null,
      vinuuCompleted: vinuuDone,
      bhuuCompleted: bhuuDone,
      bothCompleted: bothDone,
    },
    update: {
      vinuuCompleted: vinuuDone,
      bhuuCompleted: bhuuDone,
      bothCompleted: bothDone,
    },
  });

  if (bothDone) {
    await recalculateSharedStreak();
  }
}

/**
 * Get the current streak data (read from DB).
 */
export async function getSharedStreak() {
  const streak = await prisma.sharedStreak.findUnique({
    where: { id: "singleton" },
  });

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalSuccessfulDays: 0,
      lastSuccessDate: null,
    };
  }

  return streak;
}

/**
 * Award a streak freeze token to a user.
 */
export async function awardStreakFreezeToken(
  userId: string,
  reason: string = "milestone"
): Promise<void> {
  await prisma.streakFreezeToken.create({
    data: { userId, awardReason: reason },
  });
}

/**
 * Use a streak freeze token for today (if available).
 * Returns true if a token was consumed, false if none available.
 */
export async function useStreakFreezeToken(userId: string): Promise<boolean> {
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  const token = await prisma.streakFreezeToken.findFirst({
    where: { userId, usedAt: null },
    orderBy: { awardedAt: "asc" },
  });

  if (!token) return false;

  await prisma.streakFreezeToken.update({
    where: { id: token.id },
    data: { usedAt: new Date(), usedForDate: today },
  });

  // Mark today as frozen in streak history
  await prisma.streakHistory.upsert({
    where: { date: today },
    create: { date: today, frozenUsed: true, bothCompleted: false },
    update: { frozenUsed: true },
  });

  await recalculateSharedStreak();
  return true;
}
