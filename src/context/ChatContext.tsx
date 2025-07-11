import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatSession } from '@/components/chat/types';

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  return (
    <ChatContext.Provider value={{
      isOpen,
      setIsOpen,
      currentSession,
      setCurrentSession
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}