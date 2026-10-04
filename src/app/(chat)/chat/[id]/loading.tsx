/** Skeleton shaped like a chat while its messages load. */
export default function LoadingChat() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy="true" aria-label="Loading chat">
      <div className="flex h-14 shrink-0 items-center px-3 md:px-6">
        <div className="h-4 w-44 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 pt-4 md:px-6">
        <div className="flex justify-end">
          <div className="h-11 w-64 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-2.5">
          <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-11/12 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-3/5 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      <div className="shrink-0 px-3 pb-3 md:px-6 md:pb-5">
        <div className="mx-auto h-[92px] w-full max-w-3xl animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
