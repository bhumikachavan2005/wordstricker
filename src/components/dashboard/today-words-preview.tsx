"use client";

import { useState } from "react";
import { DailyWordSetWithItems, UserProgressSummary } from "@/types";
import {
  Volume2,
  Lock,
  PlusCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface TodayWordsPreviewProps {
  todaySet: DailyWordSetWithItems | null;
  currentUserProgress: UserProgressSummary;
  partnerProgress: UserProgressSummary;
  date: string;
  onLockInSuccess?: () => void;
}

export function TodayWordsPreview({
  todaySet,
  currentUserProgress,
  partnerProgress,
  date,
  onLockInSuccess,
}: TodayWordsPreviewProps) {
  const [isLockingIn, setIsLockingIn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lockInSuccessNotice, setLockInSuccessNotice] = useState<string | null>(null);

  const speak = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLockIn = async () => {
    setIsLockingIn(true);
    try {
      const res = await fetch("/api/progress/lock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmModal(false);
        setLockInSuccessNotice(
          data.data.streakUpdated
            ? `🔥 INCREDIBLE! Both of you locked in! Streak is now ${data.data.newStreak} DAYS!`
            : "✅ You have successfully locked in your daily progress! Waiting for your partner."
        );

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#7c3aed", "#f59e0b", "#10b981", "#ec4899"],
        });

        if (onLockInSuccess) {
          onLockInSuccess();
        }
      } else {
        alert(data.error || "Failed to lock in progress");
      }
    } catch (e) {
      console.error(e);
      alert("Error locking in progress. Please try again.");
    } finally {
      setIsLockingIn(false);
    }
  };

  // If no word set exists for today
  if (!todaySet || todaySet.items.length === 0) {
    return (
      <div className="glass-card p-8 text-center border-amber-500/20 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-2xl font-bold font-outfit text-white mb-2">
          Today&apos;s 10 Words Await!
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
          No vocabulary set has been published for today ({date}) yet. Either Vinuu or Bhuu can enter today&apos;s 10 new words to kickstart today&apos;s streak challenge!
        </p>
        <Link
          href="/submit"
          className="btn btn-primary-bhuu py-3 px-6 rounded-xl text-sm font-semibold hover-lift inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Today&apos;s 10 Words
        </Link>
      </div>
    );
  }

  const isReadyToLock = currentUserProgress.wordsReviewed >= 10;
  const isLocked = currentUserProgress.isLockedIn;

  return (
    <div className="space-y-6">
      {/* Lock In Status Hero Action */}
      <div className={`glass-card p-6 border ${
        isLocked
          ? "border-emerald-500/40 bg-emerald-950/20"
          : isReadyToLock
          ? "border-violet-500/40 bg-violet-950/20 animate-pulse-glow"
          : "border-gray-800"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">
                {isLocked ? "🔒" : isReadyToLock ? "⚡" : "📖"}
              </span>
              <h3 className="text-lg font-bold text-white">
                {isLocked
                  ? "Today's Progress Locked In!"
                  : isReadyToLock
                  ? "You're Ready to Lock In Today!"
                  : `Daily Learning: ${currentUserProgress.wordsReviewed} of 10 Words Reviewed`}
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              {isLocked
                ? partnerProgress.isLockedIn
                  ? "Both Vinuu & Bhuu locked in! Mutual streak successfully incremented! 🔥"
                  : `Waiting for ${partnerProgress.displayName} to lock in before midnight IST.`
                : isReadyToLock
                ? "You have reviewed all 10 words. Lock in now to register your day for the shared streak!"
                : "Review all 10 cards to unlock today's streak lock-in button."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isLocked && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!isReadyToLock || isLockingIn}
                className={`w-full sm:w-auto btn py-3 px-6 text-sm rounded-xl font-bold transition-all ${
                  isReadyToLock
                    ? "bg-linear-to-r from-violet-600 via-pink-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white shadow-lg shadow-violet-500/30 hover-lift"
                    : "btn-ghost opacity-60 cursor-not-allowed"
                }`}
              >
                <Lock className="w-4 h-4" />
                {isReadyToLock ? "Lock In Today 🔥" : "Review 10 Words to Lock In"}
              </button>
            )}

            <Link
              href="/learn"
              className="btn btn-ghost py-3 px-4 text-xs rounded-xl flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Interactive Cards
            </Link>
          </div>
        </div>

        {lockInSuccessNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-fade-in-up">
            {lockInSuccessNotice}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-md w-full p-6 border-violet-500/40 shadow-2xl relative">
            <h4 className="text-xl font-bold font-outfit text-white mb-2 flex items-center gap-2">
              <span>🔥</span> Ready to Lock In?
            </h4>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Locking in confirms you have completed your vocabulary review for today ({date}). Once your partner also locks in, your shared streak will level up!
            </p>

            <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800 text-xs space-y-1 mb-6 text-gray-400">
              <div className="flex justify-between">
                <span>Words Reviewed:</span>
                <span className="font-semibold text-emerald-400">{currentUserProgress.wordsReviewed} / 10</span>
              </div>
              <div className="flex justify-between">
                <span>Quiz Status:</span>
                <span className="font-semibold text-gray-300">
                  {currentUserProgress.quizScore !== null
                    ? `${currentUserProgress.quizScore}/${currentUserProgress.quizTotal} (${currentUserProgress.quizAccuracy}%)`
                    : "Skipped or Optional"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost text-xs py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLockIn}
                disabled={isLockingIn}
                className="btn btn-primary-vinuu text-xs py-2 px-5 rounded-lg font-bold shadow-lg"
              >
                {isLockingIn ? "Locking in..." : "Yes, Lock In Now!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's 10 Words Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-outfit text-white">
              Today&apos;s 10 Words
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              Submitted by {todaySet.submitterName}
            </span>
          </div>

          <Link
            href="/learn"
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
          >
            Study with 3D Flip Cards
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {todaySet.items.map((item, idx) => {
            const w = item.vocabularyWord;
            const difficultyBadge =
              w.difficulty === "easy"
                ? "badge-easy"
                : w.difficulty === "hard"
                ? "badge-hard"
                : "badge-medium";

            return (
              <div
                key={w.id || idx}
                className="glass-card p-4 hover-lift border-gray-800 hover:border-gray-700 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-500 font-mono">
                      #{idx + 1}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${difficultyBadge}`}>
                      {w.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-base font-bold text-gray-100 group-hover:text-amber-300 transition-colors">
                      {w.word}
                    </h4>
                    <button
                      onClick={() => speak(w.word)}
                      className="p-1 text-gray-500 hover:text-gray-200 transition-colors"
                      title="Pronounce word"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {w.pronunciation && (
                    <p className="text-[11px] text-gray-400 italic mb-2">
                      {w.pronunciation}
                    </p>
                  )}

                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {w.meaning}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="capitalize">{w.partOfSpeech}</span>
                  <Link
                    href={`/learn?index=${idx}`}
                    className="text-violet-400 hover:underline font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
