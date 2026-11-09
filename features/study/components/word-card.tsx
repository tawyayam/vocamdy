"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Word } from "@/core/types";

type WordCardProps = {
  word: Word;
  id?: string;
  headingLevel?: "h1" | "h2" | "h3";
};

function ExampleSentence({ word }: { word: Word }) {
  if (!word.example) {
    return null;
  }

  const cloze = word.cloze;

  if (
    !cloze ||
    word.example.slice(cloze.start, cloze.end) !== cloze.form
  ) {
    return (
      <p className="mt-3 break-words font-serif text-base leading-7 text-muted">
        {word.example}
      </p>
    );
  }

  return (
    <p className="mt-3 break-words font-serif text-base leading-7 text-muted">
      {word.example.slice(0, cloze.start)}
      <mark className="rounded bg-highlight px-0.5 text-ink">
        {cloze.form}
      </mark>
      {word.example.slice(cloze.end)}
    </p>
  );
}

export function WordCard({
  word,
  id,
  headingLevel = "h2",
}: WordCardProps) {
  const [canSpeak, setCanSpeak] = useState(false);
  const Heading = headingLevel;

  useEffect(() => {
    const update = () =>
      setCanSpeak(
        "speechSynthesis" in window &&
          "SpeechSynthesisUtterance" in window,
      );
    update();
  }, []);

  function speak() {
    if (!canSpeak) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <article
      id={id}
      className="min-w-0 scroll-mt-24 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {word.pos ? (
            <span className="inline-flex rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium uppercase tracking-[0.16em] text-primary">
              {word.pos}
            </span>
          ) : null}
          <Heading className="mt-1 break-words font-serif text-3xl font-semibold text-ink">
            {word.word}
          </Heading>
        </div>
        {canSpeak ? (
          <button
            type="button"
            onClick={speak}
            aria-label={`Hear ${word.word}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Volume2 aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <p className="mt-3 break-words text-base leading-7 text-ink">
        {word.definition}
      </p>
      <ExampleSentence word={word} />
      {word.arabic ? (
        <p
          dir="rtl"
          lang="ar"
          className="mt-4 break-words font-arabic text-xl text-muted"
        >
          {word.arabic}
        </p>
      ) : null}
    </article>
  );
}
