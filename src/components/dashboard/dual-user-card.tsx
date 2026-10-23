"use client";

import { UserProgressSummary } from "@/types";
import { CheckCircle2, Clock, Lock, BookOpen, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface DualUserCardProps {
  vinuuProgress: UserProgressSummary;
  bhuuProgress: UserProgressSummary;
  currentUsername: string;
}

export function DualUserCard({
  vinuuProgress,
  bhuuProgress,
  currentUsername,
}: DualUserCardProps) {
  const users = [
    {
      progress: vinuuProgress,
      theme: "vinuu",
      accent: "from-violet-600 to-purple-800",
      border: "border-violet-500/30",
      glow: "glow-vinuu",
      barColor: "bg-linear-to-r from-violet-600 to-purple-400",
      textGradient: "gradient-text-vinuu",
      tagEmoji: "💜",
    },
    {
      progress: bhuuProgress,
      theme: "bhuu",
      accent: "from-amber-500 to-orange-600",
      border: "border-amber-500/30",
      glow: "glow-bhuu",
      barColor: "bg-linear-to-r from-amber-500 to-orange-400",
      textGradient: "gradient-text-bhuu",
      tagEmoji: "🧡",
    },
  ];

  const getStatusBadge = (progress: UserProgressSummary) => {
    if (progress.isLockedIn) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Lock className="w-3 h-3 text-emerald-400" />
          Locked In
        </span>
      );
    }
    if (progress.wordsReviewed >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <CheckCircle2 className="w-3 h-3 text-blue-400" />
          Words Done (Ready to Lock)
        </span>
      );
    }
    if (progress.wordsReviewed > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400" />
          In Progress ({progress.wordsReviewed}/10)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
        <Clock className="w-3 h-3 text-gray-500" />
        Not Started
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {users.map(({ progress, theme, accent, border, glow, barColor, textGradient, tagEmoji }) => {
        const isCurrent = progress.username === currentUsername;
        const pct = Math.min(100, Math.round((progress.wordsReviewed / 10) * 100));

        return (
          <div
            key={progress.userId}
            className={`glass-card p-6 border ${border} relative overflow-hidden transition-all duration-300 ${
              isCurrent ? glow : "opacity-95"
            }`}
          >
            {/* Header / Avatar */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-linear-to-tr ${accent} flex items-center justify-center text-white text-xl font-bold shadow-md`}>
                  {progress.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-bold ${textGradient}`}>
                      {progress.displayName}
                    </h3>
                    <span className="text-sm">{tagEmoji}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Level {progress.level}</span>
                    <span className="text-gray-600">•</span>
                    <span>{progress.xp} XP</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>{getStatusBadge(progress)}</div>
            </div>

            {/* Daily Words Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  Daily Words Reviewed
                </span>
                <span className="font-semibold text-gray-200">
                  {progress.wordsReviewed} / 10
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-800/80">
                <span className="text-[11px] text-gray-400 block mb-1">Quiz Accuracy</span>
                <span className="text-base font-bold text-gray-100">
                  {progress.quizAccuracy !== null ? `${progress.quizAccuracy}%` : "Not Taken"}
                </span>
                {progress.quizScore !== null && progress.quizTotal && (
                  <span className="text-[11px] text-gray-500 block">
                    ({progress.quizScore}/{progress.quizTotal} correct)
                  </span>
                )}
              </div>

              <div className="bg-gray-900/60 rounded-xl p-3 border border-gray-800/80">
                <span className="text-[11px] text-gray-400 block mb-1">Lock-In Time</span>
                <span className="text-xs font-semibold text-gray-200">
                  {progress.lockedInAt
                    ? new Date(progress.lockedInAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Pending"}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {progress.isLockedIn ? "Streak Secured" : "Due by Midnight IST"}
                </span>
              </div>
            </div>

            {/* Quick Actions (for current user only) */}
            {isCurrent && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800/70">
                <Link
                  href="/learn"
                  className={`flex-1 btn text-xs py-2 rounded-lg ${
                    theme === "vinuu" ? "btn-primary-vinuu" : "btn-primary-bhuu"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {progress.wordsReviewed >= 10 ? "Review Words" : "Continue Learning"}
                </Link>

                <Link
                  href="/quiz"
                  className="btn btn-ghost text-xs py-2 rounded-lg border-gray-700 hover:border-gray-600"
                >
                  Quiz
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
