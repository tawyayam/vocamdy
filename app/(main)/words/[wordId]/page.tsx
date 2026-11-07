import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { findWordById, getDeck } from "@/content/decks";
import { decodeWordId, getWordStatus } from "@/core/words";
import { getProgressForWord } from "@/db/progress";
import { requireUser } from "@/features/auth/server";
import { formatLongDate } from "@/features/study/format";
import { WordCard } from "@/features/study/components/word-card";
import { WordNotFound } from "@/features/words/components/word-not-found";

type WordPageProps = {
  params: Promise<{ wordId: string }>;
};

const STATUS_LABELS = {
  new: "Not started",
  learning: "Learning",
  graduated: "Graduated",
} as const;

export default async function WordPage({ params }: WordPageProps) {
  const { wordId } = await params;
  const decodedWordId = decodeWordId(wordId);
  const word = findWordById(decodedWordId);

  if (!word) {
    return <WordNotFound />;
  }

  const { supabase, userId } = await requireUser();
  const progress = await getProgressForWord(supabase, userId, decodedWordId);
  const deck = getDeck(word.deck);
  const status = getWordStatus(progress);
  const groupLabel =
    deck?.groups.find((group) => group.id === word.group)?.label ?? word.group;

  return (
    <div className="space-y-4">
      <Link
        href="/words"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        Words
      </Link>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <WordCard word={word} />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Progress
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium text-ink">{STATUS_LABELS[status]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Group</dt>
              <dd className="text-right font-medium text-ink">{groupLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Stage</dt>
              <dd className="font-medium text-ink">
                {progress ? `Stage ${progress.stage} of 4` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Next due</dt>
              <dd className="text-right font-medium text-ink">
                {progress?.dueDate
                  ? formatLongDate(progress.dueDate)
                  : "Not scheduled"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Correct</dt>
              <dd className="font-medium text-ink">
                {progress?.correctCount ?? 0}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Wrong</dt>
              <dd className="font-medium text-ink">{progress?.wrongCount ?? 0}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
