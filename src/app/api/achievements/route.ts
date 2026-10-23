import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({
        orderBy: [{ category: "asc" }, { xpReward: "asc" }],
      }),
      prisma.userAchievement.findMany({
        include: { user: { select: { username: true, displayName: true } } },
      }),
    ]);

    const unlockedMap: Record<string, { vinuu: boolean; bhuu: boolean; vinuuDate?: string; bhuuDate?: string }> = {};

    userAchievements.forEach((ua) => {
      unlockedMap[ua.achievementId] = unlockedMap[ua.achievementId] || { vinuu: false, bhuu: false };
      if (ua.user.username === "vinuu") {
        unlockedMap[ua.achievementId].vinuu = true;
        unlockedMap[ua.achievementId].vinuuDate = ua.awardedAt.toISOString();
      } else if (ua.user.username === "bhuu") {
        unlockedMap[ua.achievementId].bhuu = true;
        unlockedMap[ua.achievementId].bhuuDate = ua.awardedAt.toISOString();
      }
    });

    const isCurrentVinuu = session.user.username === "vinuu";

    const formatted = allAchievements.map((ach) => {
      const unlockedInfo = unlockedMap[ach.id] || { vinuu: false, bhuu: false };
      const unlockedByCurrentUser = isCurrentVinuu ? unlockedInfo.vinuu : unlockedInfo.bhuu;
      const unlockedByPartner = isCurrentVinuu ? unlockedInfo.bhuu : unlockedInfo.vinuu;

      return {
        id: ach.id,
        key: ach.key,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        xpReward: ach.xpReward,
        threshold: ach.threshold,
        unlockedByCurrentUser,
        unlockedByPartner,
        vinuuUnlocked: unlockedInfo.vinuu,
        bhuuUnlocked: unlockedInfo.bhuu,
        unlockedAt: isCurrentVinuu ? unlockedInfo.vinuuDate : unlockedInfo.bhuuDate,
      };
    });

    const categories = Array.from(new Set(allAchievements.map((a) => a.category)));

    return NextResponse.json({
      success: true,
      data: {
        achievements: formatted,
        categories,
        totalAchievements: allAchievements.length,
        currentUserUnlockedCount: formatted.filter((a) => a.unlockedByCurrentUser).length,
      },
    });
  } catch (error) {
    console.error("Achievements GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load achievements" }, { status: 500 });
  }
}
