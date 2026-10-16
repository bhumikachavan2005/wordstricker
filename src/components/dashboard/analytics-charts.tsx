"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, Activity } from "lucide-react";
import { useState } from "react";

interface AnalyticsChartsProps {
  wordsOverTime: Array<{ date: string; count: number; cumulative: number }>;
  quizAccuracy: Array<{ date: string; vinuuScore: number; bhuuScore: number }>;
  streakHistory: Array<{ date: string; streak: number }>;
}

export function AnalyticsCharts({
  wordsOverTime,
  quizAccuracy,
  streakHistory,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<"words" | "quiz" | "streak">("words");

  // Format date display for chart axis
  const formatAxisDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card p-6 border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Learning &amp; Progress Analytics
          </h3>
          <p className="text-xs text-gray-400">
            Real-time vocabulary growth and friendly mutual performance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("words")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "words"
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/30 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Words Growth
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "quiz"
                ? "bg-amber-500/30 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Quiz Accuracy
          </button>
          <button
            onClick={() => setActiveTab("streak")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "streak"
                ? "bg-pink-500/30 text-pink-300 border border-pink-500/30 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Streak Momentum
          </button>
        </div>
      </div>

      {/* Chart Containers */}
      <div className="h-64 w-full">
        {activeTab === "words" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wordsOverTime.length > 0 ? wordsOverTime : [{ date: "Today", count: 10, cumulative: 10 }]}>
              <defs>
                <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatAxisDate} stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  borderColor: "#30363d",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Total Words"
                stroke="#a78bfa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#wordGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "quiz" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizAccuracy.length > 0 ? quizAccuracy : [{ date: "Today", vinuuScore: 90, bhuuScore: 85 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatAxisDate} stroke="#6b7280" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  borderColor: "#30363d",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="vinuuScore" name="Vinuu Accuracy %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bhuuScore" name="Bhuu Accuracy %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "streak" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={streakHistory.length > 0 ? streakHistory : [{ date: "Today", streak: 1 }]}>
              <defs>
                <linearGradient id="streakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatAxisDate} stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  borderColor: "#30363d",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="stepAfter"
                dataKey="streak"
                name="Streak (Days)"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#streakGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
