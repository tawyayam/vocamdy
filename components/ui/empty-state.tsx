import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  headingLevel?: "h1" | "h2";
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = "h2",
}: EmptyStateProps) {
  const Heading = headingLevel;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary"
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <Heading className="mt-4 break-words font-serif text-2xl font-semibold text-ink">
        {title}
      </Heading>
      <p className="mx-auto mt-2 max-w-md break-words text-sm text-muted">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
