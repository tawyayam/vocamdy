import { CircleQuestionMark } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionExit } from "./session-exit";

type SessionEmptyProps = {
  title: string;
  description: string;
};

export function SessionEmpty({ title, description }: SessionEmptyProps) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      <header className="flex items-center gap-3">
        <SessionExit />
      </header>
      <div className="mt-5">
        <EmptyState
          headingLevel="h1"
          icon={CircleQuestionMark}
          title={title}
          description={description}
          action={{ href: "/", label: "Back to Today" }}
        />
      </div>
    </div>
  );
}
