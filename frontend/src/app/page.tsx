"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, FileText, Sparkles, Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: string; 
};

type Doc = { id: number; name: string; status: "indexed" | "processing" };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: "ai", 
      content: "Sistema Neural RAG v2.0 iniciado. \nAcceso concedido a la base de conocimiento segura. \n¿En qué puedo asistirte hoy?",
      timestamp: "09:00 AM" 
    },
  ]);

  const [documents, setDocuments] = useState<Doc[]>([
    { id: 1, name: "Arquitectura_Sistema.pdf", status: "indexed" },
    { id: 2, name: "Reporte_Financiero_2024.xlsx", status: "indexed" },
    { id: 3, name: "Log_Servidor_Err.txt", status: "processing" },
  ]);

  // Efecto para marcar que ya estamos en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Función auxiliar para obtener hora actual formateada
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Mostrar mensaje del usuario inmediatamente
    const userMsg: Message = { 
        id: Date.now(), 
        role: "user", 
        content: input,
        timestamp: getCurrentTime()
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input; // Guardamos el texto para enviarlo
    setInput(""); // Limpiamos el input

    // 2. Llamada al Backend 
    try {
      // Creamos un mensaje temporal de "Escribiendo..." o esperamos
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) throw new Error("Error en el servidor");

      const data = await response.json();

      // 3. Mostrar respuesta del Backend
      const aiMsg: Message = { 
        id: Date.now() + 1, 
        role: "ai", 
        content: data.response, 
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      // Mensaje de error en el chat si falla
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        role: "ai", 
        content: "⚠️ Error: No pude conectar con el cerebro del sistema. Asegúrate de que el Backend está corriendo.",
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-tech-bg to-tech-bg">
      
      {/* ---- SIDEBAR ---- */}
      <aside className="w-72 border-r border-tech-border bg-tech-panel/30 hidden md:flex flex-col backdrop-blur-sm">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-tech-border/50">
          <Terminal className="w-5 h-5 text-tech-neonBlue" />
          <h1 className="font-bold text-sm tracking-widest text-transparent bg-clip-text bg-cyber-gradient">
            NEXUS RAG
          </h1>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="mb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tech-neonPurple animate-pulse"></span>
            Memoria Vectorial
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-1">
              {documents.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-all border border-transparent hover:border-tech-border/50 cursor-pointer">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-4 h-4 text-slate-500 group-hover:text-tech-neonBlue transition-colors" />
                      <span className="truncate text-xs text-slate-400 group-hover:text-slate-200 font-medium">
                        {doc.name}
                      </span>
                   </div>
                   <div className={`w-1.5 h-1.5 rounded-full shadow-lg ${
                     doc.status === 'indexed' 
                       ? 'bg-emerald-500 shadow-emerald-500/50' 
                       : 'bg-amber-500 animate-pulse'
                   }`} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t border-tech-border/50">
          <Button variant="outline" className="w-full border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-tech-neonBlue hover:border-tech-neonBlue hover:bg-tech-neonBlue/5 transition-all uppercase text-[10px] font-mono tracking-widest h-9">
              <Plus className="w-3 h-3 mr-2" /> Ingestar Data
          </Button>
        </div>
      </aside>

      {/* ---- MAIN CHAT ---- */}
      <section className="flex-1 flex flex-col relative z-10 h-full">
        
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/50 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">STATUS: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-slate-600">Model: GPT-4-Turbo</span>
            </div>
        </header>

        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className={`h-8 w-8 mt-1 border ${msg.role === "ai" ? "border-tech-neonBlue/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-tech-neonPurple/40"}`}>
                  <AvatarFallback className="bg-slate-950 text-xs font-bold">
                    {msg.role === "ai" ? <Bot className="w-4 h-4 text-tech-neonBlue" /> : <User className="w-4 h-4 text-tech-neonPurple" />}
                  </AvatarFallback>
                </Avatar>

                <div className={`relative group max-w-[80%] lg:max-w-[70%]`}>
                  <div
                    className={`relative px-5 py-3.5 text-sm leading-relaxed shadow-sm rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-tech-neonPurple/10 to-transparent border border-tech-neonPurple/20 text-slate-100 rounded-tr-sm"
                        : "bg-slate-900/80 border border-tech-border text-slate-300 rounded-tl-sm backdrop-blur-sm"
                    }`}
                  >
                    {msg.role === 'ai' && <div className="absolute inset-0 bg-tech-neonBlue/5 blur-lg rounded-2xl -z-10"></div>}
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                  
                  
                  <div className={`text-[10px] text-slate-600 mt-1 font-mono ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 md:pb-8 bg-gradient-to-t from-tech-bg via-tech-bg/95 to-transparent flex justify-center z-30 pointer-events-none">
          <div className="w-full max-w-3xl pointer-events-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-tech-neonBlue to-tech-neonPurple rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500 animate-tilt"></div>
            
            <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center gap-2 bg-slate-950/90 border border-white/10 p-2 pl-4 rounded-full shadow-2xl backdrop-blur-xl ring-1 ring-white/5 focus-within:ring-tech-neonBlue/50 transition-all"
            >
                <Sparkles className="w-5 h-5 text-slate-500 animate-pulse" />
                
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Interroga a la red neuronal..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-600 h-10 px-2 text-base font-light"
                  autoFocus
                />
                
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim()}
                    className="rounded-full bg-tech-neonBlue text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_15px_#06b6d4] transition-all duration-300 h-10 w-10 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </form>
            
            <div className="text-center mt-2">
               <span className="text-[10px] text-slate-600 font-mono">Powered by RAG & Vector Embeddings</span>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}