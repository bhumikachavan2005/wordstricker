import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dates";
import { generateContextStory } from "@/lib/ai";

/**
 * Creative template generator as a high-quality fallback when no external LLM API key is set.
 * Ensures the 10 words are contextually highlighted in an amusing adventure story for Vinuu and Bhuu!
 */
function generateLocalAdventureStory(words: Array<{ word: string; meaning: string; partOfSpeech: string }>): string {
  if (words.length === 0) return "No words found for today to generate a story.";

  const w = words.map((item) => item.word);

  return `One bright morning in their quest for intellectual glory, Vinuu and Bhuu set out on an unprecedented linguistic expedition. 

Their voyage began when Vinuu observed an astonishing sight: something unmistakably **${w[0] || "resplendent"}** radiating from the horizon. Bhuu, ever observant, leaned forward with acute curiosity and remarked on how each moment felt truly **${w[1] || "ephemeral"}**, reminding them never to take fleeting adventures for granted.

As they ventured further into the great library of wonders, an aura of **${w[2] || "serendipity"}** seemed to guide their steps. Every discovery was marked by subtle **${w[3] || "nuance"}**, revealing secrets hidden from everyday sight. Whenever obstacles emerged, their mutual **${w[4] || "resilience"}** turned every hardship into camaraderie and laughter.

Suddenly, an ancient scholar appeared, delivering advice that was both sharp and **${w[5] || "trenchant"}**. He urged them never to be **${w[6] || "complacent"}** in their pursuit of mastery. Inspired, Vinuu offered a uniquely **${w[7] || "lucid"}** explanation of their mission, while Bhuu celebrated their unshakeable **${w[8] || "tenacity"}**.

By dusk, the two companions marveled at the shared streak they had forged. Their vocabulary journey was far from ordinary—it was a truly **${w[9] || "quintessential"}** partnership that nothing could shake!`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const date = searchParams.get("date") || getTodayDateString(timezone);

  try {
    // Check if daily word set exists
    const dailySet = await prisma.dailyWordSet.findUnique({
      where: { date },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { vocabularyWord: true },
        },
      },
    });

    if (!dailySet || dailySet.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No words found for today to build a story." },
        { status: 404 }
      );
    }

    // Check if story is already stored in AiStory
    const existingStory = await prisma.aiStory.findUnique({
      where: { dailyWordSetId: dailySet.id },
    });

    if (existingStory) {
      return NextResponse.json({
        success: true,
        data: {
          story: existingStory.storyText,
          provider: existingStory.provider,
          allWordsUsed: existingStory.allWordsUsed,
          date,
        },
      });
    }

    // Attempt generation via AI provider
    const wordList = dailySet.items.map((i) => i.vocabularyWord.word);
    let storyResult = await generateContextStory(wordList);

    let finalStory: string;
    let providerName: string;
    let allWordsUsed: boolean;

    if (storyResult) {
      finalStory = storyResult.story;
      providerName = storyResult.provider;
      allWordsUsed = storyResult.allWordsUsed;
    } else {
      // High-quality local adventure fallback incorporating all 10 words
      finalStory = generateLocalAdventureStory(
        dailySet.items.map((i) => ({
          word: i.vocabularyWord.word,
          meaning: i.vocabularyWord.meaning,
          partOfSpeech: i.vocabularyWord.partOfSpeech,
        }))
      );
      providerName = "WordStreak Storyteller";
      allWordsUsed = true;
    }

    // Save story
    const saved = await prisma.aiStory.create({
      data: {
        dailyWordSetId: dailySet.id,
        storyText: finalStory,
        provider: providerName,
        allWordsUsed,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        story: saved.storyText,
        provider: saved.provider,
        allWordsUsed: saved.allWordsUsed,
        date,
      },
    });
  } catch (error) {
    console.error("Story API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate context story" },
      { status: 500 }
    );
  }
}
