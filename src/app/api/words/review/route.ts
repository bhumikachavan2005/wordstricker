import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dates";
import { z } from "zod";

const ReviewSchema = z.object({
  vocabularyWordId: z.string(),
  understood: z.boolean().default(true),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  date: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { vocabularyWordId, understood, difficulty } = parsed.data;
    const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
    const date = parsed.data.date || getTodayDateString(timezone);

    // Save WordReview record
    await prisma.wordReview.create({
      data: {
        userId: session.user.id,
        vocabularyWordId,
        understood,
        difficulty,
      },
    });

    // Find the daily set for this date
    const dailySet = await prisma.dailyWordSet.findUnique({
      where: { date },
      include: { items: true },
    });

    if (!dailySet) {
      return NextResponse.json({ success: false, error: "Daily word set not found" }, { status: 404 });
    }

    // Count how many unique words in today's set the user has reviewed
    const wordIdsInSet = dailySet.items.map((i) => i.vocabularyWordId);
    const reviewsInSet = await prisma.wordReview.groupBy({
      by: ["vocabularyWordId"],
      where: {
        userId: session.user.id,
        vocabularyWordId: { in: wordIdsInSet },
      },
    });

    const wordsReviewedCount = Math.min(10, reviewsInSet.length);

    // Update or create UserDailyProgress
    const existingProgress = await prisma.userDailyProgress.findUnique({
      where: { userId_date: { userId: session.user.id, date } },
    });

    const isLockedIn = existingProgress?.isLockedIn ?? false;
    let newStatus = existingProgress?.status ?? "not_started";
    if (!isLockedIn) {
      newStatus = wordsReviewedCount >= 10 ? "completed" : "learning";
    }

    const updatedProgress = await prisma.userDailyProgress.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      update: {
        wordsReviewed: wordsReviewedCount,
        status: newStatus,
        lastActivityAt: new Date(),
      },
      create: {
        userId: session.user.id,
        dailyWordSetId: dailySet.id,
        date,
        wordsReviewed: wordsReviewedCount,
        status: newStatus,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        wordsReviewed: updatedProgress.wordsReviewed,
        status: updatedProgress.status,
        allWordsReviewed: updatedProgress.wordsReviewed >= 10,
      },
    });
  } catch (error) {
    console.error("Word review error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record word review" },
      { status: 500 }
    );
  }
}
