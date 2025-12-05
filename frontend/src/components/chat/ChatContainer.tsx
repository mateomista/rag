import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Message } from "@/types/chat"; 

interface ChatContainerProps {
  messages: Message[];
}

export function ChatContainer({ messages }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lógica de Auto-Scroll encapsulada aquí
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <ScrollArea className="h-full w-full p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              sources={msg.sources}
            />
          ))}
          {/* Elemento invisible para el scroll */}
          <div ref={scrollRef} className="h-1" />
        </div>
      </ScrollArea>
    </div>
  );
}