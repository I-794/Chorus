import { Chat } from "@/components/chat/chat";

// A fresh id per visit; the chat is only saved once the first message is accepted.
export default function NewChatPage() {
  const id = crypto.randomUUID();
  return <Chat key={id} id={id} initialMessages={[]} isNew />;
}
