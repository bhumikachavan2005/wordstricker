import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUniqueWordBatch } from "@/lib/word-generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 1. Fetch all words already submitted in database
    const existingWords = await prisma.vocabularyWord.findMany({
      select: { normalizedWord: true },
    });

    const existingNormalized = existingWords.map((w) => w.normalizedWord);

    // 2. Generate 10 fresh, guaranteed-unique words
    const generatedBatch = await getUniqueWordBatch(existingNormalized, 10);

    return NextResponse.json({
      success: true,
      data: {
        words: generatedBatch,
        totalInDb: existingWords.length,
        source: generatedBatch[0]?.source ?? "curated_bank",
      },
    });
  } catch (error) {
    console.error("Failed to generate sample words batch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate unique sample words" },
      { status: 500 }
    );
  }
}
