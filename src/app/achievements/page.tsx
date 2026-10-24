"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  Trophy,
  Sparkles,
  Lock,
  CheckCircle,
  Flame,
  BookOpen,
  HelpCircle,
  Users,
} from "lucide-react";

interface AchievementItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  threshold: number | null;
  unlockedByCurrentUser: boolean;
  unlockedByPartner: boolean;
  vinuuUnlocked: boolean;
  bhuuUnlocked: boolean;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const res = await fetch("/api/achievements");
        const json = await res.json();
        if (json.success) {
          setAchievements(json.data.achievements);
          setCategories(json.data.categories);
          setUnlockedCount(json.data.currentUserUnlockedCount);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, []);

  const filtered =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "streak":
        return <Flame className="w-4 h-4 text-orange-400" />;
      case "vocab":
        return <BookOpen className="w-4 h-4 text-violet-400" />;
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Users className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              Achievements &amp; Badges
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Celebrate your mutual milestones. Earn XP rewards and unlock bragging rights together!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
              {unlockedCount} / {achievements.length} Badges Unlocked
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                : "bg-gray-900/60 text-gray-400 hover:text-gray-200 border border-gray-800"
            }`}
          >
            All Badges ({achievements.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize flex items-center gap-1.5 transition-all ${
                selectedCategory === cat
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                  : "bg-gray-900/60 text-gray-400 hover:text-gray-200 border border-gray-800"
              }`}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        {loading ? (
          <div className="text-center py-20 space-y-2">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Loading achievement catalog...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const isUnlocked = item.unlockedByCurrentUser;

              return (
                <div
                  key={item.id}
                  className={`glass-card p-5 border transition-all duration-300 flex flex-col justify-between ${
                    isUnlocked
                      ? "border-amber-500/30 bg-amber-950/10 hover-lift"
                      : "border-gray-800/80 opacity-60 grayscale-40"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                            isUnlocked
                              ? "bg-linear-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40"
                              : "bg-gray-800/80 border border-gray-700 text-gray-500"
                          }`}
                        >
                          {item.icon}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                            {item.name}
                          </h3>
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            +{item.xpReward} XP
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="text-emerald-400" title="Unlocked by you!">
                          <CheckCircle className="w-5 h-5 fill-emerald-500/20" />
                        </span>
                      ) : (
                        <span className="text-gray-600" title="Locked">
                          <Lock className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Dual User Unlocked Pills */}
                  <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          item.vinuuUnlocked
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "bg-gray-900 text-gray-600"
                        }`}
                        title={item.vinuuUnlocked ? "Unlocked by Vinuu" : "Locked for Vinuu"}
                      >
                        Vinuu {item.vinuuUnlocked ? "✓" : "—"}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          item.bhuuUnlocked
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-gray-900 text-gray-600"
                        }`}
                        title={item.bhuuUnlocked ? "Unlocked by Bhuu" : "Locked for Bhuu"}
                      >
                        Bhuu {item.bhuuUnlocked ? "✓" : "—"}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-500 capitalize">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
