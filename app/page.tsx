import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/db/server";
import { SignOutForm } from "@/features/auth/components/sign-out-form";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="font-serif text-4xl font-semibold text-ink">Vocamdy</h1>
        <p className="mt-6 text-sm text-muted">Signed in as</p>
        <p className="mt-1 break-words font-medium text-ink">
          {data.claims.email ?? "Signed in"}
        </p>
        <div className="mt-8 flex justify-center">
          <SignOutForm />
        </div>
      </section>
    </main>
  );
}
