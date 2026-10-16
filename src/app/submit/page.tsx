"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  PlusCircle,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Send,
  HelpCircle,
  Wand2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { WordFormData } from "@/types";

const INITIAL_WORD: WordFormData = {
  word: "",
  meaning: "",
  pronunciation: "",
  partOfSpeech: "noun",
  exampleSentence: "",
  difficulty: "medium",
};

const SAMPLE_WORDS_COLLECTION = [
  {
    word: "Soliloquy",
    meaning: "An act of speaking one's thoughts aloud when by oneself or regardless of any hearers",
    pronunciation: "suh-LIL-uh-kwee",
    partOfSpeech: "noun",
    exampleSentence: "The actor delivered a moving soliloquy that captivated the entire theater.",
    difficulty: "medium" as const,
  },
  {
    word: "Mellifluous",
    meaning: "Sweet or musical; pleasant to hear",
    pronunciation: "muh-LIF-loo-us",
    partOfSpeech: "adjective",
    exampleSentence: "She had a mellifluous voice that soothed everyone in the room.",
    difficulty: "hard" as const,
  },
  {
    word: "Serendipity",
    meaning: "The occurrence of events by chance in a happy or beneficial way",
    pronunciation: "sair-un-DIP-ih-tee",
    partOfSpeech: "noun",
    exampleSentence: "Finding my favorite lost book in the attic was pure serendipity.",
    difficulty: "medium" as const,
  },
  {
    word: "Ephemeral",
    meaning: "Lasting for a very short time; fleeting",
    pronunciation: "ih-FEM-er-ul",
    partOfSpeech: "adjective",
    exampleSentence: "The morning mist was ephemeral, disappearing as soon as the sun rose.",
    difficulty: "medium" as const,
  },
  {
    word: "Sycophant",
    meaning: "A person who acts obsequiously toward someone important in order to gain advantage",
    pronunciation: "SIK-uh-funt",
    partOfSpeech: "noun",
    exampleSentence: "The ruler was surrounded by sycophants who never questioned his foolish decisions.",
    difficulty: "hard" as const,
  },
  {
    word: "Alacrity",
    meaning: "Brisk and cheerful readiness; eager willingness",
    pronunciation: "uh-LAK-rih-tee",
    partOfSpeech: "noun",
    exampleSentence: "She accepted the promotion offer with enthusiastic alacrity.",
    difficulty: "hard" as const,
  },
  {
    word: "Cacophony",
    meaning: "A harsh, discordant mixture of sounds",
    pronunciation: "kuh-KOF-uh-nee",
    partOfSpeech: "noun",
    exampleSentence: "A cacophony of car horns and construction machines echoed through the street.",
    difficulty: "medium" as const,
  },
  {
    word: "Ubiquitous",
    meaning: "Present, appearing, or found everywhere",
    pronunciation: "yoo-BIK-wih-tus",
    partOfSpeech: "adjective",
    exampleSentence: "Smartphones have become ubiquitous across all age groups.",
    difficulty: "medium" as const,
  },
  {
    word: "Tenacious",
    meaning: "Tending to keep a firm hold of something; clinging or adhering closely; persistent",
    pronunciation: "tuh-NAY-shus",
    partOfSpeech: "adjective",
    exampleSentence: "His tenacious work ethic led to breakthroughs that others deemed impossible.",
    difficulty: "easy" as const,
  },
  {
    word: "Luminescence",
    meaning: "The emission of light by a substance not resulting from heat",
    pronunciation: "loo-mih-NES-ens",
    partOfSpeech: "noun",
    exampleSentence: "The deep sea jellyfish emitted a stunning blue luminescence.",
    difficulty: "medium" as const,
  },
];

export default function SubmitWordsPage() {
  const router = useRouter();
  const [words, setWords] = useState<WordFormData[]>(
    Array.from({ length: 10 }, () => ({ ...INITIAL_WORD }))
  );
  const [validationStatuses, setValidationStatuses] = useState<
    Array<{ status: "idle" | "valid" | "duplicate" | "error"; message?: string }>
  >(Array.from({ length: 10 }, () => ({ status: "idle" })));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishImmediately, setPublishImmediately] = useState(true);

  // Update a field for a word at index
  const updateWordField = (index: number, field: keyof WordFormData, value: string) => {
    const updated = [...words];
    updated[index] = { ...updated[index], [field]: value };
    setWords(updated);

    if (field === "word") {
      // Clear validation status
      const updatedStatuses = [...validationStatuses];
      updatedStatuses[index] = { status: "idle" };
      setValidationStatuses(updatedStatuses);
    }
  };

  // Validate a specific word against database and other words in current list
  const validateSingleWord = async (index: number) => {
    const wordText = words[index].word.trim();
    if (!wordText) {
      const updated = [...validationStatuses];
      updated[index] = { status: "idle" };
      setValidationStatuses(updated);
      return;
    }

    // 1. Check intra-batch duplicate
    const normalized = wordText.toLowerCase();
    const otherSame = words.findIndex(
      (w, i) => i !== index && w.word.trim().toLowerCase() === normalized
    );

    if (otherSame !== -1) {
      const updated = [...validationStatuses];
      updated[index] = {
        status: "duplicate",
        message: `Repeated in word #${otherSame + 1} of this submission!`,
      };
      setValidationStatuses(updated);
      return;
    }

    // 2. Check against database
    try {
      const res = await fetch("/api/words/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [words[index]] }),
      });
      const data = await res.json();

      const updated = [...validationStatuses];
      if (data.success && data.data.valid) {
        updated[index] = { status: "valid", message: "Unique & available! ✨" };
      } else if (data.data?.duplicates?.length > 0) {
        const dup = data.data.duplicates[0];
        updated[index] = {
          status: "duplicate",
          message: dup.message || "Already in the database!",
        };
      }
      setValidationStatuses(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Fill with sample words for effortless testing or quick study sessions
  const fillSampleWords = () => {
    setWords(SAMPLE_WORDS_COLLECTION.map((w) => ({ ...w })));
    setValidationStatuses(Array.from({ length: 10 }, () => ({ status: "idle" })));
  };

  // Clear all fields
  const clearAllWords = () => {
    setWords(Array.from({ length: 10 }, () => ({ ...INITIAL_WORD })));
    setValidationStatuses(Array.from({ length: 10 }, () => ({ status: "idle" })));
    setErrorMessage(null);
  };

  // Handle final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Check all 10 words are filled
    const missing = words.some((w) => !w.word.trim() || !w.meaning.trim());
    if (missing) {
      setErrorMessage("Please fill in both the Word and Meaning for all 10 vocabulary entries.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/words/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words,
          publishImmediately,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "Submission failed. Please check for duplicates.");
        // If duplicates returned, highlight them
        if (data.details?.duplicates) {
          const updatedStatuses = [...validationStatuses];
          data.details.duplicates.forEach((dup: any) => {
            const idx = words.findIndex(
              (w) => w.word.trim().toLowerCase() === dup.normalizedWord
            );
            if (idx !== -1) {
              updatedStatuses[idx] = {
                status: "duplicate",
                message: dup.message,
              };
            }
          });
          setValidationStatuses(updatedStatuses);
        }
        return;
      }

      // Success!
      setSuccessMessage("🎉 All 10 words successfully registered and published for today!");
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });

      setTimeout(() => {
        router.push("/learn");
      }, 1500);
    } catch (e) {
      console.error(e);
      setErrorMessage("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = words.filter((w) => w.word.trim() && w.meaning.trim()).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white flex items-center gap-2">
              <PlusCircle className="w-7 h-7 text-amber-400" />
              Submit Today&apos;s 10 Words
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Add today&apos;s vocabulary batch. Every word is strictly checked against the global archive to prevent duplicates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fillSampleWords}
              className="btn btn-ghost text-xs py-2 px-3 rounded-lg border-violet-500/30 text-violet-300 hover:bg-violet-950/30"
              title="Auto-fill with 10 high-yield vocabulary words"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Quick Fill Sample Words
            </button>
            <button
              type="button"
              onClick={clearAllWords}
              className="btn btn-ghost text-xs py-2 px-3 rounded-lg hover:text-red-400"
              title="Clear all inputs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Progress bar of 10 words */}
        <div className="glass-card p-4 border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">
              Completion: <strong className="text-amber-400">{filledCount} / 10</strong> words
            </span>
            <div className="w-32 sm:w-48 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-violet-500 transition-all duration-300"
                style={{ width: `${(filledCount / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-gray-400 hidden sm:block">
            Strict Global Duplicate Prevention Active 🛡️
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {words.map((wordItem, index) => {
            const statusInfo = validationStatuses[index];
            const isDup = statusInfo.status === "duplicate";
            const isValid = statusInfo.status === "valid";

            return (
              <div
                key={index}
                className={`glass-card p-4 sm:p-5 border transition-all duration-200 ${
                  isDup
                    ? "border-red-500/60 bg-red-950/15"
                    : isValid
                    ? "border-emerald-500/40"
                    : "border-gray-800/80 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-300">
                      Word #{index + 1}
                    </span>
                  </div>

                  {/* Duplicate Status Tag */}
                  <div>
                    {isDup && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        {statusInfo.message || "Duplicate Detected"}
                      </span>
                    )}
                    {isValid && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {statusInfo.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Word */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Word <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={wordItem.word}
                      onChange={(e) => updateWordField(index, "word", e.target.value)}
                      onBlur={() => validateSingleWord(index)}
                      placeholder="e.g. Ephemeral"
                      className={`input-field text-sm ${
                        isDup ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      required
                    />
                  </div>

                  {/* Pronunciation */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Pronunciation
                    </label>
                    <input
                      type="text"
                      value={wordItem.pronunciation}
                      onChange={(e) => updateWordField(index, "pronunciation", e.target.value)}
                      placeholder="ih-FEM-er-ul"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Part of Speech */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Part of Speech
                    </label>
                    <select
                      value={wordItem.partOfSpeech}
                      onChange={(e) => updateWordField(index, "partOfSpeech", e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="noun">Noun</option>
                      <option value="verb">Verb</option>
                      <option value="adjective">Adjective</option>
                      <option value="adverb">Adverb</option>
                      <option value="idiom">Idiom / Phrase</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Difficulty
                    </label>
                    <select
                      value={wordItem.difficulty}
                      onChange={(e) =>
                        updateWordField(index, "difficulty", e.target.value as any)
                      }
                      className="input-field text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Meaning */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Definition / Meaning <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={wordItem.meaning}
                      onChange={(e) => updateWordField(index, "meaning", e.target.value)}
                      placeholder="Concise, clear explanation"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  {/* Example Sentence */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">
                      Example Sentence
                    </label>
                    <input
                      type="text"
                      value={wordItem.exampleSentence}
                      onChange={(e) => updateWordField(index, "exampleSentence", e.target.value)}
                      placeholder="Use the word in a lively contextual sentence"
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Submission Options & Submit Button */}
          <div className="glass-card p-6 border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-gray-900 border-gray-700"
              />
              <span>Publish immediately to today&apos;s daily learning deck</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || filledCount < 10}
              className={`btn py-3.5 px-8 rounded-xl font-bold text-sm flex items-center gap-2 ${
                filledCount >= 10
                  ? "bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white shadow-lg hover-lift"
                  : "btn-ghost opacity-50 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Registering & Validating..." : "Submit 10 Words"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
