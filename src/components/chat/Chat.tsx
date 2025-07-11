import { useCallback } from "react";
import { ChatBubble } from "./ChatBubble";
import { ChatPanel } from "./ChatPanel";
import { useAIChat } from "@/hooks/useAIChat";
import { useChatContext } from "@/context/ChatContext";

export function Chat() {
  const { isOpen, setIsOpen } = useChatContext();
  const { messages, sendMessage, isLoading, hasMessages } = useAIChat();

  const toggleChat = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  return (
    <>
      <ChatBubble 
        isOpen={isOpen} 
        onClick={toggleChat}
        hasUnreadMessages={false}
      />
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </>
  );
}