import Link from "next/link";

/** Shown inside the app shell (sidebar stays visible) for chats that don't exist. */
export default function ChatNotFound() {
  return (
    <div className="flex h-full items-center px-6 md:px-16">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tighter">This chat doesn&apos;t exist</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          It may have been deleted, or the link is wrong.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
        >
          Start a new chat
        </Link>
      </div>
    </div>
  );
}
