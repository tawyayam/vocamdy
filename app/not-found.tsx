import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <EmptyState
          headingLevel="h1"
          icon={Compass}
          title="Page not found"
          description="This page does not exist or has moved."
          action={{ href: "/", label: "Back to Today" }}
        />
      </div>
    </main>
  );
}
