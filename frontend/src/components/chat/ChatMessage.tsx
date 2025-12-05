import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: string[];
}

export function ChatMessage({ role, content, timestamp, sources }: ChatMessageProps) {
  return (
    <div className={`flex gap-6 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
      
      {/* AVATAR */}
      <Avatar className={`h-8 w-8 mt-1 flex-shrink-0 border ${role === "ai" ? "border-tech-neonViolet/50 shadow-subtle-glow" : "border-slate-700"}`}>
        <AvatarFallback className="bg-tech-panel text-xs font-bold">
          {role === "ai" ? <Bot className="w-4 h-4 text-tech-neonViolet" /> : <User className="w-4 h-4 text-slate-400" />}
        </AvatarFallback>
      </Avatar>

      {/* BURBUJA DE CONTENIDO */}
      <div className={`relative group max-w-[85%] lg:max-w-[75%]`}>
        <div className={`relative px-5 py-4 text-sm leading-relaxed rounded-2xl border ${
            role === "user"
              ? "bg-tech-panel border-tech-border text-slate-200 rounded-tr-sm"
              : "bg-transparent border-transparent text-slate-300 pl-0 pt-0"
          }`}
        >
          {/* MARKDOWN RENDERER */}
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-tech-panel prose-pre:border prose-pre:border-tech-border">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {/* FUENTES (Solo para AI) */}
          {role === "ai" && sources && sources.length > 0 && (
            <div className="mt-4 pt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {sources.map((source, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-[10px] bg-tech-neonViolet/10 px-2.5 py-1 rounded-full text-tech-neonViolet border border-tech-neonViolet/20 hover:bg-tech-neonViolet/20 transition-colors cursor-default">
                  <BookOpen className="w-3 h-3" />
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* TIMESTAMP */}
        <div className={`text-[10px] text-slate-600 mt-1 font-mono ${role === "user" ? "text-right" : "text-left"}`}>
          {timestamp}
        </div>
      </div>
    </div>
  );
}