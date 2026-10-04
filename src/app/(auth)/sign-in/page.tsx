import { redirect } from "next/navigation";
import { z } from "zod";
import { Wordmark } from "@/components/ui/wordmark";
import { auth, signIn } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  InvalidEmail: "That doesn't look like an email address.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use the one you used before.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
};

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

async function signInWithEmail(formData: FormData) {
  "use server";
  const email = z.email().max(254).safeParse(formData.get("email"));
  if (!email.success) redirect("/sign-in?error=InvalidEmail");
  await signIn("resend", { email: email.data, redirectTo: "/" });
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  if ((await auth())?.user) redirect("/");
  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? (ERRORS[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Wordmark className="mb-10" />
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          One place to talk to GPT, Claude and Gemini.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            {errorMessage}
          </p>
        )}

        <form action={signInWithGoogle} className="mt-8">
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithEmail} className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
