"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  Bookmark,
  Search,
  Volume2,
  Trash2,
  Star,
  Edit3,
  Check,
  BookOpen,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface SavedWordItem {
  id: string;
  vocabularyWordId: string;
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  exampleSentence: string;
  difficulty: string;
  submittedBy: string;
  isFavorited: boolean;
  privateNotes: string;
  masteryLevel: number;
  timesReviewed: number;
  lastReviewedAt: string | null;
  savedAt: string;
}

export default function VaultPage() {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<SavedWordItem[]>([]);
  const [search, setSearch] = useState("");
  const [masteryFilter, setMasteryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Editing private note
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  const loadSavedWords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (masteryFilter) params.set("mastery", masteryFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/vault?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setWords(json.data.savedWords);
      }
    } catch (e) {
      console.error("Vault load error:", e);
    } finally {
      setLoading(false);
    }
  }, [search, masteryFilter, sortBy]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  const speak = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRemove = async (wordId: string) => {
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWordId: wordId, action: "toggle" }),
      });
      const json = await res.json();
      if (json.success) {
        setWords((prev) => prev.filter((w) => w.vocabularyWordId !== wordId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNote = async (wordId: string) => {
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabularyWordId: wordId,
          action: "update",
          privateNotes: editNoteText,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setWords((prev) =>
          prev.map((w) =>
            w.vocabularyWordId === wordId ? { ...w, privateNotes: editNoteText } : w
          )
        );
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIncreaseMastery = async (wordId: string) => {
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWordId: wordId, action: "review" }),
      });
      const json = await res.json();
      if (json.success) {
        setWords((prev) =>
          prev.map((w) =>
            w.vocabularyWordId === wordId
              ? {
                  ...w,
                  masteryLevel: json.data.masteryLevel,
                  timesReviewed: json.data.timesReviewed,
                }
              : w
          )
        );
      }
    } catch (e) {
      console.error(e);
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
              <Bookmark className="w-7 h-7 text-amber-400 fill-amber-400" />
              Word Vault
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Your private sanctuary of saved vocabulary. Review tricky words, level up mastery, and jot down personal memory hooks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
              {words.length} Word{words.length === 1 ? "" : "s"} Saved
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved words or definitions..."
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value)}
              className="input-field text-xs"
            >
              <option value="">All Mastery Levels</option>
              <option value="0">Level 0 (New)</option>
              <option value="1">Level 1 (Familiar)</option>
              <option value="2">Level 2 (Practicing)</option>
              <option value="3">Level 3 (Solid)</option>
              <option value="4">Level 4 (Strong)</option>
              <option value="5">Level 5 (Mastered ⭐)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs"
            >
              <option value="newest">Sort: Recently Added</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="mastery">Sort: Highest Mastery</option>
              <option value="alpha">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Saved Words List */}
        {loading ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Loading saved vault...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="glass-card p-12 text-center border-gray-800">
            <Bookmark className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-200 mb-1">
              Your Vault is Empty
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              While studying in daily learning or browsing past words, click &ldquo;Save to Vault&rdquo; to store words here for focused spaced-repetition.
            </p>
            <Link href="/learn" className="btn btn-primary-vinuu text-xs py-2 px-4 rounded-xl">
              Study Today&apos;s Words
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {words.map((item) => {
              const isEditing = editingId === item.vocabularyWordId;

              return (
                <div
                  key={item.id}
                  className="glass-card p-5 border-gray-800 hover:border-gray-700 flex flex-col justify-between group transition-all"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                            {item.word}
                          </h3>
                          <button
                            onClick={() => speak(item.word)}
                            className="p-1 text-gray-500 hover:text-gray-300"
                            title="Pronounce"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.pronunciation && (
                          <p className="text-[11px] text-gray-400 italic">
                            /{item.pronunciation}/
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Mastery Stars */}
                        <div
                          className="flex items-center gap-0.5 cursor-pointer"
                          onClick={() => handleIncreaseMastery(item.vocabularyWordId)}
                          title="Click to bump mastery level on practice"
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < item.masteryLevel
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-700"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => handleRemove(item.vocabularyWordId)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
                          title="Remove from Vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meaning */}
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                      {item.meaning}
                    </p>

                    {/* Example sentence */}
                    {item.exampleSentence && (
                      <div className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800/80 text-[11px] text-gray-400 italic mb-3">
                        &ldquo;{item.exampleSentence}&rdquo;
                      </div>
                    )}

                    {/* Private Notes */}
                    <div className="mt-2 pt-2 border-t border-gray-800/60">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            placeholder="Add your mnemonic, memory hook, or personal note..."
                            className="input-field text-xs h-16 resize-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-ghost text-[10px] py-1 px-2.5 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(item.vocabularyWordId)}
                              className="btn btn-primary-vinuu text-[10px] py-1 px-3 rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <p className="italic line-clamp-1">
                            {item.privateNotes ? (
                              <span>Note: {item.privateNotes}</span>
                            ) : (
                              <span className="text-gray-600">No personal note added</span>
                            )}
                          </p>
                          <button
                            onClick={() => {
                              setEditingId(item.vocabularyWordId);
                              setEditNoteText(item.privateNotes);
                            }}
                            className="text-violet-400 hover:text-violet-300 p-1 flex items-center gap-1 shrink-0"
                            title="Edit private note"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer / Spaced review prompt */}
                  <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Reviewed {item.timesReviewed} time{item.timesReviewed === 1 ? "" : "s"}</span>
                    <button
                      onClick={() => handleIncreaseMastery(item.vocabularyWordId)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Practice (+1 Level)</span>
                    </button>
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
