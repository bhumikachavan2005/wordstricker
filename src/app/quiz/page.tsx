"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { GeneratedQuestionDisplay } from "@/lib/quiz";

interface QuizData {
  quizId: string;
  date: string;
  totalQuestions: number;
  questions: GeneratedQuestionDisplay[];
  previousAttempt: {
    score: number;
    total: number;
    completedAt: string;
    answers: Record<string, string>;
  } | null;
}

interface QuizSubmissionResult {
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  results: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  newAchievements?: Array<{ key: string; name: string; xpReward: number }>;
}

export default function QuizPage() {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz");
      const json = await res.json();
      if (json.success) {
        setQuizData(json.data);
        if (json.data.previousAttempt) {
          setAnswers(json.data.previousAttempt.answers || {});
        }
      } else {
        setError(json.error || "Failed to load quiz");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while loading today's quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.quizId,
          answers,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmissionResult(json.data);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#7c3aed", "#f59e0b", "#10b981", "#3b82f6"],
        });
      } else {
        alert(json.error || "Failed to submit quiz");
      }
    } catch (e) {
      console.error(e);
      alert("Submission error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Loading daily quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quizData || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 text-center border-amber-500/30">
            <span className="text-4xl mb-3 block">❓</span>
            <h2 className="text-xl font-bold font-outfit text-white mb-2">
              No Quiz Available Yet
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {error || "Today's 10 vocabulary words must be published before the quiz can be generated."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/submit" className="btn btn-primary-bhuu py-2.5 px-4 rounded-xl text-xs font-bold">
                Submit 10 Words
              </Link>
              <Link href="/learn" className="btn btn-ghost py-2.5 px-4 rounded-xl text-xs font-bold">
                Learn Words
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = quizData.questions;
  const currentQ = questions[currentStep];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-outfit text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-amber-400" />
                Daily Vocabulary Quiz
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {quizData.date}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Reinforce retention with quick multiple choice, definitions, and sentence fill-ins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Answered: <strong className="text-amber-400">{answeredCount}/{totalQ}</strong>
            </span>
          </div>
        </div>

        {/* ── SUBMISSION RESULTS VIEW ── */}
        {submissionResult ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score Banner */}
            <div className="glass-card p-8 text-center border-amber-500/40 relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce-subtle" />
              </div>

              <h2 className="text-3xl font-black font-outfit text-white mb-1">
                Quiz Completed!
              </h2>

              <p className="text-base text-gray-300 font-semibold mb-4">
                You scored <span className="text-amber-400 font-bold">{submissionResult.score}</span> out of{" "}
                <span className="text-white font-bold">{submissionResult.total}</span> ({submissionResult.percentage}%)
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-bold mb-6">
                <Sparkles className="w-4 h-4 text-violet-400" />
                +{submissionResult.xpEarned} XP Earned!
              </div>

              {/* Newly Unlocked Achievements */}
              {submissionResult.newAchievements && submissionResult.newAchievements.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-900/80 border border-amber-500/30 max-w-sm mx-auto mb-6 text-left">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                    🏆 New Achievements Unlocked!
                  </span>
                  {submissionResult.newAchievements.map((ach) => (
                    <div key={ach.key} className="flex justify-between items-center text-xs text-gray-200 py-1">
                      <span>{ach.name}</span>
                      <span className="text-amber-300 font-semibold">+{ach.xpReward} XP</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setSubmissionResult(null);
                    setAnswers({});
                    setCurrentStep(0);
                  }}
                  className="btn btn-ghost text-xs py-2.5 px-4 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Quiz
                </button>

                <Link
                  href="/dashboard#streak"
                  className="btn btn-primary-vinuu text-xs py-2.5 px-6 rounded-xl font-bold"
                >
                  Lock In Progress →
                </Link>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="space-y-3">
              <h3 className="text-base font-bold font-outfit text-white">
                Detailed Answers Breakdown
              </h3>
              {submissionResult.results.map((res, idx) => (
                <div
                  key={res.questionId || idx}
                  className={`glass-card p-4 border text-xs ${
                    res.isCorrect ? "border-emerald-500/40" : "border-red-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-gray-200">
                      #{idx + 1}. {res.questionText}
                    </span>
                    {res.isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                        <CheckCircle className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 font-bold shrink-0">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-gray-400">
                    <p>
                      Your answer:{" "}
                      <strong className={res.isCorrect ? "text-emerald-300" : "text-red-300"}>
                        {res.userAnswer || "None"}
                      </strong>
                    </p>
                    {!res.isCorrect && (
                      <p>
                        Correct answer:{" "}
                        <strong className="text-emerald-400">{res.correctAnswer}</strong>
                      </p>
                    )}
                    {res.explanation && (
                      <p className="text-gray-500 italic mt-1">
                        Note: {res.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── QUESTION STEPPER VIEW ── */
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Question {currentStep + 1} of {totalQ}</span>
                <span className="capitalize text-violet-400 font-medium">
                  {currentQ.questionType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalQ) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="glass-card p-6 sm:p-8 border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold font-outfit text-white mb-6 leading-relaxed">
                {currentQ.questionText}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = answers[currentQ.id] === option;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => selectAnswer(currentQ.id, option)}
                      className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-violet-600/30 text-violet-200 border-violet-500 shadow-md shadow-violet-500/20"
                          : "bg-gray-900/60 text-gray-300 border-gray-800 hover:border-gray-700 hover:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400"
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="btn btn-ghost py-3 px-5 rounded-xl text-xs font-semibold disabled:opacity-30"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-6 h-6 rounded-md text-[11px] font-bold ${
                      i === currentStep
                        ? "bg-amber-500 text-black font-extrabold"
                        : answers[questions[i].id]
                        ? "bg-violet-950 text-violet-300 border border-violet-700"
                        : "bg-gray-900 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentStep < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentStep((s) => Math.min(totalQ - 1, s + 1))}
                  className="btn btn-primary-vinuu py-3 px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || answeredCount === 0}
                  className="btn btn-primary-bhuu py-3 px-6 rounded-xl text-xs font-bold shadow-lg"
                >
                  {isSubmitting ? "Grading..." : "Submit Answers"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
