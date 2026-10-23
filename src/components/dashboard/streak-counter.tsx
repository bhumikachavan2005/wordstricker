"use client";

import { useState } from "react";
import { Shield, CheckCircle, Calendar, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  weekCompletion: Array<{ date: string; completed: boolean }>;
  availableFreezeTokens: number;
  onUseFreezeToken?: () => void;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  totalWords,
  weekCompletion,
  availableFreezeTokens,
  onUseFreezeToken,
}: StreakCounterProps) {
  const [isUsingFreeze, setIsUsingFreeze] = useState(false);
  const [freezeUsedNotice, setFreezeUsedNotice] = useState<string | null>(null);

  const handleFreeze = async () => {
    if (availableFreezeTokens <= 0 || isUsingFreeze) return;
    setIsUsingFreeze(true);
    try {
      const res = await fetch("/api/streak", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFreezeUsedNotice("Streak Freeze token activated! Today is protected.");
        if (onUseFreezeToken) onUseFreezeToken();
      } else {
        alert(data.error || "Failed to use streak freeze");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUsingFreeze(false);
    }
  };

  const triggerStreakCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#ec4899", "#8b5cf6", "#10b981"],
    });
  };

  return (
    <div className="glass-card p-6 border-amber-500/20 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Streak Main Display */}
        <div className="flex items-center gap-5 cursor-pointer" onClick={triggerStreakCelebration} title="Click for celebratory fireworks!">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <span className="text-5xl animate-flicker">🔥</span>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black font-extrabold text-[10px] px-1.5 py-0.5 rounded-full shadow">
              ACTIVE
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black font-outfit gradient-text-streak tracking-tight">
                {currentStreak}
              </span>
              <span className="text-lg md:text-xl font-bold text-gray-200">
                Day Streak
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <span>Best: <strong className="text-amber-300">{longestStreak} days</strong></span>
              <span className="text-gray-600">•</span>
              <span>Total Words: <strong className="text-violet-300">{totalWords}</strong></span>
            </p>
          </div>
        </div>

        {/* 7-Day Calendar Dots */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Last 7 Days Progress
          </div>

          <div className="flex items-center gap-2">
            {weekCompletion.map((day, idx) => {
              const dayLabel = new Date(day.date).toLocaleDateString("en-US", { weekday: "narrow" });
              return (
                <div key={day.date || idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 uppercase">{dayLabel}</span>
                  <div
                    title={`${day.date}: ${day.completed ? "Both completed!" : "Incomplete"}`}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      day.completed
                        ? "bg-linear-to-tr from-emerald-500 to-teal-400 text-black shadow-md shadow-emerald-500/20"
                        : "bg-gray-800/80 border border-gray-700 text-gray-600"
                    }`}
                  >
                    {day.completed ? (
                      <CheckCircle className="w-4 h-4 text-gray-950 font-bold" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Freeze Token Status */}
        <div className="flex flex-col items-center md:items-end border-t md:border-t-0 md:border-l border-gray-800/80 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-300 font-medium">
              Freeze Tokens: <strong className="text-cyan-300">{availableFreezeTokens}</strong>
            </span>
          </div>

          {availableFreezeTokens > 0 ? (
            <button
              onClick={handleFreeze}
              disabled={isUsingFreeze || !!freezeUsedNotice}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {freezeUsedNotice ? "Protected Today" : "Use Streak Freeze"}
            </button>
          ) : (
            <span className="text-[11px] text-gray-500 italic">
              Earn tokens on streak milestones!
            </span>
          )}

          {freezeUsedNotice && (
            <p className="text-[11px] text-cyan-400 mt-1.5">{freezeUsedNotice}</p>
          )}
        </div>
      </div>
    </div>
  );
}
