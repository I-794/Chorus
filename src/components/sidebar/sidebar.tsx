"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { NotePencil, SignOut } from "@phosphor-icons/react";
import { useAppState, type ConversationSummary } from "@/components/app-state";
import { signOutAction } from "@/components/auth/actions";
import { Wordmark } from "@/components/ui/wordmark";
import { formatUsd } from "@/lib/cost";
import { ConversationItem } from "./conversation-item";

export type SidebarUser = { name: string | null; email: string | null; image: string | null };

const DAY = 24 * 60 * 60 * 1000;

/** Splits chats into Today / Yesterday / Previous 7 days / Older, newest first. */
function groupByDate(conversations: ConversationSummary[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();
  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const c of conversations) {
    const t = new Date(c.updatedAt).getTime();
    const i = t >= today ? 0 : t >= today - DAY ? 1 : t >= today - 7 * DAY ? 2 : 3;
    groups[i].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

const noopSubscribe = () => () => {};

export function Sidebar({ user, onNavigate }: { user: SidebarUser; onNavigate?: () => void }) {
  const { conversations } = useAppState();
  const pathname = usePathname();
  // "Today" depends on the viewer's time zone, so only group in the browser.
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const groups = inBrowser
    ? groupByDate(conversations)
    : [{ label: "Chats", items: conversations }];

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href="/" onClick={onNavigate} aria-label="Chorus home" className="rounded-lg">
          <Wordmark />
        </Link>
      </div>

      <div className="px-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-xs transition-[background-color,transform] hover:bg-muted active:scale-[0.98]"
        >
          <NotePencil className="size-4 text-muted-foreground" aria-hidden />
          New chat
        </Link>
      </div>

      <nav aria-label="Conversations" className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-2 text-sm leading-relaxed text-muted-foreground">
            No chats yet. Your conversations will show up here.
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="px-2.5 pb-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="space-y-px">
                  {group.items.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      active={pathname === `/chat/${c.id}`}
                      onNavigate={onNavigate}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </nav>

      <div className="space-y-4 border-t border-border p-3 pt-4">
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
    <div className="px-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Used today</span>
        <span className="font-mono tabular-nums">
          {formatUsd(costMicros)}
          <span className="text-muted-foreground"> of {formatUsd(capMicros)}</span>
        </span>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
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
        <img src={user.image} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
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
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SignOut className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
