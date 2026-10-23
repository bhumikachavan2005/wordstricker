import { PrismaClient } from "@prisma/client";
import { normalizeWord } from "../src/lib/words";
import { getLastNDates } from "../src/lib/dates";

const prisma = new PrismaClient();

interface WordEntry {
  no: number;
  word: string;
  meaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  difficulty: "easy" | "medium" | "hard";
}

interface DayBatch {
  dayNumber: number;
  submitterUsername: "vinuu" | "bhuu";
  title: string;
  words: WordEntry[];
}

const MASTER_DAYS: DayBatch[] = [
  // Day 1 — Vinayak's words (#1–10)
  {
    dayNumber: 1,
    submitterUsername: "vinuu",
    title: "Day 1 — Vinayak's Words",
    words: [
      { no: 1, word: "Actually", meaning: "In fact; really", exampleSentence: "Actually, I was busy yesterday.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 2, word: "Probably", meaning: "Most likely", exampleSentence: "I'll probably call you tonight.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 3, word: "Usually", meaning: "Normally; most of the time", exampleSentence: "I usually wake up early.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 4, word: "Instead", meaning: "In place of something", exampleSentence: "Let's talk instead of texting.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 5, word: "Manage", meaning: "To handle something", exampleSentence: "Don't worry; I can manage it.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 6, word: "Notice", meaning: "To become aware of something", exampleSentence: "Did you notice her new profile picture?", partOfSpeech: "verb", difficulty: "easy" },
      { no: 7, word: "Improve", meaning: "To make something better", exampleSentence: "I want to improve my English.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 8, word: "Enough", meaning: "As much as needed", exampleSentence: "We have enough time.", partOfSpeech: "determiner", difficulty: "easy" },
      { no: 9, word: "Anyway", meaning: "Used to return to the main topic", exampleSentence: "Anyway, what are you doing now?", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 10, word: "Though", meaning: "Although; despite that", exampleSentence: "It was difficult, though I enjoyed it.", partOfSpeech: "conjunction", difficulty: "easy" },
    ],
  },
  // Day 2 — Bhuu's words (#11–20)
  {
    dayNumber: 2,
    submitterUsername: "bhuu",
    title: "Day 2 — Bhuu's Words",
    words: [
      { no: 11, word: "Appreciate", meaning: "To be thankful for something", exampleSentence: "I really appreciate your help.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 12, word: "Avoid", meaning: "To stay away from something", exampleSentence: "Try to avoid unnecessary fights.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 13, word: "Manage", meaning: "To handle something", exampleSentence: "I can manage it myself.", partOfSpeech: "verb", difficulty: "easy" }, // Dup #5
      { no: 14, word: "Prefer", meaning: "To like one thing more than another", exampleSentence: "I prefer coffee over tea.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 15, word: "Suggest", meaning: "To offer an idea", exampleSentence: "What do you suggest?", partOfSpeech: "verb", difficulty: "easy" },
      { no: 16, word: "Realize", meaning: "To become aware of something", exampleSentence: "I just realized my mistake.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 17, word: "Eventually", meaning: "In the end", exampleSentence: "Eventually, everything will be fine.", partOfSpeech: "adverb", difficulty: "medium" },
      { no: 18, word: "Respect", meaning: "To show regard for someone", exampleSentence: "I respect your feelings.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 19, word: "Convenient", meaning: "Easy or suitable for a situation", exampleSentence: "Is this time convenient for you?", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 20, word: "Curious", meaning: "Wanting to know something", exampleSentence: "I'm curious to know what happened.", partOfSpeech: "adjective", difficulty: "easy" },
    ],
  },
  // Day 3 — Bhuu's words (#21–30)
  {
    dayNumber: 3,
    submitterUsername: "bhuu",
    title: "Day 3 — Bhuu's Words",
    words: [
      { no: 21, word: "Essential", meaning: "Absolutely necessary", exampleSentence: "Water is essential for living things to survive.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 22, word: "Task", meaning: "A piece of work to complete", exampleSentence: "My first task every morning is to text you.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 23, word: "Reluctant", meaning: "Unwilling or hesitant", exampleSentence: "He was reluctant to leave his warm bed.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 24, word: "Exhausted", meaning: "Extremely tired", exampleSentence: "After the marathon, she felt completely exhausted.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 25, word: "Chance", meaning: "An opportunity", exampleSentence: "This is your chance to learn something new.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 26, word: "Choice", meaning: "An act of choosing between options", exampleSentence: "You have a choice between cake and fruit.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 27, word: "Shy", meaning: "Nervous around other people", exampleSentence: "He is shy when meeting new people.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 28, word: "Avoid", meaning: "To stay away from someone or something", exampleSentence: "Take the highway to avoid city traffic.", partOfSpeech: "verb", difficulty: "easy" }, // Dup #12
      { no: 29, word: "Punctual", meaning: "Arriving at the correct time", exampleSentence: "Our boss appreciates punctual employees.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 30, word: "Basic", meaning: "Simple; fundamental", exampleSentence: "I only have basic knowledge of computer coding.", partOfSpeech: "adjective", difficulty: "easy" },
    ],
  },
  // Day 4 — Vinayak's words (#31–40)
  {
    dayNumber: 4,
    submitterUsername: "vinuu",
    title: "Day 4 — Vinayak's Words",
    words: [
      { no: 31, word: "Concern", meaning: "A worry or important matter", exampleSentence: "Don't worry; it's not a big concern.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 32, word: "Mention", meaning: "To talk about or refer to something", exampleSentence: "You forgot to mention the meeting.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 33, word: "Require", meaning: "To need something", exampleSentence: "This task requires more time.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 34, word: "Consider", meaning: "To think carefully about something", exampleSentence: "I'll consider your suggestion.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 35, word: "Expect", meaning: "To think something will happen", exampleSentence: "I didn't expect you to call me.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 36, word: "Realistic", meaning: "Practical and possible", exampleSentence: "We need to make a realistic plan.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 37, word: "Confident", meaning: "Believing in yourself", exampleSentence: "I feel more confident when I speak English.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 38, word: "Improve", meaning: "To become better", exampleSentence: "I want to improve my communication skills.", partOfSpeech: "verb", difficulty: "easy" }, // Dup #7
      { no: 39, word: "Probably", meaning: "Most likely", exampleSentence: "I'll probably finish it tonight.", partOfSpeech: "adverb", difficulty: "easy" }, // Dup #2
      { no: 40, word: "Instead", meaning: "In place of something", exampleSentence: "Let's study instead of watching reels.", partOfSpeech: "adverb", difficulty: "easy" }, // Dup #4
    ],
  },
  // Day 5 — Vinayak's words (#41–50)
  {
    dayNumber: 5,
    submitterUsername: "vinuu",
    title: "Day 5 — Vinayak's Words",
    words: [
      { no: 41, word: "Honestly", meaning: "Truthfully; sincerely", exampleSentence: "Honestly, I didn't understand that topic.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 42, word: "Especially", meaning: "Particularly; more than others", exampleSentence: "I like this song, especially the beginning.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 43, word: "Recently", meaning: "Not long ago", exampleSentence: "I recently started learning Java.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 44, word: "Definitely", meaning: "Certainly; without doubt", exampleSentence: "I'll definitely finish this today.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 45, word: "Perhaps", meaning: "Maybe", exampleSentence: "Perhaps we can meet tomorrow.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 46, word: "Otherwise", meaning: "If not; in another way", exampleSentence: "Hurry up; otherwise, we'll be late.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 47, word: "Meanwhile", meaning: "At the same time", exampleSentence: "You finish your work; meanwhile, I'll prepare the notes.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 48, word: "Clearly", meaning: "In an easy-to-understand way", exampleSentence: "She clearly explained the problem.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 49, word: "Fortunately", meaning: "Luckily", exampleSentence: "Fortunately, I reached home before the rain.", partOfSpeech: "adverb", difficulty: "easy" },
      { no: 50, word: "Frequently", meaning: "Often; many times", exampleSentence: "I frequently practise English with my friends.", partOfSpeech: "adverb", difficulty: "easy" },
    ],
  },
  // Day 6 — Bhuu's words (#51–60)
  {
    dayNumber: 6,
    submitterUsername: "bhuu",
    title: "Day 6 — Bhuu's Words",
    words: [
      { no: 51, word: "Retain", meaning: "To keep or continue having something", exampleSentence: "We need to retain our customers.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 52, word: "Reside", meaning: "To live in a place", exampleSentence: "Where do you reside?", partOfSpeech: "verb", difficulty: "medium" },
      { no: 53, word: "Create", meaning: "To make something new", exampleSentence: "This plan will create more opportunities.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 54, word: "Demonstrate", meaning: "To show how something works", exampleSentence: "Let me demonstrate how it works.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 55, word: "Inform", meaning: "To tell someone something", exampleSentence: "Please inform me when you're ready.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 56, word: "Consider", meaning: "To think carefully about something", exampleSentence: "I will consider your offer.", partOfSpeech: "verb", difficulty: "easy" }, // Dup #34
      { no: 57, word: "Monitor", meaning: "To check or observe regularly", exampleSentence: "Please monitor the system for errors.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 58, word: "Collaborate", meaning: "To work together", exampleSentence: "We need to collaborate on this project.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 59, word: "Purchase", meaning: "To buy something", exampleSentence: "We need to purchase a new laptop.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 60, word: "Request", meaning: "To ask politely or formally", exampleSentence: "I want to request a day off.", partOfSpeech: "verb", difficulty: "easy" },
    ],
  },
  // Day 7 — Bhuu's words (#61–70)
  {
    dayNumber: 7,
    submitterUsername: "bhuu",
    title: "Day 7 — Bhuu's Words",
    words: [
      { no: 61, word: "Grateful", meaning: "Feeling thankful", exampleSentence: "I'm grateful to have a best friend like you.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 62, word: "Versatile", meaning: "Able to adapt or perform different roles", exampleSentence: "She's a versatile actor who excels in comedy and drama.", partOfSpeech: "adjective", difficulty: "hard" },
      { no: 63, word: "Comment", meaning: "To express an opinion", exampleSentence: "The manager declined to comment on the new policy.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 64, word: "Empathetic", meaning: "Able to understand another person's feelings", exampleSentence: "An empathetic listener tries to understand how others feel.", partOfSpeech: "adjective", difficulty: "hard" },
      { no: 65, word: "Accurate", meaning: "Correct or exact", exampleSentence: "The weather forecast was accurate today.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 66, word: "Baffle", meaning: "To confuse completely", exampleSentence: "This maths problem completely baffles me.", partOfSpeech: "verb", difficulty: "hard" },
      { no: 67, word: "Consistent", meaning: "Steady and reliable", exampleSentence: "He is a consistent worker who meets his deadlines.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 68, word: "Crucial", meaning: "Extremely important", exampleSentence: "Getting enough sleep is crucial for your health.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 69, word: "Inspire", meaning: "To encourage someone to do something positive", exampleSentence: "My friend inspired me to start new things.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 70, word: "Sufficient", meaning: "As much as needed", exampleSentence: "Make sure you drink sufficient water during the day.", partOfSpeech: "adjective", difficulty: "medium" },
    ],
  },
  // Day 8 — Vinayak's words (#71–80)
  {
    dayNumber: 8,
    submitterUsername: "vinuu",
    title: "Day 8 — Vinayak's Words",
    words: [
      { no: 71, word: "Overwhelmed", meaning: "Feeling unable to handle too much", exampleSentence: "I felt overwhelmed by all my assignments.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 72, word: "Retrieve", meaning: "To get something back", exampleSentence: "I need to retrieve my lost files.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 73, word: "Neglect", meaning: "To fail to give proper attention", exampleSentence: "Don't neglect your daily practice.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 74, word: "Anticipate", meaning: "To expect something beforehand", exampleSentence: "I anticipate a busy day tomorrow.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 75, word: "Resolve", meaning: "To solve a problem", exampleSentence: "We must resolve this issue quickly.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 76, word: "Prioritize", meaning: "To decide what is most important", exampleSentence: "I prioritize my studies every morning.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 77, word: "Misunderstand", meaning: "To understand something incorrectly", exampleSentence: "Please don't misunderstand my message.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 78, word: "Convince", meaning: "To persuade someone to believe or do something", exampleSentence: "I convinced my friend to join the class.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 79, word: "Endure", meaning: "To tolerate or get through something difficult", exampleSentence: "We must endure difficulties with patience.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 80, word: "Commitment", meaning: "Dedication to a responsibility or goal", exampleSentence: "My commitment to learning English is strong.", partOfSpeech: "noun", difficulty: "medium" },
    ],
  },
  // Day 9 — Vinayak's words (#81–90)
  {
    dayNumber: 9,
    submitterUsername: "vinuu",
    title: "Day 9 — Vinayak's Words",
    words: [
      { no: 81, word: "Cope", meaning: "To deal with a difficult situation", exampleSentence: "I am learning to cope with stress.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 82, word: "Persist", meaning: "To continue despite difficulties", exampleSentence: "If you persist, you will improve.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 83, word: "Resemble", meaning: "To look or be similar to someone or something", exampleSentence: "You resemble your father.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 84, word: "Withdraw", meaning: "To remove or take something back", exampleSentence: "He decided to withdraw his application.", partOfSpeech: "verb", difficulty: "medium" },
      { no: 85, word: "Exaggerate", meaning: "To make something seem greater than it is", exampleSentence: "Don't exaggerate your achievements.", partOfSpeech: "verb", difficulty: "hard" },
      { no: 86, word: "Interpret", meaning: "To explain or understand the meaning", exampleSentence: "Can you interpret this sentence for me?", partOfSpeech: "verb", difficulty: "medium" },
      { no: 87, word: "Compromise", meaning: "To reach an agreement by making concessions", exampleSentence: "We reached a compromise during the discussion.", partOfSpeech: "noun", difficulty: "medium" },
      { no: 88, word: "Reluctantly", meaning: "Unwillingly or hesitantly", exampleSentence: "He reluctantly agreed to help us.", partOfSpeech: "adverb", difficulty: "medium" },
      { no: 89, word: "Fluent", meaning: "Able to speak a language smoothly", exampleSentence: "I want to become fluent in English.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 90, word: "Accountable", meaning: "Responsible for actions or results", exampleSentence: "Every team member is accountable for their work.", partOfSpeech: "adjective", difficulty: "hard" },
    ],
  },
  // Day 10 — Bhuu's words (#91–100)
  {
    dayNumber: 10,
    submitterUsername: "bhuu",
    title: "Day 10 — Bhuu's Words",
    words: [
      { no: 91, word: "Express", meaning: "To communicate a thought or feeling", exampleSentence: "It is easier to express my feelings in writing.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 92, word: "Brief", meaning: "Short in duration or length", exampleSentence: "The manager gave a brief speech.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 93, word: "Unique", meaning: "Being the only one of its kind", exampleSentence: "Every person has unique qualities.", partOfSpeech: "adjective", difficulty: "medium" },
      { no: 94, word: "Impact", meaning: "A strong effect or influence", exampleSentence: "The new recycling program had a positive impact on our neighbourhood.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 95, word: "Journey", meaning: "Travel from one place to another", exampleSentence: "Our train journey took six hours.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 96, word: "Benefit", meaning: "An advantage or positive result", exampleSentence: "Regular exercise has many benefits.", partOfSpeech: "noun", difficulty: "easy" },
      { no: 97, word: "Call", meaning: "To contact someone", exampleSentence: "I will call you later.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 98, word: "Free", meaning: "Not busy or occupied", exampleSentence: "I am free today.", partOfSpeech: "adjective", difficulty: "easy" },
      { no: 99, word: "Join", meaning: "To become part of something", exampleSentence: "Please join the class on time.", partOfSpeech: "verb", difficulty: "easy" },
      { no: 100, word: "Quick", meaning: "Done with speed", exampleSentence: "Let's grab a quick coffee before work.", partOfSpeech: "adjective", difficulty: "easy" },
    ],
  },
];

const ADDITIONAL_WORDS: { submitterUsername: "vinuu" | "bhuu"; word: WordEntry }[] = [
  { submitterUsername: "vinuu", word: { no: 101, word: "Trust", meaning: "To believe in someone's reliability", exampleSentence: "I trust my best friend with my secrets.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 102, word: "Support", meaning: "To help or encourage someone", exampleSentence: "My best friend supports my big life decisions.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 103, word: "Try", meaning: "To make an attempt", exampleSentence: "Always try your best, even when the task is difficult.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 104, word: "Need", meaning: "To require something", exampleSentence: "I need to buy some groceries this evening.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 105, word: "Visit", meaning: "To go to see a person or place", exampleSentence: "I want to visit my grandparents this Sunday.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 106, word: "Decide", meaning: "To choose after thinking", exampleSentence: "I cannot decide what to wear to the party.", partOfSpeech: "verb", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 107, word: "Common", meaning: "Frequently found or happening", exampleSentence: "Rain is common during this time of year.", partOfSpeech: "adjective", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 108, word: "Message", meaning: "Information sent to another person", exampleSentence: "Send me a text message when you arrive safely.", partOfSpeech: "noun", difficulty: "easy" } },
  { submitterUsername: "vinuu", word: { no: 109, word: "Share", meaning: "To give part of something to others", exampleSentence: "Can you share that food recipe with me?", partOfSpeech: "verb", difficulty: "easy" } },
  // Bhuu's later recorded words (#151–160)
  { submitterUsername: "bhuu", word: { no: 151, word: "Assess", meaning: "To evaluate or judge something", exampleSentence: "The teacher will assess our final projects next week.", partOfSpeech: "verb", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 152, word: "Astute", meaning: "Clever and good at judging situations", exampleSentence: "She made an astute business decision that saved money.", partOfSpeech: "adjective", difficulty: "hard" } },
  { submitterUsername: "bhuu", word: { no: 153, word: "Authentic", meaning: "Real or genuine", exampleSentence: "This restaurant serves authentic Italian food.", partOfSpeech: "adjective", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 154, word: "Benevolent", meaning: "Kind and well-meaning", exampleSentence: "Our benevolent neighbour offered to water our plants.", partOfSpeech: "adjective", difficulty: "hard" } },
  { submitterUsername: "bhuu", word: { no: 155, word: "Bizarre", meaning: "Very strange", exampleSentence: "We woke up to some bizarre weather this morning.", partOfSpeech: "adjective", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 156, word: "Candid", meaning: "Honest and direct", exampleSentence: "I appreciate your candid feedback on my new drawing.", partOfSpeech: "adjective", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 157, word: "Cease", meaning: "To stop or end", exampleSentence: "The loud music finally ceased at midnight.", partOfSpeech: "verb", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 158, word: "Chaos", meaning: "Complete disorder", exampleSentence: "The unexpected snow caused chaos on the highway.", partOfSpeech: "noun", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 159, word: "Conceal", meaning: "To hide something", exampleSentence: "He tried to conceal the surprise gift behind his back.", partOfSpeech: "verb", difficulty: "medium" } },
  { submitterUsername: "bhuu", word: { no: 160, word: "Elevate", meaning: "To raise or lift something", exampleSentence: "You can use pillows to elevate your injured foot.", partOfSpeech: "verb", difficulty: "easy" } },
];

async function seedMasterVocabularyList() {
  console.log("🚀 Starting BUVI Vocabulary Master List Seed into Database...\n");

  const vinuu = await prisma.user.findUnique({ where: { username: "vinuu" } });
  const bhuu = await prisma.user.findUnique({ where: { username: "bhuu" } });

  if (!vinuu || !bhuu) {
    throw new Error("Users @vinuu or @bhuu not found. Run npm run db:seed first.");
  }

  const userMap = {
    vinuu,
    bhuu,
  };

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  // Generate 10 consecutive dates for Days 1 to 10 ending today
  const dates = getLastNDates(10, timezone); // [day1_date, ..., today]

  let uniqueWordsCreated = 0;
  let duplicateWordsLinked = 0;

  // Process Days 1 to 10
  for (let d = 0; d < MASTER_DAYS.length; d++) {
    const batch = MASTER_DAYS[d];
    const dateStr = dates[d] || `2026-10-${(14 + d).toString().padStart(2, "0")}`;
    const submitter = userMap[batch.submitterUsername];
    const reviewer = batch.submitterUsername === "vinuu" ? bhuu : vinuu;

    console.log(`📦 Processing ${batch.title} (Assigned to @${submitter.username}) for date: ${dateStr}`);

    // Create or find DailyWordSet
    const dailySet = await prisma.dailyWordSet.upsert({
      where: { date: dateStr },
      update: {
        status: "published",
        submittedById: submitter.id,
        reviewedById: reviewer.id,
        publishedAt: new Date(),
      },
      create: {
        date: dateStr,
        status: "published",
        submittedById: submitter.id,
        reviewedById: reviewer.id,
        publishedAt: new Date(),
      },
    });

    // Create or link each of the 10 words
    for (let pos = 0; pos < batch.words.length; pos++) {
      const w = batch.words[pos];
      const normalized = normalizeWord(w.word);

      let vocabWord = await prisma.vocabularyWord.findUnique({
        where: { normalizedWord: normalized },
      });

      if (!vocabWord) {
        vocabWord = await prisma.vocabularyWord.create({
          data: {
            word: w.word,
            normalizedWord: normalized,
            meaning: w.meaning,
            pronunciation: "",
            partOfSpeech: w.partOfSpeech,
            exampleSentence: w.exampleSentence,
            difficulty: w.difficulty,
            submittedById: submitter.id,
          },
        });
        uniqueWordsCreated++;
      } else {
        duplicateWordsLinked++;
      }

      // Link to DailyWordSet at this position
      await prisma.dailyWordItem.upsert({
        where: {
          dailyWordSetId_position: {
            dailyWordSetId: dailySet.id,
            position: pos + 1,
          },
        },
        update: {
          vocabularyWordId: vocabWord.id,
        },
        create: {
          dailyWordSetId: dailySet.id,
          vocabularyWordId: vocabWord.id,
          position: pos + 1,
        },
      });
    }

    // Mark streak history for this date as completed by both
    await prisma.streakHistory.upsert({
      where: { date: dateStr },
      update: {
        dailyWordSetId: dailySet.id,
        vinuuCompleted: true,
        bhuuCompleted: true,
        bothCompleted: true,
        streakCount: d + 1,
      },
      create: {
        date: dateStr,
        dailyWordSetId: dailySet.id,
        vinuuCompleted: true,
        bhuuCompleted: true,
        bothCompleted: true,
        streakCount: d + 1,
      },
    });
  }

  // Process Additional words & Bhuu's later words
  console.log(`\n📚 Processing ${ADDITIONAL_WORDS.length} additional words & Bhuu's later words...`);
  for (const item of ADDITIONAL_WORDS) {
    const submitter = userMap[item.submitterUsername];
    const w = item.word;
    const normalized = normalizeWord(w.word);

    const existing = await prisma.vocabularyWord.findUnique({
      where: { normalizedWord: normalized },
    });

    if (!existing) {
      await prisma.vocabularyWord.create({
        data: {
          word: w.word,
          normalizedWord: normalized,
          meaning: w.meaning,
          pronunciation: "",
          partOfSpeech: w.partOfSpeech,
          exampleSentence: w.exampleSentence,
          difficulty: w.difficulty,
          submittedById: submitter.id,
        },
      });
      uniqueWordsCreated++;
    } else {
      duplicateWordsLinked++;
    }
  }

  // Update SharedStreak summary
  const lastDate = dates[dates.length - 1];
  await prisma.sharedStreak.upsert({
    where: { id: "singleton" },
    update: {
      currentStreak: MASTER_DAYS.length,
      longestStreak: MASTER_DAYS.length,
      totalSuccessfulDays: MASTER_DAYS.length,
      lastSuccessDate: lastDate,
    },
    create: {
      id: "singleton",
      currentStreak: MASTER_DAYS.length,
      longestStreak: MASTER_DAYS.length,
      totalSuccessfulDays: MASTER_DAYS.length,
      lastSuccessDate: lastDate,
    },
  });

  const totalInDb = await prisma.vocabularyWord.count();

  console.log("\n========================================================");
  console.log("🎉 BUVI Vocabulary Master List Seed Completed Successfully!");
  console.log(`✨ Total Unique Words Registered in Global Registry: ${totalInDb} (${uniqueWordsCreated} newly added)`);
  console.log(`🔄 Known Historical Duplicates Handled/Linked: ${duplicateWordsLinked}`);
  console.log(`🔥 Shared Streak Updated: ${MASTER_DAYS.length} Days Active Streak!`);
  console.log("========================================================\n");
}

seedMasterVocabularyList()
  .catch((e) => {
    console.error("❌ Failed to seed master vocabulary list:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
