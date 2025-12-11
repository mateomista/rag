import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Message } from "@/types/chat"; 

interface ChatContainerProps {
  messages: Message[];
}

export function ChatContainer({ messages }: ChatContainerProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Pasamos el ref directamente al scroll area interno */}
      <ScrollArea className="h-full w-full p-4 md:p-8">
        <div ref={containerRef} className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              sources={msg.sources}
            />
          ))}

          {/* marcador para el scroll */}
          <div className="h-1" />
        </div>
      </ScrollArea>
    </div>
  );
}
