import { notFound, redirect } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { getConversation, loadMessages } from "@/db/queries/conversations";
import { auth } from "@/lib/auth";
import { conversationIdSchema } from "@/lib/validation";

export default async function ChatPage({ params }: PageProps<"/chat/[id]">) {
  const userId = (await auth())?.user?.id;
  if (!userId) redirect("/sign-in");

  const id = conversationIdSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const conversation = await getConversation(userId, id.data);
  if (!conversation) notFound();

  const messages = await loadMessages(conversation.id);
  return (
    <Chat
      key={conversation.id}
      id={conversation.id}
      initialMessages={messages}
      isNew={false}
      title={conversation.title}
    />
  );
}
