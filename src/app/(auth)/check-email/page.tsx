import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Wordmark className="mb-10" />
        <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We sent you a sign-in link. It works once and expires in 24 hours. You can close
          this tab.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 inline-block text-sm font-medium text-accent hover:underline"
        >
          Use a different email
        </Link>
      </div>
    </main>
  );
}
