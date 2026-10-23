"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  Archive,
  Search,
  Volume2,
  Bookmark,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface HistoryWordItem {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  difficulty?: "easy" | "medium" | "hard";
  submittedBy?: string;
  submittedByUsername?: string;
  submitterName?: string;
  isSaved?: boolean;
}

interface HistorySetItem {
  id: string;
  date: string;
  wordCount: number;
  submitterName: string;
  words: HistoryWordItem[];
}

export default function HistoryPage() {
  const [mode, setMode] = useState<"words" | "days">("words");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [contributor, setContributor] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [pos, setPos] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [words, setWords] = useState<HistoryWordItem[]>([]);
  const [sets, setSets] = useState<HistorySetItem[]>([]);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        params.set("mode", mode);
        params.set("page", page.toString());
        params.set("limit", "18");
        if (search) params.set("search", search);
        if (contributor) params.set("contributor", contributor);
        if (difficulty) params.set("difficulty", difficulty);
        if (pos) params.set("pos", pos);

        const res = await fetch(`/api/words/history?${params.toString()}`);
        const json = await res.json();
        if (!ignore && json.success) {
          setTotalPages(json.data.totalPages || 1);
          setTotalCount(json.data.total || 0);
          if (mode === "words") {
            const fetchedWords: HistoryWordItem[] = json.data.words || [];
            setWords(fetchedWords);
            const statusMap: Record<string, boolean> = {};
            fetchedWords.forEach((w) => {
              statusMap[w.id] = !!w.isSaved;
            });
            setSavedStatus(statusMap);
          } else {
            setSets((json.data.sets as HistorySetItem[]) || []);
          }
        }
      } catch (e) {
        if (!ignore) console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [mode, page, search, contributor, difficulty, pos]);

  const speak = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSave = async (wordId: string) => {
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWordId: wordId, action: "toggle" }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedStatus((prev) => ({ ...prev, [wordId]: json.data.isSaved }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
              <Archive className="w-7 h-7 text-violet-400" />
              Word Archive &amp; Explorer
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Browse every unique word ever registered on WordStreak by Vinuu and Bhuu.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => {
                setMode("words");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "words"
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Words View ({totalCount})
            </button>
            <button
              onClick={() => {
                setMode("days");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "days"
                  ? "bg-amber-500/30 text-amber-300 border border-amber-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Daily Sets View
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search words, meanings, or sentences..."
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={contributor}
              onChange={(e) => {
                setContributor(e.target.value);
                setPage(1);
              }}
              className="input-field text-xs"
            >
              <option value="">All Contributors</option>
              <option value="vinuu">Submitted by Vinuu 💜</option>
              <option value="bhuu">Submitted by Bhuu 🧡</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="input-field text-xs"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={pos}
              onChange={(e) => {
                setPos(e.target.value);
                setPage(1);
              }}
              className="input-field text-xs"
            >
              <option value="">All Parts</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
            </select>
          </div>
        </div>

        {/* Content Listing */}
        {loading ? (
          <div className="text-center py-20 space-y-2">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">Loading archive records...</p>
          </div>
        ) : mode === "words" ? (
          words.length === 0 ? (
            <div className="glass-card p-12 text-center border-gray-800">
              <Archive className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-300 font-semibold">No vocabulary words match the criteria.</p>
              <p className="text-xs text-gray-500 mt-1">Try clearing filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {words.map((w) => {
                const diffClass =
                  w.difficulty === "easy"
                    ? "badge-easy"
                    : w.difficulty === "hard"
                    ? "badge-hard"
                    : "badge-medium";
                const isSaved = !!savedStatus[w.id];

                return (
                  <div
                    key={w.id}
                    className="glass-card p-5 border-gray-800 hover:border-gray-700 flex flex-col justify-between group hover-lift transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${diffClass}`}>
                          {w.difficulty}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSave(w.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSaved
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                            }`}
                            title={isSaved ? "Saved in Vault" : "Save to Vault"}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                          {w.word}
                        </h3>
                        <button
                          onClick={() => speak(w.word)}
                          className="p-1 text-gray-500 hover:text-gray-300"
                          title="Pronounce"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {w.pronunciation && (
                        <p className="text-[11px] text-gray-400 italic mb-2">
                          /{w.pronunciation}/
                        </p>
                      )}

                      <p className="text-xs text-gray-300 leading-relaxed mb-3">
                        {w.meaning}
                      </p>

                      {w.exampleSentence && (
                        <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800/80 text-[11px] text-gray-400 italic">
                          &ldquo;{w.exampleSentence}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-500">
                      <span>By {w.submittedBy}</span>
                      <span className="capitalize">{w.partOfSpeech}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Days View */
          sets.length === 0 ? (
            <div className="glass-card p-12 text-center border-gray-800">
              <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-300 font-semibold">No daily sets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sets.map((set) => (
                <div key={set.id} className="glass-card p-6 border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base font-bold text-white font-outfit">
                        Daily Set: {set.date}
                      </h3>
                      <span className="text-xs text-gray-400">
                        ({set.wordCount} words by {set.submitterName})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {set.words.map((w: HistoryWordItem, idx: number) => (
                      <div
                        key={w.id || idx}
                        className="bg-gray-900/80 p-3 rounded-xl border border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-200">
                            {w.word}
                          </span>
                          <button
                            onClick={() => speak(w.word)}
                            className="p-1 text-gray-500 hover:text-gray-300"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-2">
                          {w.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-ghost text-xs py-2 px-4 rounded-xl disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs text-gray-400">
              Page <strong className="text-white">{page}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-ghost text-xs py-2 px-4 rounded-xl disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
