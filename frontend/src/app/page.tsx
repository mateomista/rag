"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, FileText, Sparkles, Plus, Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

type Doc = { id: number; name: string; status: "indexed" | "processing" | "error" };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: "ai", 
      content: "Sistema Neural RAG v2.0 iniciado. \nListo para ingerir nuevos documentos y responder preguntas.",
      timestamp: "09:00 AM" 
    },
  ]);

  const [documents, setDocuments] = useState<Doc[]>([
    { id: 1, name: "Demo_Inicial.pdf", status: "indexed" },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll mejorado: Se dispara cada vez que cambian los mensajes
  useEffect(() => {
    if (scrollRef.current) {
      // Un pequeño timeout asegura que el DOM se pintó antes de scrollear
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const newDocId = Date.now();
    setDocuments(prev => [...prev, { id: newDocId, name: file.name, status: "processing" }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al subir");

      setDocuments(prev => prev.map(doc => 
        doc.id === newDocId ? { ...doc, status: "indexed" } : doc
      ));

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        content: `✅ Documento "${file.name}" memorizado correctamente.\nSe crearon ${data.chunks_created} fragmentos de información.`,
        timestamp: getCurrentTime()
      }]);

    } catch (error) {
      console.error(error);
      setDocuments(prev => prev.map(doc => 
        doc.id === newDocId ? { ...doc, status: "error" } : doc
      ));
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        content: `❌ Error procesando "${file.name}".`,
        timestamp: getCurrentTime()
      }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { 
        id: Date.now(), 
        role: "user", 
        content: input,
        timestamp: getCurrentTime()
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input;
    setInput("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) throw new Error("Error en el servidor");
      const data = await response.json();

      const aiMsg: Message = { 
        id: Date.now() + 1, 
        role: "ai", 
        content: data.response,
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        role: "ai", 
        content: "⚠️ Error de conexión con el Backend.",
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  if (!isMounted) return null;

  return (
    // ESTRUCTURA PRINCIPAL: Flex Column que ocupa el 100% de la pantalla
    // 'overflow-hidden' evita que la página entera tenga scroll
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-tech-bg to-tech-bg">
      
      {/* SIDEBAR (Fijo a la izquierda) */}
      <aside className="w-72 border-r border-tech-border bg-tech-panel/30 hidden md:flex flex-col backdrop-blur-sm flex-shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-tech-border/50 flex-shrink-0">
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
                   <div className={`w-1.5 h-1.5 rounded-full shadow-lg flex-shrink-0 ${
                     doc.status === 'indexed' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                     doc.status === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                   }`} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t border-tech-border/50 flex-shrink-0">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
          />
          <Button 
            variant="outline" 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-tech-neonBlue hover:border-tech-neonBlue hover:bg-tech-neonBlue/5 transition-all uppercase text-[10px] font-mono tracking-widest h-9"
          >
              {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Plus className="w-3 h-3 mr-2" />}
              {isUploading ? "Analizando..." : "Ingestar Data"}
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CHAT (Columna flexible) */}
      <section className="flex-1 flex flex-col h-full min-w-0">
        
        {/* HEADER (Fijo arriba) */}
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/50 backdrop-blur-xl flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">STATUS: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-slate-600">Model: Llama 3.2 (Local)</span>
            </div>
        </header>

        {/* SCROLL AREA (Ocupa todo el espacio sobrante) */}
        {/* 'flex-1' hace que crezca, 'min-h-0' es el truco para que el scroll funcione en flex items */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ScrollArea className="h-full w-full p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className={`h-8 w-8 mt-1 flex-shrink-0 border ${msg.role === "ai" ? "border-tech-neonBlue/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-tech-neonPurple/40"}`}>
                    <AvatarFallback className="bg-slate-950 text-xs font-bold">
                      {msg.role === "ai" ? <Bot className="w-4 h-4 text-tech-neonBlue" /> : <User className="w-4 h-4 text-tech-neonPurple" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`relative group max-w-[85%] lg:max-w-[75%]`}>
                    <div className={`relative px-5 py-3.5 text-sm leading-relaxed shadow-sm rounded-2xl ${
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
              {/* Elemento invisible al final para el auto-scroll */}
              <div ref={scrollRef} className="h-1" />
            </div>
          </ScrollArea>
        </div>

        {/* INPUT AREA (Fijo abajo, pero dentro del flujo Flex) */}
        {/* Quitamos 'absolute' para que sea más estable y no tape mensajes */}
        <div className="p-4 border-t border-tech-border/30 bg-tech-bg/95 backdrop-blur flex justify-center flex-shrink-0 z-20">
          <div className="w-full max-w-3xl relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-tech-neonBlue to-tech-neonPurple rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-2 bg-slate-950 border border-white/10 p-2 pl-4 rounded-full shadow-2xl ring-1 ring-white/5 focus-within:ring-tech-neonBlue/50 transition-all">
                <Sparkles className="w-5 h-5 text-slate-500 animate-pulse" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Interroga a la red neuronal..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-600 h-10 px-2 text-base font-light"
                  autoFocus
                />
                <Button type="submit" size="icon" disabled={!input.trim()} className="rounded-full bg-tech-neonBlue text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_15px_#06b6d4] transition-all duration-300 h-10 w-10 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
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