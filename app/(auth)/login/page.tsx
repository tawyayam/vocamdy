import { GoogleSignInForm } from "@/features/auth/components/google-sign-in-form";
import { safeRedirectPath } from "@/core/redirect";
import { ThemeLogo } from "@/components/ui/theme-logo";

const errorMessages: Record<string, string> = {
  missing_code: "Google sign-in was cancelled or incomplete. Please try again.",
  auth: "Couldn't sign you in. Please try again.",
  setup: "Couldn't finish setting up your account. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const initialError =
    typeof params.error === "string"
      ? (errorMessages[params.error] ??
        "Couldn't sign you in. Please try again.")
      : null;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm text-center">
        <ThemeLogo
          alt="Vocamdy"
          size={96}
          fetchPriority="high"
          className="mx-auto h-24 w-24"
        />
        <h1 className="mt-6 font-serif text-4xl font-semibold text-ink">
          Vocamdy
        </h1>
        <p className="mt-3 text-muted">
          Daily practice for the Academic Word List.
        </p>
        <div className="mt-8">
          <GoogleSignInForm next={next} initialError={initialError} />
        </div>
      </section>
    </main>
  );
}
