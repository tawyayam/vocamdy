"use client";

import { ArrowRight } from "lucide-react";
import type { Word } from "@/core/types";
import { SessionExit } from "./session-exit";
import { WordCard } from "./word-card";

type LearnScreenProps = {
  words: Word[];
  onStart: () => void;
};

export function LearnScreen({ words, onStart }: LearnScreenProps) {
  function scrollToWord(wordId: string) {
    const element = document.getElementById(`learn-${wordId}`);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    element?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-6">
      <header className="flex items-start gap-3">
        <SessionExit />
        <div className="min-w-0">
          <p className="text-sm text-muted">New words</p>
          <h1 className="mt-1 break-words font-serif text-3xl font-semibold text-ink">
            Learn the batch first.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Read each card, then start the quiz when you are ready.
          </p>
        </div>
      </header>

      <nav
        aria-label="Words in this batch"
        className="sticky top-0 z-10 -mx-4 mt-5 border-y border-border bg-paper/95 px-4 py-2 backdrop-blur"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {words.map((word) => (
            <button
              key={word.id}
              type="button"
              onClick={() => scrollToWord(word.id)}
              className="min-h-11 shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {word.word}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {words.map((word) => (
          <WordCard key={word.id} word={word} id={`learn-${word.id}`} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-sm"
        >
          Start quiz
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
