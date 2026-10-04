import { listConversations } from "@/db/queries/conversations";
import { handle } from "@/lib/api-errors";
import { requireUserId } from "@/lib/auth";

export const GET = handle(async () => {
  const userId = await requireUserId();
  return Response.json({ conversations: await listConversations(userId) });
});
