import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Minimize2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "./types";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatPanel({ isOpen, onClose, messages, onSendMessage, isLoading }: ChatPanelProps) {
  const { t } = useTranslation(['ai', 'common']);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn(
      "fixed bottom-24 right-6 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl transition-all duration-300 z-40",
      isOpen
        ? "opacity-100 translate-y-0 scale-100"
        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white rounded-t-lg">
        <div>
          <h3 className="font-semibold">{t('ai:chat.title')}</h3>
          <p className="text-xs text-blue-100">{t('ai:chat.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600 h-8 w-8 p-0"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto h-[480px] p-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-center p-6">
            <div>
              <div className="text-lg font-medium mb-2">{t('ai:welcome.greeting')}</div>
              <div className="text-sm">
                {t('ai:welcome.intro')}
                <ul className="mt-2 text-left space-y-1">
                  {(t('ai:welcome.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai:chat.placeholder')}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}