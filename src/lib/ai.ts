/**
 * AI Story Generator — configurable for Google Gemini or OpenAI
 * Core functionality works without this service.
 */

export type AIProvider = "gemini" | "openai" | "none";

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider;
  if (provider === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (provider === "openai" && process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

interface StoryResult {
  story: string;
  allWordsUsed: boolean;
  provider: AIProvider;
}

/**
 * Generate a short, funny story using all 10 daily words.
 * Returns null if AI is not configured.
 */
export async function generateContextStory(
  words: string[]
): Promise<StoryResult | null> {
  const provider = getProvider();

  if (provider === "none") return null;

  const prompt = buildStoryPrompt(words);

  try {
    let story: string;

    if (provider === "gemini") {
      story = await callGemini(prompt);
    } else {
      story = await callOpenAI(prompt);
    }

    // Verify all words appear in the story
    const storyLower = story.toLowerCase();
    const allWordsUsed = words.every((w) => storyLower.includes(w.toLowerCase()));

    return { story, allWordsUsed, provider };
  } catch (error) {
    console.error(`AI story generation failed (${provider}):`, error);
    return null;
  }
}

function buildStoryPrompt(words: string[]): string {
  const wordList = words.map((w, i) => `${i + 1}. ${w}`).join("\n");
  return `Write a short, funny, and imaginative story (150-250 words) that naturally uses ALL of the following vocabulary words. 
Each word must appear in a contextually and grammatically correct way.
Format: Just the story, no title, no explanation.

Words to use:
${wordList}`;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.9 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.9,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function isAIConfigured(): boolean {
  return getProvider() !== "none";
}
