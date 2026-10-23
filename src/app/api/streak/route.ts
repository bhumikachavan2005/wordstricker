import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSharedStreak } from "@/lib/streak";
import { getTodayDateString, getLastNDates } from "@/lib/dates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);
  const last30 = getLastNDates(30, timezone);

  try {
    const [streak, history, tokens] = await Promise.all([
      getSharedStreak(),
      prisma.streakHistory.findMany({
        where: { date: { in: last30 } },
        orderBy: { date: "asc" },
      }),
      prisma.streakFreezeToken.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const availableTokens = tokens.filter((t) => !t.usedAt).length;

    return NextResponse.json({
      success: true,
      data: {
        today,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalSuccessfulDays: streak.totalSuccessfulDays,
        lastSuccessDate: streak.lastSuccessDate,
        availableFreezeTokens: availableTokens,
        history: last30.map((date) => {
          const item = history.find((h) => h.date === date);
          return {
            date,
            vinuuCompleted: item?.vinuuCompleted ?? false,
            bhuuCompleted: item?.bhuuCompleted ?? false,
            bothCompleted: item?.bothCompleted ?? false,
            frozenUsed: item?.frozenUsed ?? false,
            streakCount: item?.streakCount ?? 0,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Streak GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load streak data" }, { status: 500 });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  try {
    // Check available token
    const token = await prisma.streakFreezeToken.findFirst({
      where: { userId: session.user.id, usedAt: null },
    });

    if (!token) {
      return NextResponse.json({ success: false, error: "No streak freeze tokens available" }, { status: 400 });
    }

    // Mark token as used for today
    await prisma.streakFreezeToken.update({
      where: { id: token.id },
      data: {
        usedAt: new Date(),
        usedForDate: today,
      },
    });

    // Mark streak history as frozen
    await prisma.streakHistory.upsert({
      where: { date: today },
      update: { frozenUsed: true },
      create: {
        date: today,
        frozenUsed: true,
        streakCount: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Streak Freeze Token activated successfully for today! Your streak is protected.",
    });
  } catch (error) {
    console.error("Streak Freeze error:", error);
    return NextResponse.json({ success: false, error: "Failed to use streak freeze" }, { status: 500 });
  }
}
