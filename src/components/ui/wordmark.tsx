export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Three offset bars: several voices, one chat. */}
      <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-accent">
        <rect x="2" y="4" width="10" height="3" rx="1.5" fill="currentColor" />
        <rect x="5" y="8.5" width="13" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="3.5" y="13" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.45" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Chorus</span>
    </div>
  );
}
