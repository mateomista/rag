"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message, DocumentItem } from "@/types/chat";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // 1. NUEVO ESTADO: Para recordar la conversación actual
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: "ai", 
      content: "**Nexus RAG v3.1 (Con Memoria Persistente)**\n\nTodo lo que hablemos quedará guardado en la base de datos SQLite.",
      timestamp: "09:00 AM" 
    },
  ]);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
    
    // A. Intentar recuperar ID del navegador
    const savedSessionId = localStorage.getItem("nexus_session_id");
    
    if (savedSessionId) {
      const id = parseInt(savedSessionId);
      setSessionId(id);
      console.log("💾 Sesión encontrada en disco:", id);

      // B. Pedir al backend los mensajes viejos
      fetch(`http://localhost:8000/api/v1/chat/history/${id}`)
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Sesión expirada");
        })
        .then(history => {
            // C. Si hay historial, lo cargamos reemplazando el mensaje inicial
            if (history.length > 0) {
                setMessages(history);
            }
        })
        .catch(err => {
            console.error("No se pudo recuperar historial:", err);
            localStorage.removeItem("nexus_session_id"); // Si falla, borramos el ID viejo
        });
    }
  }, []);

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
      if (!response.ok) throw new Error(data.message);

      setDocuments(prev => prev.map(doc => doc.id === newDocId ? { ...doc, status: "indexed" } : doc));
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        content: `✅ **Ingesta:** _${file.name}_ procesado (${data.chunks_created} fragmentos).`,
        timestamp: getCurrentTime()
      }]);

    } catch (error) {
      setDocuments(prev => prev.map(doc => doc.id === newDocId ? { ...doc, status: "error" } : doc));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setIsThinking(true);

    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: "user", 
      content: userText, 
      timestamp: getCurrentTime() 
    }]);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userText,
            // 2. ENVIAMOS EL ID (Si es null, el backend creará uno nuevo)
            session_id: sessionId 
        }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      // 3. ATRAPAMOS EL ID que nos devuelve el servidor
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem("nexus_session_id", data.session_id.toString());
        console.log("🔗 Conectado a sesión ID:", data.session_id);
      }

      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: "ai", 
        content: data.response,
        sources: data.sources,
        timestamp: getCurrentTime() 
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: "ai", 
        content: "⚠️ **Error:** No pude conectar con el cerebro.",
        timestamp: getCurrentTime() 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden selection:bg-tech-neonViolet/30 selection:text-white">
      <ChatSidebar 
        documents={documents} 
        isUploading={isUploading} 
        onUpload={handleFileUpload} 
      />
      <section className="flex-1 flex flex-col h-full min-w-0 bg-tech-bg">
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/80 backdrop-blur-md flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">SYSTEM: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="flex items-center gap-3">
               {/* Indicador visual de la sesión */}
               {sessionId && (
                 <div className="px-2 py-1 rounded bg-tech-neonViolet/10 border border-tech-neonViolet/20 text-[10px] font-mono text-tech-neonViolet">
                    SESSION #{sessionId}
                 </div>
               )}
               <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
                  Llama 3.2
               </div>
            </div>
        </header>

        <ChatContainer messages={messages} />

        <ChatInput 
          input={input} 
          setInput={setInput} 
          onSend={handleSend}
          isDisabled={isThinking} 
        />
      </section>
    </main>
  );
}