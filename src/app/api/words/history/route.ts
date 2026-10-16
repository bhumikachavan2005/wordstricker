import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const viewMode = searchParams.get("mode") || "words"; // "words" | "days"
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const contributor = searchParams.get("contributor") || ""; // "vinuu" | "bhuu"
  const difficulty = searchParams.get("difficulty") || ""; // "easy" | "medium" | "hard"
  const partOfSpeech = searchParams.get("pos") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  try {
    if (viewMode === "days") {
      // Return published daily sets with their words
      const totalSets = await prisma.dailyWordSet.count({
        where: { status: "published" },
      });

      const sets = await prisma.dailyWordSet.findMany({
        where: { status: "published" },
        include: {
          submittedBy: { select: { displayName: true, username: true } },
          items: {
            orderBy: { position: "asc" },
            include: {
              vocabularyWord: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      });

      const formattedSets = sets.map((s) => ({
        id: s.id,
        date: s.date,
        submitterName: s.submittedBy.displayName,
        submitterUsername: s.submittedBy.username,
        publishedAt: s.publishedAt?.toISOString() ?? null,
        wordCount: s.items.length,
        words: s.items.map((i) => ({
          id: i.vocabularyWord.id,
          word: i.vocabularyWord.word,
          meaning: i.vocabularyWord.meaning,
          partOfSpeech: i.vocabularyWord.partOfSpeech,
          difficulty: i.vocabularyWord.difficulty,
          exampleSentence: i.vocabularyWord.exampleSentence,
        })),
      }));

      return NextResponse.json({
        success: true,
        data: {
          mode: "days",
          total: totalSets,
          page,
          limit,
          totalPages: Math.ceil(totalSets / limit),
          sets: formattedSets,
        },
      });
    }

    // Default: Return individual vocabulary words
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { word: { contains: search } },
        { meaning: { contains: search } },
        { exampleSentence: { contains: search } },
      ];
    }

    if (contributor) {
      whereClause.submittedBy = { username: contributor };
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (partOfSpeech) {
      whereClause.partOfSpeech = partOfSpeech;
    }

    const [totalWords, words, userSavedWords] = await Promise.all([
      prisma.vocabularyWord.count({ where: whereClause }),
      prisma.vocabularyWord.findMany({
        where: whereClause,
        include: {
          submittedBy: { select: { displayName: true, username: true } },
          dailyItems: {
            include: { dailyWordSet: { select: { date: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.savedWord.findMany({
        where: { userId: session.user.id, isFavorited: true },
        select: { vocabularyWordId: true },
      }),
    ]);

    const savedIds = new Set(userSavedWords.map((sw) => sw.vocabularyWordId));

    const formattedWords = words.map((w) => ({
      id: w.id,
      word: w.word,
      normalizedWord: w.normalizedWord,
      meaning: w.meaning,
      pronunciation: w.pronunciation,
      partOfSpeech: w.partOfSpeech,
      exampleSentence: w.exampleSentence,
      difficulty: w.difficulty,
      submittedBy: w.submittedBy.displayName,
      submittedByUsername: w.submittedBy.username,
      firstAppearedDate: w.dailyItems[0]?.dailyWordSet?.date ?? null,
      createdAt: w.createdAt.toISOString(),
      isSaved: savedIds.has(w.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        mode: "words",
        total: totalWords,
        page,
        limit,
        totalPages: Math.ceil(totalWords / limit),
        words: formattedWords,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to load word history" }, { status: 500 });
  }
}
