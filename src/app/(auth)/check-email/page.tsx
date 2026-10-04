import Link from "next/link";
import { EnvelopeSimpleOpen } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/ui/wordmark";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-16">
      <Wordmark />
      <div className="flex flex-1 items-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <EnvelopeSimpleOpen className="size-5" aria-hidden />
          </div>
          <h1 className="text-3xl font-semibold tracking-tighter">Check your email</h1>
          <p className="mt-3 max-w-[42ch] leading-relaxed text-muted-foreground">
            We sent you a sign-in link. It works once and expires in 24 hours, so you can
            close this tab.
          </p>
          <Link
            href="/sign-in"
            className="mt-8 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </main>
  );
}
