"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Lock,
  ArrowRight,
  BookOpen,
  RotateCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Suspense } from "react";
import { DailyWordSetWithItems, VocabularyWordWithMeta } from "@/types";
import Link from "next/link";

function LearnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todaySet, setTodaySet] = useState<DailyWordSetWithItems | null>(null);
  const [wordsReviewed, setWordsReviewed] = useState(0);
  const [isLockedIn, setIsLockedIn] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const [reviewedWords, setReviewedWords] = useState<Record<string, boolean>>({});

  // AI Story state
  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyProvider, setStoryProvider] = useState<string>("");

  // Load daily set
  const loadDailyWords = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.success) {
        setTodaySet(data.data.todaySet);
        const myProg =
          data.data.currentUser.username === "vinuu"
            ? data.data.vinuuProgress
            : data.data.bhuuProgress;
        setWordsReviewed(myProg.wordsReviewed);
        setIsLockedIn(myProg.isLockedIn);
      }
    } catch (e) {
      console.error("Failed to load daily words:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyWords();
  }, [loadDailyWords]);

  // Initial index from URL query param
  useEffect(() => {
    const idx = searchParams.get("index");
    if (idx !== null) {
      const num = parseInt(idx, 10);
      if (!isNaN(num) && num >= 0 && num < 10) {
        setCurrentIndex(num);
      }
    }
  }, [searchParams]);

  const items = todaySet?.items || [];
  const currentItem = items[currentIndex];
  const currentWord = currentItem?.vocabularyWord;

  // Web Speech pronunciation
  const speakWord = (wordText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.rate = 0.9;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Record review in DB
  const markReviewed = async (wordId: string) => {
    if (reviewedWords[wordId]) return;
    setReviewedWords((prev) => ({ ...prev, [wordId]: true }));

    try {
      const res = await fetch("/api/words/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWordId: wordId, understood: true }),
      });
      const data = await res.json();
      if (data.success) {
        setWordsReviewed(data.data.wordsReviewed);
        if (data.data.allWordsReviewed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (e) {
      console.error("Failed to record review:", e);
    }
  };

  // Toggle Vault Bookmark
  const toggleVault = async (wordId: string) => {
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWordId: wordId, action: "toggle" }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedWords((prev) => ({
          ...prev,
          [wordId]: data.data.isSaved,
        }));
      }
    } catch (e) {
      console.error("Failed to toggle vault:", e);
    }
  };

  // Fetch AI Story
  const fetchAiStory = async () => {
    setStoryLoading(true);
    try {
      const res = await fetch("/api/ai/story");
      const data = await res.json();
      if (data.success) {
        setStory(data.data.story);
        setStoryProvider(data.data.provider);
      } else {
        alert(data.error || "Could not generate story");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStoryLoading(false);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentWord) markReviewed(currentWord.id);
    setIsFlipped(false);
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((f) => !f);
        if (currentWord) markReviewed(currentWord.id);
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length, currentWord]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Loading daily vocabulary deck...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!todaySet || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 text-center border-amber-500/30">
            <span className="text-4xl mb-3 block">📚</span>
            <h2 className="text-2xl font-bold font-outfit text-white mb-2">
              No Words Submitted for Today
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Kickstart today&apos;s mutual streak! Enter today&apos;s 10 vocabulary words to start studying.
            </p>
            <Link href="/submit" className="btn btn-primary-bhuu py-3 px-6 rounded-xl text-sm font-bold">
              Submit Today&apos;s 10 Words
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const difficultyColor =
    currentWord?.difficulty === "easy"
      ? "badge-easy"
      : currentWord?.difficulty === "hard"
      ? "badge-hard"
      : "badge-medium";

  const isSavedInVault = currentWord ? !!savedWords[currentWord.id] : false;
  const allCardsReviewed = wordsReviewed >= 10;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-outfit text-white">
                Daily Word Deck
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Word {currentIndex + 1} of {items.length}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">Space</kbd> to flip, <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">→</kbd> to navigate
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/quiz"
              className="btn btn-ghost text-xs py-2 px-3 rounded-lg border-gray-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Take Quiz
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-ghost text-xs py-2 px-3 rounded-lg"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Progress Bar & Word Dots */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Reviewed: <strong className="text-emerald-400">{wordsReviewed}/10</strong> words</span>
            <span>{Math.round((wordsReviewed / 10) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 transition-all duration-300"
              style={{ width: `${(wordsReviewed / 10) * 100}%` }}
            />
          </div>

          {/* Quick jump word numbers */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (currentWord) markReviewed(currentWord.id);
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  idx === currentIndex
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-110"
                    : idx < wordsReviewed
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-900 text-gray-500 border border-gray-800 hover:text-gray-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Flip Card Container */}
        {currentWord && (
          <div className="py-4">
            <div
              onClick={() => {
                setIsFlipped(!isFlipped);
                markReviewed(currentWord.id);
              }}
              className="relative w-full h-[360px] sm:h-[400px] cursor-pointer group"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative w-full h-full rounded-2xl transition-transform duration-700 shadow-2xl border border-gray-800 group-hover:border-violet-500/40"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* ── CARD FRONT ── */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col justify-between glass-card bg-gradient-to-br from-gray-900/90 via-gray-900/95 to-violet-950/30 backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      Word {currentIndex + 1} of 10
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${difficultyColor}`}>
                        {currentWord.difficulty}
                      </span>
                      <span className="text-xs text-gray-400 capitalize px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">
                        {currentWord.partOfSpeech}
                      </span>
                    </div>
                  </div>

                  {/* Word & Pronounce */}
                  <div className="text-center space-y-3 my-auto">
                    <h2 className="text-4xl sm:text-5xl font-black font-outfit text-white tracking-tight">
                      {currentWord.word}
                    </h2>

                    {currentWord.pronunciation && (
                      <p className="text-sm font-mono text-gray-400 italic">
                        /{currentWord.pronunciation}/
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(currentWord.word);
                        }}
                        className="btn btn-ghost text-xs py-1.5 px-3 rounded-full border-gray-700 hover:border-violet-500/50 flex items-center gap-1.5"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-4 h-4 text-violet-400" />
                        <span>Pronounce</span>
                      </button>
                    </div>
                  </div>

                  {/* Flip Hint */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Click card to reveal definition &amp; example</span>
                  </div>
                </div>

                {/* ── CARD BACK ── */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl p-8 flex flex-col justify-between glass-card bg-gradient-to-br from-gray-900/95 via-purple-950/20 to-gray-900 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      Definition &amp; Context
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVault(currentWord.id);
                      }}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                        isSavedInVault
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                      }`}
                      title="Save to personal Word Vault"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSavedInVault ? "fill-amber-400 text-amber-400" : ""}`} />
                      <span>{isSavedInVault ? "Saved to Vault" : "Save to Vault"}</span>
                    </button>
                  </div>

                  {/* Meaning & Example */}
                  <div className="space-y-4 my-auto">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Meaning:
                      </span>
                      <p className="text-lg sm:text-xl font-medium text-gray-100 leading-snug">
                        {currentWord.meaning}
                      </p>
                    </div>

                    {currentWord.exampleSentence && (
                      <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800/80">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Example in Action:
                        </span>
                        <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                          &ldquo;{currentWord.exampleSentence}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/80">
                    <span>Contributor: {currentWord.submitterName}</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Reviewed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Card Navigation Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn btn-ghost py-3 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={() => {
              setIsFlipped(!isFlipped);
              if (currentWord) markReviewed(currentWord.id);
            }}
            className="btn btn-ghost py-3 px-6 rounded-xl text-xs font-semibold flex items-center gap-2 border-violet-500/30 text-violet-300"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {isFlipped ? "Show Word" : "Flip to Meaning"}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === items.length - 1}
            className="btn btn-primary-vinuu py-3 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Completion Celebration & Lock-In Call to Action */}
        {allCardsReviewed && (
          <div className="glass-card p-6 border-emerald-500/40 bg-emerald-950/20 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎉</span> Great Job! All 10 Words Reviewed!
                </h3>
                <p className="text-xs text-gray-400">
                  {isLockedIn
                    ? "Your progress is already locked in for today! Take the quiz to earn XP."
                    : "You are now qualified to lock in today's daily progress and secure the streak."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/quiz"
                  className="btn btn-primary-bhuu text-xs py-2.5 px-4 rounded-xl font-bold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Take Quiz
                </Link>
                <Link
                  href="/dashboard#streak"
                  className="btn btn-primary-vinuu text-xs py-2.5 px-4 rounded-xl font-bold"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isLockedIn ? "Dashboard" : "Lock In Now"}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Daily Story Generator */}
        <div className="glass-card p-6 border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Context Story (All 10 Words)
              </h3>
              <p className="text-xs text-gray-400">
                Experience all 10 words woven into an imaginative story for memorable retention.
              </p>
            </div>

            {!story && (
              <button
                onClick={fetchAiStory}
                disabled={storyLoading}
                className="btn btn-primary-bhuu text-xs py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {storyLoading ? "Crafting Story..." : "Generate Daily Story"}
              </button>
            )}
          </div>

          {story && (
            <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-gray-200 leading-relaxed space-y-2 whitespace-pre-line animate-fade-in-up">
              <p>{story}</p>
              <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800 flex justify-between">
                <span>Story generated via {storyProvider}</span>
                <button
                  onClick={fetchAiStory}
                  disabled={storyLoading}
                  className="text-violet-400 hover:underline"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}
