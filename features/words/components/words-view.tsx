"use client";

import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  filterLearnedWords,
  type LearnedWord,
  type WordFilter,
} from "@/core/words";

type WordsViewProps = {
  words: LearnedWord[];
};

const FILTERS: readonly { value: WordFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "learning", label: "Learning" },
  { value: "graduated", label: "Graduated" },
];

export function WordsView({ words }: WordsViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
  const visibleWords = useMemo(
    () => filterLearnedWords(words, query, filter),
    [filter, query, words],
  );

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm text-muted">Words</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Your words
        </h1>
        <p className="mt-2 text-sm text-muted">
          {words.length === 1 ? "1 learned word" : `${words.length} learned words`}
        </p>
      </header>
      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.8}
          />
          <label className="sr-only" htmlFor="words-search">
            Search words
          </label>
          <input
            id="words-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a word or meaning"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <div
          role="group"
          aria-label="Filter words"
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={
                filter === item.value
                  ? "inline-flex min-h-11 items-center rounded-full bg-primary px-3 text-sm font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  : "inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3 text-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {words.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No words yet"
          description="Learn your first words on Today."
          action={{ href: "/", label: "Go to Today" }}
        />
      ) : visibleWords.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No words match your search"
          description="Try a different word or meaning."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visibleWords.map((word) => (
            <li key={word.id}>
              <Link
                href={`/words/${encodeURIComponent(word.id)}`}
                className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 break-words font-serif text-xl font-semibold text-ink">
                    {word.word}
                  </p>
                  <span
                    className={
                      word.status === "graduated"
                        ? "shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
                        : "shrink-0 rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-ink"
                    }
                  >
                    {word.status === "graduated" ? "Graduated" : "Learning"}
                  </span>
                </div>
                {word.pos ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                    {word.pos}
                  </p>
                ) : null}
                <p className="mt-2 line-clamp-2 break-words text-sm text-muted">
                  {word.definition}
                </p>
                <p className="mt-2 break-words text-xs text-muted">
                  {word.groupLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
