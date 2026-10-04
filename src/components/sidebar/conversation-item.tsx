"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useAppState, type ConversationSummary } from "@/components/app-state";
import { MAX_TITLE_CHARS } from "@/lib/validation";

type Mode = "view" | "rename" | "confirm-delete";

export function ConversationItem({
  conversation,
  active,
  onNavigate,
}: {
  conversation: ConversationSummary;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { renameConversation, deleteConversation } = useAppState();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState(conversation.title);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "rename") inputRef.current?.select();
  }, [mode]);

  async function saveRename() {
    const title = draft.trim();
    if (!title || title === conversation.title) return setMode("view");
    setBusy(true);
    await renameConversation(conversation.id, title);
    setBusy(false);
    setMode("view");
  }

  async function confirmDelete() {
    setBusy(true);
    const ok = await deleteConversation(conversation.id);
    setBusy(false);
    setMode("view");
    if (ok && active) router.push("/");
  }

  if (mode === "rename") {
    return (
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveRename();
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            maxLength={MAX_TITLE_CHARS}
            disabled={busy}
            aria-label="Chat title"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void saveRename()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(conversation.title);
                setMode("view");
              }
            }}
            className="h-9 w-full rounded-lg border border-accent bg-card px-2.5 text-sm focus:outline-none"
          />
        </form>
      </li>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <li className="rounded-lg border border-danger/20 bg-danger-soft px-2.5 py-2">
        <p className="truncate text-sm">Delete “{conversation.title}”?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmDelete()}
            className="h-7 rounded-lg bg-danger px-2.5 text-xs font-medium text-background transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            Delete
          </button>
          <button
            type="button"
            disabled={busy}
            autoFocus
            onClick={() => setMode("view")}
            className="h-7 rounded-lg px-2.5 text-xs font-medium transition-colors hover:bg-card"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative">
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex h-9 items-center rounded-lg px-2.5 text-sm transition-colors ${
          active
            ? "bg-card pr-16 font-medium shadow-xs"
            : "text-foreground/85 hover:bg-muted group-hover:pr-16 group-focus-within:pr-16"
        }`}
      >
        <span className="truncate">{conversation.title}</span>
      </Link>
      <div
        className={`absolute inset-y-0 right-1 flex items-center gap-0.5 ${
          active ? "" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
      >
        <IconButton label="Rename" onClick={() => setMode("rename")}>
          <PencilSimple className="size-3.5" aria-hidden />
        </IconButton>
        <IconButton label="Delete" onClick={() => setMode("confirm-delete")}>
          <Trash className="size-3.5" aria-hidden />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
