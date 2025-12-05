"use client";

import React, { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatContainer } from "@/components/chat/ChatContainer"; 
import { ChatInput } from "@/components/chat/ChatInput";         
import { Message, DocumentItem } from "@/types/chat";            

export default function ChatPage() {
  // --- 1. ESTADO ---
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false); 

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: "ai", 
      content: "**Nexus RAG v3.0**.",
      timestamp: "09:00 AM" 
    },
  ]);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => setIsMounted(true), []);

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- 2. HANDLERS (Lógica) ---
  
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
      alert("Error subiendo archivo"); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput(""); // Limpiar input inmediatamente
    setIsThinking(true);

    // Agregar mensaje usuario
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
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

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
        content: "⚠️ **Error:** Conexión fallida con el modelo.",
        timestamp: getCurrentTime() 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isMounted) return null;

  // --- 3. RENDER ---
  return (
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden selection:bg-tech-neonViolet/30 selection:text-white">
      
      <ChatSidebar 
        documents={documents} 
        isUploading={isUploading} 
        onUpload={handleFileUpload} 
      />

      <section className="flex-1 flex flex-col h-full min-w-0 bg-tech-bg">
        
        {/* Header */}
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/80 backdrop-blur-md flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">SYSTEM: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
               Llama 3.2
            </div>
        </header>

        {/* CONTENEDOR DE MENSAJES */}
        <ChatContainer messages={messages} />

        {/* INPUT DE TEXTO */}
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