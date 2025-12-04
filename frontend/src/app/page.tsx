"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, FileText, Sparkles, Plus, Terminal, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";

type Message = {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: string[];
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
      content: "**Nexus RAG v3.0**\n\nSistema listo. Interfaz visual actualizada a modo Dark/Neon. Sube tus documentos para comenzar.",
      timestamp: "09:00 AM" 
    },
  ]);

  const [documents, setDocuments] = useState<Doc[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
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
        content: `✅ **Ingesta completada:** _${file.name}_\nBase de datos actualizada con **${data.chunks_created}** nuevos vectores.`,
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
        content: `❌ Error procesando "${file.name}". Verifica el backend.`,
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
        sources: data.sources,
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = { 
        id: Date.now() + 1, 
        role: "ai", 
        content: "⚠️ **Error de conexión** con el servicio de IA.",
        timestamp: getCurrentTime()
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  if (!isMounted) return null;

  return (
    // FONDO: Negro puro con selección violeta
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden selection:bg-tech-neonViolet/30 selection:text-white">
      
      {/* SIDEBAR: Gris muy oscuro con borde sutil */}
      <aside className="w-72 bg-tech-panel border-r border-tech-border hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-tech-border/50 flex-shrink-0">
          <Terminal className="w-5 h-5 text-tech-neonViolet" />
          <h1 className="font-bold text-sm tracking-widest text-transparent bg-clip-text bg-cyber-gradient">
            NEXUS RAG
          </h1>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="mb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tech-neonViolet animate-pulse"></span>
            Memoria Vectorial
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-1">
              {documents.length === 0 && (
                <div className="text-xs text-slate-600 text-center py-10 opacity-50 border border-dashed border-slate-800 rounded-lg">
                  Sin documentos
                </div>
              )}
              {documents.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-all border border-transparent hover:border-tech-border cursor-pointer">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-4 h-4 text-slate-500 group-hover:text-tech-neonViolet transition-colors" />
                      <span className="truncate text-xs text-slate-400 group-hover:text-slate-200 font-medium">{doc.name}</span>
                   </div>
                   <div className={`w-1.5 h-1.5 rounded-full shadow-lg flex-shrink-0 ${
                     doc.status === 'indexed' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                     doc.status === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                   }`} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t border-tech-border flex-shrink-0">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
          <Button 
            variant="outline" 
            disabled={isUploading} 
            onClick={() => fileInputRef.current?.click()} 
            // BOTÓN DE CARGA: Efecto hover violeta
            className="w-full border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-tech-neonViolet hover:border-tech-neonViolet hover:bg-tech-neonViolet/5 transition-all uppercase text-[10px] font-mono tracking-widest h-9"
          >
              {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Plus className="w-3 h-3 mr-2" />}
              {isUploading ? "Procesando..." : "Ingestar Data"}
          </Button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <section className="flex-1 flex flex-col h-full min-w-0 bg-tech-bg">
        
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/80 backdrop-blur-md flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">SYSTEM: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
                  Llama 3.2
               </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <ScrollArea className="h-full w-full p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* AVATAR con borde brillante para IA */}
                  <Avatar className={`h-8 w-8 mt-1 flex-shrink-0 border ${msg.role === "ai" ? "border-tech-neonViolet/50 shadow-subtle-glow" : "border-slate-700"}`}>
                    <AvatarFallback className="bg-tech-panel text-xs font-bold">
                      {msg.role === "ai" ? <Bot className="w-4 h-4 text-tech-neonViolet" /> : <User className="w-4 h-4 text-slate-400" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`relative group max-w-[85%] lg:max-w-[75%]`}>
                    <div className={`relative px-5 py-4 text-sm leading-relaxed rounded-2xl border ${
                        msg.role === "user"
                          ? "bg-tech-panel border-tech-border text-slate-200 rounded-tr-sm"
                          : "bg-transparent border-transparent text-slate-300 pl-0 pt-0" // IA sin burbuja, estilo texto limpio
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-tech-panel prose-pre:border prose-pre:border-tech-border">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* FUENTES con estilo Tech */}
                      {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          {msg.sources.map((source, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 text-[10px] bg-tech-neonViolet/10 px-2.5 py-1 rounded-full text-tech-neonViolet border border-tech-neonViolet/20 hover:bg-tech-neonViolet/20 transition-colors cursor-default">
                              <BookOpen className="w-3 h-3" />
                              {source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`text-[10px] text-slate-600 mt-1 font-mono ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} className="h-1" />
            </div>
          </ScrollArea>
        </div>

        {/* INPUT: Fondo oscuro, borde sutil, botón neón */}
        <div className="p-4 border-t border-tech-border bg-tech-bg flex justify-center flex-shrink-0 z-20">
          <div className="w-full max-w-3xl relative">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center gap-2 bg-tech-panel border border-tech-border p-2 pl-4 rounded-full focus-within:ring-1 focus-within:ring-tech-neonViolet/50 transition-all shadow-lg">
                <Sparkles className="w-4 h-4 text-tech-neonViolet animate-pulse" />
                <Input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Escribe tu pregunta..." 
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-600 h-10 px-2" 
                  autoFocus 
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim()} 
                  // BOTÓN DE ENVIAR: Violeta Neón con Sombra Glow
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

      </section>
    </main>
  );
}