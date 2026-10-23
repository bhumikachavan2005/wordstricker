import { prisma } from "./prisma";
import { getSharedStreak, awardStreakFreezeToken } from "./streak";

export interface AwardedAchievement {
  key: string;
  name: string;
  xpReward: number;
  icon: string;
}

/**
 * Checks all achievement conditions for a user and awards any that are met and not yet awarded.
 * Also awards a StreakFreezeToken on 7-day, 14-day, 30-day milestones!
 */
export async function checkAndAwardAchievements(
  userId: string,
  _trigger?: string
): Promise<AwardedAchievement[]> {
  void _trigger;
  const [
    user,
    allAchievements,
    existingUserAchievements,
    streak,
    submittedWordsCount,
    quizzesCompletedCount,
    vaultStarsCount,
    lockInsCount,
    bothLockInsCount,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId } }),
    getSharedStreak(),
    prisma.vocabularyWord.count({ where: { submittedById: userId } }),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.savedWord.count({ where: { userId, isFavorited: true } }),
    prisma.userDailyProgress.count({ where: { userId, isLockedIn: true } }),
    prisma.streakHistory.count({ where: { bothCompleted: true } }),
  ]);

  if (!user) return [];

  const existingKeys = new Set(
    existingUserAchievements.map((ua) => {
      const found = allAchievements.find((a) => a.id === ua.achievementId);
      return found?.key;
    })
  );

  const newlyAwarded: AwardedAchievement[] = [];

  const award = async (achKey: string) => {
    if (existingKeys.has(achKey)) return;
    const ach = allAchievements.find((a) => a.key === achKey);
    if (!ach) return;

    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: ach.id,
        xpAwarded: ach.xpReward,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: "achievement",
        title: "Achievement Unlocked! 🏆",
        message: `You earned '${ach.name}': ${ach.description} (+${ach.xpReward} XP)`,
      },
    });

    existingKeys.add(achKey);
    newlyAwarded.push({
      key: ach.key,
      name: ach.name,
      xpReward: ach.xpReward,
      icon: ach.icon,
    });
  };

  // 1. Vocabulary achievements
  if (submittedWordsCount >= 1) await award("first_word");
  if (submittedWordsCount >= 10) await award("words_10");
  if (submittedWordsCount >= 50) await award("words_50");
  if (submittedWordsCount >= 100) await award("words_100");
  if (submittedWordsCount >= 365) await award("words_365");

  // 2. Streak achievements
  if (streak.currentStreak >= 3) await award("streak_3");
  if (streak.currentStreak >= 7) {
    await award("streak_7");
    // Award streak freeze token at 7 days
    await awardStreakFreezeToken(userId, "7-day streak milestone").catch(() => {});
  }
  if (streak.currentStreak >= 30) {
    await award("streak_30");
    await awardStreakFreezeToken(userId, "30-day streak milestone").catch(() => {});
  }
  if (streak.currentStreak >= 100) await award("streak_100");

  // 3. Quiz achievements
  if (quizzesCompletedCount >= 10) await award("quiz_10");
  // Check for perfect score attempt
  const recentPerfect = await prisma.quizAttempt.findFirst({
    where: { userId, score: { gt: 0 } },
    orderBy: { completedAt: "desc" },
  });
  if (recentPerfect && recentPerfect.score === recentPerfect.total) {
    await award("quiz_perfect");
  }

  // 4. Vault achievements
  if (vaultStarsCount >= 10) await award("vault_star_10");

  // 5. Lock-In achievements
  if (lockInsCount >= 1) await award("first_lockin");
  if (bothLockInsCount >= 1) await award("both_lockin_day1");

  return newlyAwarded;
}
