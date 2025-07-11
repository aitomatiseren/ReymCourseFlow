import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

export function ChatBubble({ isOpen, onClick, hasUnreadMessages = false }: ChatBubbleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onClick}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-110",
          isOpen 
            ? "bg-gray-500 hover:bg-gray-600" 
            : "bg-blue-500 hover:bg-blue-600"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </>
        )}
      </Button>
    </div>
  );
}