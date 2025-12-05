import React from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isDisabled?: boolean;
}

export function ChatInput({ input, setInput, onSend, isDisabled }: ChatInputProps) {
  return (
    <div className="p-4 border-t border-tech-border bg-tech-bg flex justify-center flex-shrink-0 z-20">
      <div className="w-full max-w-3xl relative group">
        {/* Efecto de brillo detrás */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-tech-neonViolet to-tech-neonPink rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
        
        <form 
          onSubmit={(e) => { e.preventDefault(); onSend(); }} 
          className="relative flex items-center gap-2 bg-tech-panel border border-tech-border p-2 pl-4 rounded-full focus-within:ring-1 focus-within:ring-tech-neonViolet/50 transition-all shadow-lg"
        >
            <Sparkles className="w-4 h-4 text-tech-neonViolet animate-pulse" />
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Escribe tu pregunta..." 
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-600 h-10 px-2" 
              autoFocus 
              disabled={isDisabled}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isDisabled} 
              className="rounded-full bg-tech-neonViolet text-white hover:bg-violet-600 hover:shadow-neon transition-all duration-300 h-10 w-10 flex-shrink-0 disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
        </form>
        
        <div className="text-center mt-3">
           <span className="text-[10px] text-slate-700 font-mono tracking-wider">POWERED BY OLLAMA LOCAL & CHROMA</span>
        </div>
      </div>
    </div>
  );
}