import { prisma } from "@/lib/prisma";

export interface QuizQuestionData {
  id: string;
  questionType: "meaning_to_word" | "word_to_meaning" | "fill_blank" | "part_of_speech";
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  position: number;
  wordId: string;
}

export interface GeneratedQuestionDisplay {
  id: string;
  questionType: string;
  questionText: string;
  options: string[];
  position: number;
}

/**
 * Generates quiz questions from a DailyWordSet's items.
 * Questions include:
 * 1. Word to Meaning (Choose the correct meaning)
 * 2. Meaning to Word (Choose the word that matches the meaning)
 * 3. Fill in the blank (Choose the word that fits the example sentence)
 * 4. Part of speech recognition
 */
export async function generateDailyQuiz(date: string) {
  // Check if quiz already exists
  const existingQuiz = await prisma.quiz.findUnique({
    where: { type_date: { type: "daily", date } },
    include: {
      questions: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (existingQuiz && existingQuiz.questions.length > 0) {
    return existingQuiz;
  }

  // Fetch the daily word set for this date
  const wordSet = await prisma.dailyWordSet.findUnique({
    where: { date },
    include: {
      items: {
        include: { vocabularyWord: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!wordSet || wordSet.items.length === 0) {
    return null;
  }

  const words = wordSet.items.map((i) => i.vocabularyWord);

  // Generate 8-10 diverse questions
  const questionsToCreate: Array<{
    vocabularyWordId: string;
    questionType: string;
    questionText: string;
    correctAnswer: string;
    options: string;
    explanation: string;
    position: number;
  }> = [];

  let position = 1;

  // 1. Meaning to Word questions (3 questions)
  for (let i = 0; i < Math.min(3, words.length); i++) {
    const target = words[i];
    const distractors = words
      .filter((w) => w.id !== target.id)
      .map((w) => w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [target.word, ...distractors].sort(() => Math.random() - 0.5);

    questionsToCreate.push({
      vocabularyWordId: target.id,
      questionType: "meaning_to_word",
      questionText: `Which word means: "${target.meaning}"?`,
      correctAnswer: target.word,
      options: JSON.stringify(options),
      explanation: `"${target.word}" means: ${target.meaning}`,
      position: position++,
    });
  }

  // 2. Word to Meaning questions (3 questions)
  for (let i = 3; i < Math.min(6, words.length); i++) {
    const target = words[i];
    const distractors = words
      .filter((w) => w.id !== target.id)
      .map((w) => w.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [target.meaning, ...distractors].sort(() => Math.random() - 0.5);

    questionsToCreate.push({
      vocabularyWordId: target.id,
      questionType: "word_to_meaning",
      questionText: `What is the definition of "${target.word}"?`,
      correctAnswer: target.meaning,
      options: JSON.stringify(options),
      explanation: `"${target.word}" means: ${target.meaning}`,
      position: position++,
    });
  }

  // 3. Fill in the blank (sentence completion) (2 questions)
  for (let i = 6; i < Math.min(8, words.length); i++) {
    const target = words[i];
    if (target.exampleSentence && target.exampleSentence.trim().length > 0) {
      // Replace target word in example sentence with blank
      const regex = new RegExp(`\\b${target.word}\\b`, "i");
      const blankSentence = target.exampleSentence.replace(regex, "_________");

      const distractors = words
        .filter((w) => w.id !== target.id)
        .map((w) => w.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [target.word, ...distractors].sort(() => Math.random() - 0.5);

      questionsToCreate.push({
        vocabularyWordId: target.id,
        questionType: "fill_blank",
        questionText: `Complete the sentence: "${blankSentence}"`,
        correctAnswer: target.word,
        options: JSON.stringify(options),
        explanation: `Full sentence: "${target.exampleSentence}"`,
        position: position++,
      });
    }
  }

  // 4. Part of Speech or general comprehension (up to 2 questions)
  for (let i = 8; i < words.length; i++) {
    const target = words[i];
    const allPos = ["noun", "verb", "adjective", "adverb"];
    const targetPos = target.partOfSpeech.toLowerCase();
    const distractors = allPos.filter((p) => p !== targetPos);
    const options = [targetPos, ...distractors].slice(0, 4).sort(() => Math.random() - 0.5);

    questionsToCreate.push({
      vocabularyWordId: target.id,
      questionType: "part_of_speech",
      questionText: `What part of speech is the word "${target.word}"?`,
      correctAnswer: targetPos,
      options: JSON.stringify(options),
      explanation: `"${target.word}" functions as a ${targetPos}. Example: ${target.exampleSentence || target.meaning}`,
      position: position++,
    });
  }

  // Create quiz in DB
  const quiz = await prisma.quiz.upsert({
    where: { type_date: { type: "daily", date } },
    update: {},
    create: {
      type: "daily",
      date,
      questions: {
        create: questionsToCreate,
      },
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
      },
    },
  });

  return quiz;
}
