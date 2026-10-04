import { redirect } from "next/navigation";
import { z } from "zod";
import { Lock } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/ui/wordmark";
import { canUseModel, MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";
import { auth, signIn } from "@/lib/auth";
import { formatUsd } from "@/lib/cost";

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

const price = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  if ((await auth())?.user) redirect("/");
  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? (ERRORS[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Left: message + sign-in */}
      <section className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <Wordmark />

        <div className="flex flex-1 flex-col justify-center py-12 lg:py-16">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tighter text-balance md:text-5xl">
              Ask every AI model from one chat.
            </h1>
            <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
              Switch between GPT, Claude and Gemini in the same conversation, and see what
              every reply costs.
            </p>

            {errorMessage && (
              <p
                role="alert"
                className="mt-8 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
              >
                {errorMessage}
              </p>
            )}

            <form action={signInWithGoogle} className="mt-8">
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-sm font-medium shadow-xs transition-[background-color,transform] hover:bg-muted active:scale-[0.98]"
              >
                <GoogleLogo />
                Continue with Google
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use your email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form action={signInWithEmail} className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 w-full min-w-0 rounded-lg border sm:flex-1 border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
                >
                  Send link
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll email you a one-time sign-in link. No password needed.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Right: the real model lineup, straight from src/config/models.ts */}
      <section
        aria-label="Available models"
        className="flex items-center border-t border-border bg-sidebar px-6 py-12 sm:px-10 lg:border-t-0 lg:border-l lg:px-16"
      >
        <div className="w-full max-w-md lg:mx-auto">
          <h2 className="text-sm font-medium">Available models</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prices are per million tokens, the same as the providers charge.
          </p>

          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {MODELS.map((m) => {
              const proOnly = !canUseModel(m, "free");
              return (
                <li key={m.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {m.name}
                      {proOnly && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                          <Lock className="size-2.5" weight="bold" aria-hidden />
                          Pro
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.provider}</p>
                  </div>
                  <p className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    <span className="text-foreground">{price(m.inputPricePerM)}</span> in
                    <br />
                    <span className="text-foreground">{price(m.outputPricePerM)}</span> out
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            The free plan includes {formatUsd(PLANS.free.dailyCostCapMicros)} of model use per
            day. Every reply shows its cost, so you always know where it went.
          </p>
        </div>
      </section>
    </main>
  );
}

/** Google's official "G" mark, required by Google's sign-in branding rules. */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
