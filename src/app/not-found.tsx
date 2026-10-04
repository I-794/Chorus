import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-16">
      <Wordmark />
      <div className="flex flex-1 items-center py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tighter">This page doesn&apos;t exist</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            The chat may have been deleted, or the link is wrong.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
          >
            Start a new chat
          </Link>
        </div>
      </div>
    </main>
  );
}
