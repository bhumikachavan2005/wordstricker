"use client";

import { useState } from "react";
import { DashboardData } from "@/types";
import { Navbar } from "@/components/layout/navbar";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { DualUserCard } from "@/components/dashboard/dual-user-card";
import { TodayWordsPreview } from "@/components/dashboard/today-words-preview";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Trophy, Sparkles, Calendar } from "lucide-react";
import Link from "next/link";

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard refresh error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isVinuu = data.currentUser.username === "vinuu";
  const currentUserProgress = isVinuu ? data.vinuuProgress : data.bhuuProgress;
  const partnerProgress = isVinuu ? data.bhuuProgress : data.vinuuProgress;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar currentStreak={data.streak.currentStreak} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">
                Welcome back,{" "}
                <span className={isVinuu ? "gradient-text-vinuu" : "gradient-text-bhuu"}>
                  {data.currentUser.displayName}
                </span>
                !
              </h1>
              <span className="text-2xl">{isVinuu ? "💜" : "🧡"}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{data.currentDate} (IST)</span>
              <span className="text-gray-600">•</span>
              <span>Level {data.currentUser.level} Scholar</span>
              <span className="text-gray-600">•</span>
              <span>{data.currentUser.xp} XP</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="btn btn-primary-bhuu text-xs py-2.5 px-4 rounded-xl font-semibold shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Submit Today&apos;s Words
            </Link>

            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="btn btn-ghost text-xs py-2.5 px-3 rounded-xl"
              title="Refresh dashboard stats"
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* 1. Shared Streak Central Hub */}
        <section id="streak">
          <StreakCounter
            currentStreak={data.streak.currentStreak}
            longestStreak={data.streak.longestStreak}
            totalWords={data.totalUniqueWords}
            weekCompletion={data.weekCompletion}
            availableFreezeTokens={data.currentUser.streakFreezeTokens}
            onUseFreezeToken={refreshData}
          />
        </section>

        {/* 2. Dual User Live Status: Vinuu & Bhuu */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
              <span>👥</span> Vinuu &amp; Bhuu Progress Tracker
            </h2>
            <span className="text-xs text-gray-400">
              Both must complete daily to maintain streak
            </span>
          </div>
          <DualUserCard
            vinuuProgress={data.vinuuProgress}
            bhuuProgress={data.bhuuProgress}
            currentUsername={data.currentUser.username}
          />
        </section>

        {/* 3. Today's 10 Words & Lock-In Hub */}
        <section>
          <TodayWordsPreview
            todaySet={data.todaySet}
            currentUserProgress={currentUserProgress}
            partnerProgress={partnerProgress}
            date={data.currentDate}
            onLockInSuccess={refreshData}
          />
        </section>

        {/* 4. Analytics & Progress Charts */}
        <section>
          <AnalyticsCharts
            wordsOverTime={data.analyticsData.wordsOverTime}
            quizAccuracy={data.analyticsData.quizAccuracy}
            streakHistory={data.analyticsData.streakHistory}
          />
        </section>

        {/* 5. Recent Achievements Showcase */}
        {data.achievements && data.achievements.length > 0 && (
          <section className="glass-card p-6 border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Recent Unlocked Badges
              </h3>
              <Link
                href="/achievements"
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                View All Badges →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-3"
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">{ach.name}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">
                      {ach.description}
                    </p>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      +{ach.xpAwarded} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-6 text-center text-xs text-gray-500">
        WordStreak • Private Vocabulary Learning Platform for Vinuu &amp; Bhuu
      </footer>
    </div>
  );
}
