import { redirect } from "next/navigation";
import { AppStateProvider } from "@/components/app-state";
import { AppShell } from "@/components/sidebar/app-shell";
import { PLANS } from "@/config/plans";
import { listConversations } from "@/db/queries/conversations";
import { getDailyUsage, getUserPlan } from "@/db/queries/usage";
import { auth } from "@/lib/auth";
import { nextUtcMidnight, utcDay } from "@/lib/limits/time";

export default async function ChatLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/sign-in");

  const [conversations, planId, today] = await Promise.all([
    listConversations(user.id),
    getUserPlan(user.id),
    getDailyUsage(user.id, utcDay()),
  ]);
  const plan = PLANS[planId];

  return (
    <AppStateProvider
      plan={planId}
      initialConversations={conversations.map((c) => ({
        ...c,
        updatedAt: c.updatedAt.toISOString(),
      }))}
      initialUsage={{
        plan: { id: planId, name: plan.name },
        today: {
          costMicros: today.costMicros,
          capMicros: plan.dailyCostCapMicros,
          messageCount: today.messageCount,
        },
        messagesPerMinute: plan.messagesPerMinute,
        resetsAt: nextUtcMidnight().toISOString(),
      }}
    >
      <AppShell user={{ name: user.name ?? null, email: user.email ?? null, image: user.image ?? null }}>
        {children}
      </AppShell>
    </AppStateProvider>
  );
}
