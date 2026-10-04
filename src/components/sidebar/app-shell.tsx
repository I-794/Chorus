"use client";

import { createContext, useContext, useState } from "react";
import { Sidebar, type SidebarUser } from "./sidebar";

const MobileNavCtx = createContext<() => void>(() => {});

/** Opens the sidebar drawer on small screens. */
export function useOpenMobileNav() {
  return useContext(MobileNavCtx);
}

export function AppShell({ user, children }: { user: SidebarUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavCtx.Provider value={() => setOpen(true)}>
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-[272px] shrink-0 border-r border-border bg-sidebar md:flex">
          <Sidebar user={user} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(85vw,300px)] border-r border-border bg-sidebar shadow-xl">
              <Sidebar user={user} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </MobileNavCtx.Provider>
  );
}
