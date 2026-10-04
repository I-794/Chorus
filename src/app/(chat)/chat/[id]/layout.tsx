import { notFound, redirect } from "next/navigation";
import { getConversation } from "@/db/queries/conversations";
import { auth } from "@/lib/auth";
import { conversationIdSchema } from "@/lib/validation";

// The ownership check lives here, outside the loading.tsx boundary, so a chat
// that isn't yours gets a real 404 status before any skeleton is streamed.
export default async function ChatLayout({ children, params }: LayoutProps<"/chat/[id]">) {
  const userId = (await auth())?.user?.id;
  if (!userId) redirect("/sign-in");

  const id = conversationIdSchema.safeParse((await params).id);
  if (!id.success || !(await getConversation(userId, id.data))) notFound();

  return children;
}
