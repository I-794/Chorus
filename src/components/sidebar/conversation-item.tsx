"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
      <li className="rounded-lg bg-danger-soft px-2.5 py-2">
        <p className="truncate text-sm">Delete “{conversation.title}”?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmDelete()}
            className="h-7 rounded-md bg-danger px-2.5 text-xs font-medium text-white disabled:opacity-60"
          >
            Delete
          </button>
          <button
            type="button"
            disabled={busy}
            autoFocus
            onClick={() => setMode("view")}
            className="h-7 rounded-md px-2.5 text-xs font-medium hover:bg-card"
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
        className={`flex h-9 items-center rounded-lg pl-2.5 pr-16 text-sm transition-colors ${
          active ? "bg-card font-medium shadow-xs" : "text-foreground/85 hover:bg-muted"
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
          <Pencil className="size-3.5" aria-hidden />
        </IconButton>
        <IconButton label="Delete" onClick={() => setMode("confirm-delete")}>
          <Trash2 className="size-3.5" aria-hidden />
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
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
