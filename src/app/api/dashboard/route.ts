import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateString, getLastNDates } from "@/lib/dates";
import { getSharedStreak } from "@/lib/streak";
import { levelFromXp } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);
  const last30 = getLastNDates(30, timezone);
  const last7 = getLastNDates(7, timezone);

  // Load both users
  const [currentUser, vinuu, bhuu] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.user.findUnique({ where: { username: "vinuu" } }),
    prisma.user.findUnique({ where: { username: "bhuu" } }),
  ]);

  if (!currentUser || !vinuu || !bhuu) {
    return NextResponse.json({ success: false, error: "Users not found" }, { status: 404 });
  }

  // Today's published daily word set
  const todaySet = await prisma.dailyWordSet.findUnique({
    where: { date: today },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          vocabularyWord: {
            include: { submittedBy: { select: { displayName: true, username: true } } },
          },
        },
      },
      submittedBy: { select: { displayName: true, username: true } },
    },
  });

  // Streak
  const streak = await getSharedStreak();

  // User daily progress for today
  const [vinuuProgress, bhuuProgress] = await Promise.all([
    prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId: vinuu.id, date: today } },
    }),
    prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId: bhuu.id, date: today } },
    }),
  ]);

  // XP calculations — sum XP from user achievements
  const [vinuuXp, bhuuXp, currentUserXp] = await Promise.all([
    prisma.userAchievement.aggregate({ where: { userId: vinuu.id }, _sum: { xpAwarded: true } }),
    prisma.userAchievement.aggregate({ where: { userId: bhuu.id }, _sum: { xpAwarded: true } }),
    prisma.userAchievement.aggregate({ where: { userId: currentUser.id }, _sum: { xpAwarded: true } }),
  ]);

  // Streak freeze tokens
  const [currentUserFreezeTokens, unreadCount] = await Promise.all([
    prisma.streakFreezeToken.count({ where: { userId: currentUser.id, usedAt: null } }),
    prisma.notification.count({ where: { userId: currentUser.id, read: false } }),
  ]);

  // Total unique words
  const totalUniqueWords = await prisma.vocabularyWord.count();

  // Streak history for last 7 days
  const weekHistory = await prisma.streakHistory.findMany({
    where: { date: { in: last7 } },
  });

  // Recent word history (last 30 days)
  const recentHistory = await prisma.dailyWordSet.findMany({
    where: { date: { in: last30 }, status: "published" },
    include: { _count: { select: { items: true } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  const streakHistoryForChart = await prisma.streakHistory.findMany({
    where: { date: { in: last30 } },
    orderBy: { date: "asc" },
  });

  // Analytics: words over time
  const publishedSets = await prisma.dailyWordSet.findMany({
    where: { status: "published" },
    include: { _count: { select: { items: true } } },
    orderBy: { date: "asc" },
  });

  let cumulativeCount = 0;
  const wordsOverTime = publishedSets.map((set) => {
    cumulativeCount += set._count.items;
    return { date: set.date, count: set._count.items, cumulative: cumulativeCount };
  });

  // Analytics: quiz accuracy (last 30 days)
  const [vinuuQuizAttempts, bhuuQuizAttempts] = await Promise.all([
    prisma.userDailyProgress.findMany({
      where: { userId: vinuu.id, date: { in: last30 }, quizTotal: { gt: 0 } },
      select: { date: true, quizScore: true, quizTotal: true },
    }),
    prisma.userDailyProgress.findMany({
      where: { userId: bhuu.id, date: { in: last30 }, quizTotal: { gt: 0 } },
      select: { date: true, quizScore: true, quizTotal: true },
    }),
  ]);

  const quizAccuracyMap: Record<string, { vinuu: number; bhuu: number }> = {};
  vinuuQuizAttempts.forEach((a) => {
    if (a.quizTotal && a.quizScore !== null) {
      quizAccuracyMap[a.date] = quizAccuracyMap[a.date] || { vinuu: 0, bhuu: 0 };
      quizAccuracyMap[a.date].vinuu = Math.round((a.quizScore / a.quizTotal) * 100);
    }
  });
  bhuuQuizAttempts.forEach((a) => {
    if (a.quizTotal && a.quizScore !== null) {
      quizAccuracyMap[a.date] = quizAccuracyMap[a.date] || { vinuu: 0, bhuu: 0 };
      quizAccuracyMap[a.date].bhuu = Math.round((a.quizScore / a.quizTotal) * 100);
    }
  });

  // Recent achievements for current user
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: currentUser.id },
    include: { achievement: true },
    orderBy: { awardedAt: "desc" },
    take: 5,
  });

  const buildUserProgress = (
    user: typeof vinuu,
    progress: typeof vinuuProgress,
    xp: number
  ) => {
    const { level } = levelFromXp(xp);
    const quizAcc =
      progress?.quizTotal && progress.quizScore !== null
        ? Math.round((progress.quizScore / progress.quizTotal) * 100)
        : null;

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      theme: user.theme,
      date: today,
      wordsReviewed: progress?.wordsReviewed ?? 0,
      quizScore: progress?.quizScore ?? null,
      quizTotal: progress?.quizTotal ?? null,
      quizAccuracy: quizAcc,
      isLockedIn: progress?.isLockedIn ?? false,
      lockedInAt: progress?.lockedInAt?.toISOString() ?? null,
      status: progress?.status ?? "not_started",
      lastActivityAt: progress?.lastActivityAt?.toISOString() ?? null,
      xp,
      level,
      streakFreezeTokens: 0,
    };
  };

  const currentUserXpVal = currentUserXp._sum.xpAwarded ?? 0;
  const vinuuXpVal = vinuuXp._sum.xpAwarded ?? 0;
  const bhuuXpVal = bhuuXp._sum.xpAwarded ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      currentDate: today,
      currentUser: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        theme: currentUser.theme,
        avatarColor: currentUser.avatarColor,
        xp: currentUserXpVal,
        level: levelFromXp(currentUserXpVal).level,
        streakFreezeTokens: currentUserFreezeTokens,
        unreadNotifications: unreadCount,
      },
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalSuccessfulDays: streak.totalSuccessfulDays,
        lastSuccessDate: streak.lastSuccessDate,
      },
      weekCompletion: last7.map((date) => {
        const hist = weekHistory.find((h) => h.date === date);
        return {
          date,
          completed: hist?.bothCompleted || hist?.frozenUsed || hist?.rescuedUsed || false,
        };
      }),
      todaySet: todaySet
        ? {
            id: todaySet.id,
            date: todaySet.date,
            status: todaySet.status,
            submittedById: todaySet.submittedById,
            submitterName: todaySet.submittedBy.displayName,
            reviewedById: todaySet.reviewedById,
            publishedAt: todaySet.publishedAt?.toISOString() ?? null,
            items: todaySet.items.map((item) => ({
              id: item.id,
              position: item.position,
              vocabularyWord: {
                id: item.vocabularyWord.id,
                word: item.vocabularyWord.word,
                normalizedWord: item.vocabularyWord.normalizedWord,
                meaning: item.vocabularyWord.meaning,
                pronunciation: item.vocabularyWord.pronunciation,
                partOfSpeech: item.vocabularyWord.partOfSpeech,
                exampleSentence: item.vocabularyWord.exampleSentence,
                difficulty: item.vocabularyWord.difficulty,
                submittedById: item.vocabularyWord.submittedById,
                submitterName: item.vocabularyWord.submittedBy.displayName,
                createdAt: item.vocabularyWord.createdAt.toISOString(),
              },
            })),
          }
        : null,
      vinuuProgress: buildUserProgress(vinuu, vinuuProgress, vinuuXpVal),
      bhuuProgress: buildUserProgress(bhuu, bhuuProgress, bhuuXpVal),
      recentHistory: recentHistory.map((s) => ({
        date: s.date,
        wordCount: s._count.items,
        bothCompleted: weekHistory.find((h) => h.date === s.date)?.bothCompleted ?? false,
      })),
      analyticsData: {
        wordsOverTime,
        completionByDay: last30.map((date) => {
          const hist = streakHistoryForChart.find((h) => h.date === date);
          return { date, vinuu: hist?.vinuuCompleted ?? false, bhuu: hist?.bhuuCompleted ?? false };
        }),
        quizAccuracy: Object.entries(quizAccuracyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, acc]) => ({ date, vinuuScore: acc.vinuu, bhuuScore: acc.bhuu })),
        streakHistory: streakHistoryForChart.map((h) => ({
          date: h.date,
          streak: h.streakCount,
        })),
      },
      achievements: achievements.map((ua) => ({
        id: ua.id,
        key: ua.achievement.key,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        awardedAt: ua.awardedAt.toISOString(),
        xpAwarded: ua.xpAwarded,
      })),
      totalUniqueWords,
    },
  });
}
