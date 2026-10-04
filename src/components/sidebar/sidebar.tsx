"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, SquarePen } from "lucide-react";
import { useAppState } from "@/components/app-state";
import { signOutAction } from "@/components/auth/actions";
import { Wordmark } from "@/components/ui/wordmark";
import { formatUsd } from "@/lib/cost";
import { ConversationItem } from "./conversation-item";

export type SidebarUser = { name: string | null; email: string | null; image: string | null };

export function Sidebar({ user, onNavigate }: { user: SidebarUser; onNavigate?: () => void }) {
  const { conversations } = useAppState();
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" onClick={onNavigate} aria-label="Chorus home">
          <Wordmark />
        </Link>
      </div>

      <div className="px-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
        >
          <SquarePen className="size-4 text-muted-foreground" aria-hidden />
          New chat
        </Link>
      </div>

      <nav aria-label="Conversations" className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-2 py-1 text-sm text-muted-foreground">
            Your chats will show up here.
          </p>
        ) : (
          <>
            <h2 className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Chats</h2>
            <ul className="space-y-px">
              {conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  active={pathname === `/chat/${c.id}`}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <UsageMeter />
        <UserRow user={user} />
      </div>
    </div>
  );
}

function UsageMeter() {
  const { usage } = useAppState();
  if (!usage) return null;
  const { costMicros, capMicros } = usage.today;
  const pct = Math.min(100, (costMicros / capMicros) * 100);
  const nearCap = pct >= 80;

  return (
    <div className="rounded-lg px-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Today</span>
        <span className="font-mono tabular-nums">
          {formatUsd(costMicros)}
          <span className="text-muted-foreground"> / {formatUsd(capMicros)}</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label="Daily spending"
        aria-valuemin={0}
        aria-valuemax={capMicros}
        aria-valuenow={costMicros}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${nearCap ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UserRow({ user }: { user: SidebarUser }) {
  const { usage } = useAppState();
  const label = user.name ?? user.email ?? "Account";

  return (
    <div className="flex items-center gap-2.5 px-1">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny avatar from the OAuth provider
        <img src={user.image} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {usage && <p className="text-xs text-muted-foreground">{usage.plan.name} plan</p>}
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
