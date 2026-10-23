import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dates";
import { generateDailyQuiz } from "@/lib/quiz";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { z } from "zod";

const SubmitQuizSchema = z.object({
  quizId: z.string(),
  date: z.string().optional(),
  answers: z.record(z.string(), z.string()), // questionId -> chosen answer
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const date = searchParams.get("date") || getTodayDateString(timezone);

  try {
    const quiz = await generateDailyQuiz(date);

    if (!quiz) {
      return NextResponse.json({
        success: false,
        error: "No vocabulary set published for this date yet. Submit and publish 10 words first!",
      }, { status: 404 });
    }

    // Check if user already took this quiz
    const previousAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quiz.id,
        },
      },
    });

    // Sanitized questions for client (omit correctAnswer and explanation until submitted)
    const sanitizedQuestions = quiz.questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      questionText: q.questionText,
      options: JSON.parse(q.options) as string[],
      position: q.position,
    }));

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        date: quiz.date,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
        previousAttempt: previousAttempt
          ? {
              score: previousAttempt.score,
              total: previousAttempt.total,
              completedAt: previousAttempt.completedAt.toISOString(),
              answers: JSON.parse(previousAttempt.answers),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Quiz fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load quiz" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SubmitQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid quiz submission payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { quizId, answers } = parsed.data;

    // Load quiz with all questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Grade each question
    let score = 0;
    const total = quiz.questions.length;
    const results: Array<{
      questionId: string;
      questionText: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }> = [];

    for (const question of quiz.questions) {
      const userAnswer = (answers[question.id] || "").trim();
      const isCorrect =
        userAnswer.toLowerCase() === question.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        score++;
      }

      results.push({
        questionId: question.id,
        questionText: question.questionText,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    }

    // Save or update QuizAttempt
    await prisma.quizAttempt.upsert({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quiz.id,
        },
      },
      update: {
        answers: JSON.stringify(answers),
        score,
        total,
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        quizId: quiz.id,
        answers: JSON.stringify(answers),
        score,
        total,
        completedAt: new Date(),
      },
    });

    // Update UserDailyProgress for this date
    const date = quiz.date;
    const dailySet = await prisma.dailyWordSet.findUnique({ where: { date } });
    if (dailySet) {
      const currentProgress = await prisma.userDailyProgress.findUnique({
        where: { userId_date: { userId: session.user.id, date } },
      });

      const newStatus =
        currentProgress?.isLockedIn
          ? "locked_in"
          : currentProgress?.wordsReviewed && currentProgress.wordsReviewed >= 10
          ? "completed"
          : "learning";

      await prisma.userDailyProgress.upsert({
        where: { userId_date: { userId: session.user.id, date } },
        update: {
          quizScore: score,
          quizTotal: total,
          status: newStatus,
          lastActivityAt: new Date(),
        },
        create: {
          userId: session.user.id,
          dailyWordSetId: dailySet.id,
          date,
          quizScore: score,
          quizTotal: total,
          status: newStatus,
          lastActivityAt: new Date(),
        },
      });
    }

    // Award XP based on score (e.g. 10 XP per correct question, +50 bonus for 100%)
    let xpEarned = score * 10;
    if (score === total && total > 0) {
      xpEarned += 50; // Perfect score bonus
    }

    // Trigger achievement check
    const newlyAwardedAchievements = await checkAndAwardAchievements(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        xpEarned,
        results,
        newAchievements: newlyAwardedAchievements,
      },
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
