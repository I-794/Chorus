import { deleteConversation, renameConversation } from "@/db/queries/conversations";
import { ApiError, handle } from "@/lib/api-errors";
import { requireUserId } from "@/lib/auth";
import { conversationIdSchema, renameConversationSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

// Someone else's chat gets the same 404 as a missing one, so ids can't be probed.
const notFound = () => new ApiError("NOT_FOUND", "Conversation not found.");

export const PATCH = handle(async (req: Request, { params }: Context) => {
  const userId = await requireUserId();
  const id = conversationIdSchema.parse((await params).id);
  const { title } = renameConversationSchema.parse(await req.json());
  if (!(await renameConversation(userId, id, title))) throw notFound();
  return Response.json({ id, title });
});

export const DELETE = handle(async (_req: Request, { params }: Context) => {
  const userId = await requireUserId();
  const id = conversationIdSchema.parse((await params).id);
  // Messages cascade; usage_events keep the cost (conversation_id → NULL).
  if (!(await deleteConversation(userId, id))) throw notFound();
  return new Response(null, { status: 204 });
});
