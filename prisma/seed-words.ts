import { PrismaClient } from "@prisma/client";
import { normalizeWord } from "../src/lib/words";
import { getTodayDateString, getLastNDates } from "../src/lib/dates";

const prisma = new PrismaClient();

const SEED_WORDS = [
  {
    word: "Resplendent",
    meaning: "Attractive and impressive through being richly colorful or sumptuous",
    pronunciation: "ri-SPLEN-dunt",
    partOfSpeech: "adjective",
    exampleSentence: "She looked resplendent in an emerald silk evening gown.",
    difficulty: "hard",
  },
  {
    word: "Ephemeral",
    meaning: "Lasting for a very short time; fleeting and transitory",
    pronunciation: "ih-FEM-er-ul",
    partOfSpeech: "adjective",
    exampleSentence: "Fame in the digital era can often feel ephemeral and unpredictable.",
    difficulty: "medium",
  },
  {
    word: "Serendipity",
    meaning: "The occurrence and development of events by chance in a happy or beneficial way",
    pronunciation: "sair-un-DIP-ih-tee",
    partOfSpeech: "noun",
    exampleSentence: "A lucky spark of serendipity led the scientists to their medical discovery.",
    difficulty: "medium",
  },
  {
    word: "Nuance",
    meaning: "A subtle difference in or shade of meaning, expression, sound, or feeling",
    pronunciation: "NOO-ahns",
    partOfSpeech: "noun",
    exampleSentence: "An expert translator captures every delicate nuance of the original prose.",
    difficulty: "easy",
  },
  {
    word: "Resilience",
    meaning: "The capacity to recover quickly from difficulties, stress, or change",
    pronunciation: "ri-ZIL-yunss",
    partOfSpeech: "noun",
    exampleSentence: "Their remarkable resilience helped them overcome unprecedented challenges.",
    difficulty: "easy",
  },
  {
    word: "Trenchant",
    meaning: "Vigorous or incisive in expression, thought, or style; keen and penetrating",
    pronunciation: "TREN-chunt",
    partOfSpeech: "adjective",
    exampleSentence: "Her trenchant analysis of the debate cut straight to the core issues.",
    difficulty: "hard",
  },
  {
    word: "Complacent",
    meaning: "Showing smug or uncritical satisfaction with oneself or one's achievements",
    pronunciation: "kum-PLAY-sunt",
    partOfSpeech: "adjective",
    exampleSentence: "Champions never become complacent; they keep training with fierce intensity.",
    difficulty: "medium",
  },
  {
    word: "Lucid",
    meaning: "Expressed clearly; easy to understand; bright or luminous",
    pronunciation: "LOO-sid",
    partOfSpeech: "adjective",
    exampleSentence: "He provided a lucid and engaging explanation of quantum physics.",
    difficulty: "easy",
  },
  {
    word: "Tenacity",
    meaning: "The quality of being determined, persistent, and refusing to give up",
    pronunciation: "tuh-NAS-ih-tee",
    partOfSpeech: "noun",
    exampleSentence: "Her tenacity in pursuing justice inspired the entire community.",
    difficulty: "medium",
  },
  {
    word: "Quintessential",
    meaning: "Representing the most perfect or typical example of a quality or class",
    pronunciation: "kwin-tih-SEN-shul",
    partOfSpeech: "adjective",
    exampleSentence: "Afternoon tea with warm scones is the quintessential British tradition.",
    difficulty: "medium",
  },
];

async function seedWords() {
  console.log("Seeding today's vocabulary set for WordStreak...");

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);
  const [yesterday] = getLastNDates(2, timezone); // gets [yesterday, today]

  const vinuu = await prisma.user.findUnique({ where: { username: "vinuu" } });
  const bhuu = await prisma.user.findUnique({ where: { username: "bhuu" } });

  if (!vinuu || !bhuu) {
    throw new Error("Users not found. Run npm run db:seed first.");
  }

  // 1. Seed yesterday's streak history so streak starts at 1
  if (yesterday && yesterday !== today) {
    await prisma.streakHistory.upsert({
      where: { date: yesterday },
      update: {
        bothCompleted: true,
        vinuuCompleted: true,
        bhuuCompleted: true,
        streakCount: 1,
      },
      create: {
        date: yesterday,
        bothCompleted: true,
        vinuuCompleted: true,
        bhuuCompleted: true,
        streakCount: 1,
      },
    });

    await prisma.sharedStreak.upsert({
      where: { id: "singleton" },
      update: {
        currentStreak: 1,
        longestStreak: 1,
        totalSuccessfulDays: 1,
        lastSuccessDate: yesterday,
      },
      create: {
        id: "singleton",
        currentStreak: 1,
        longestStreak: 1,
        totalSuccessfulDays: 1,
        lastSuccessDate: yesterday,
      },
    });
  }

  // 2. Create today's DailyWordSet
  const todaySet = await prisma.dailyWordSet.upsert({
    where: { date: today },
    update: { status: "published" },
    create: {
      date: today,
      status: "published",
      submittedById: vinuu.id,
      publishedAt: new Date(),
    },
  });

  // 3. Create VocabularyWords and DailyWordItems
  for (let i = 0; i < SEED_WORDS.length; i++) {
    const w = SEED_WORDS[i];
    const normalized = normalizeWord(w.word);

    // Alternate submitter between Vinuu and Bhuu to showcase co-op
    const submitter = i % 2 === 0 ? vinuu : bhuu;

    const vocabWord = await prisma.vocabularyWord.upsert({
      where: { normalizedWord: normalized },
      update: {
        meaning: w.meaning,
        pronunciation: w.pronunciation,
        partOfSpeech: w.partOfSpeech,
        exampleSentence: w.exampleSentence,
        difficulty: w.difficulty,
      },
      create: {
        word: w.word,
        normalizedWord: normalized,
        meaning: w.meaning,
        pronunciation: w.pronunciation,
        partOfSpeech: w.partOfSpeech,
        exampleSentence: w.exampleSentence,
        difficulty: w.difficulty,
        submittedById: submitter.id,
      },
    });

    // Link item to today's set
    await prisma.dailyWordItem.upsert({
      where: {
        dailyWordSetId_position: {
          dailyWordSetId: todaySet.id,
          position: i + 1,
        },
      },
      update: { vocabularyWordId: vocabWord.id },
      create: {
        dailyWordSetId: todaySet.id,
        vocabularyWordId: vocabWord.id,
        position: i + 1,
      },
    });
  }

  // 4. Create an initial welcome notification for both users
  await prisma.notification.createMany({
    data: [
      {
        userId: vinuu.id,
        type: "streak",
        title: "Welcome to WordStreak! 🔥",
        message: "Today's 10 words are published! Study the cards and lock in with Bhuu before midnight IST.",
      },
      {
        userId: bhuu.id,
        type: "streak",
        title: "Welcome to WordStreak! 🔥",
        message: "Today's 10 words are published! Study the cards and lock in with Vinuu before midnight IST.",
      },
    ],
  });

  console.log(`Successfully seeded today's 10 words for ${today}!`);
}

seedWords()
  .catch((e) => {
    console.error("Failed to seed words:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
