"use client";

import React, { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message, DocumentItem, ChatSession } from "@/types/chat";

export default function ChatPage() {
  // --- 1. ESTADO DE LA APLICACIÓN ---
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Estado de Sesión y Datos
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Mensaje por defecto
  const WELCOME_MSG: Message = { 
    id: 0, 
    role: "ai", 
    content: "**Nexus RAG v3.3**\n\nBienvenido. Selecciona un chat del historial o sube un documento para empezar.", 
    timestamp: "09:00 AM" 
  };

  // --- 2. FUNCIONES DE API (Lógica) ---

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) { console.error("Error fetching sessions", e); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/documents/");
      if (res.ok) {
        const data = await res.json();
        // Mapeamos los datos de la DB al formato visual del Sidebar
        const docs: DocumentItem[] = data.map((d: any) => ({
            id: d.id, 
            name: d.filename, 
            status: "indexed" 
        }));
        setDocuments(docs);
      }
    } catch (e) { console.error("Error fetching docs", e); }
  };

  const loadSession = async (id: number) => {
    setSessionId(id);
    localStorage.setItem("nexus_session_id", id.toString());
    
    try {
        const res = await fetch(`http://localhost:8000/api/v1/chat/history/${id}`);
        if (res.ok) {
            const history = await res.json();
            setMessages(history.length > 0 ? history : [WELCOME_MSG]);
        }
    } catch (e) {
        console.error("Error loading session", e);
        setMessages([WELCOME_MSG]);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([WELCOME_MSG]);
    localStorage.removeItem("nexus_session_id");
  };

  // --- 3. EFECTOS (Al cargar la página) ---
  useEffect(() => {
    setIsMounted(true);
    fetchSessions(); // Cargar historial de chats
    fetchDocuments(); // Cargar lista de documentos persistentes
    
    // Intentar recuperar la última sesión abierta
    const savedId = localStorage.getItem("nexus_session_id");
    if (savedId) {
      loadSession(parseInt(savedId));
    } else {
      setMessages([WELCOME_MSG]);
    }
  }, []); // Se ejecuta solo una vez al montar

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- 4. MANEJADORES DE EVENTOS (Upload & Send) ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const newDocId = Date.now();
    
    // Feedback visual inmediato (Optimistic UI)
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

      // Actualizar estado a "Indexed"
      setDocuments(prev => prev.map(doc => doc.id === newDocId ? { ...doc, status: "indexed" } : doc));
      
      // Avisar en el chat
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        content: `✅ **Ingesta completada:** _${file.name}_\nBase de datos actualizada con **${data.chunks_created}** nuevos vectores.`,
        timestamp: getCurrentTime()
      }]);
      
      // Refrescamos la lista oficial de documentos
      fetchDocuments();

    } catch (error) {
      console.error(error);
      setDocuments(prev => prev.map(doc => doc.id === newDocId ? { ...doc, status: "error" } : doc));
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        content: `❌ Error procesando "${file.name}".`,
        timestamp: getCurrentTime()
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setIsThinking(true);

    // Agregar mensaje del usuario localmente
    const newMsg: Message = { id: Date.now(), role: "user", content: userText, timestamp: getCurrentTime() };
    const currentMessages = [...messages, newMsg];
    setMessages(currentMessages);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userText, 
            session_id: sessionId 
        }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      // Si el backend creó una sesión nueva, actualizamos el ID y la lista lateral
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        localStorage.setItem("nexus_session_id", data.session_id.toString());
        fetchSessions(); // Refrescar sidebar de historial
      }

      // Agregar respuesta de la IA
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

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`¿Seguro que quieres borrar "${filename}"? La IA olvidará su contenido.`)) return;

    // Actualización optimista: lo borramos de la lista visualmente primero
    setDocuments(prev => prev.filter(d => d.name !== filename));

    try {
        const res = await fetch(`http://localhost:8000/api/v1/documents/${filename}`, {
            method: "DELETE"
        });
        
        if (!res.ok) throw new Error("Error borrando");
        
        // Notificación en el chat
        setMessages(prev => [...prev, {
            id: Date.now(),
            role: "ai",
            content: `🗑️ **Memoria eliminada:** He olvidado el contenido de _${filename}_.`,
            timestamp: getCurrentTime()
        }]);

    } catch (error) {
        console.error(error);
        alert("No se pudo borrar el documento del servidor.");
        fetchDocuments(); // Revertimos: volvemos a cargar la lista real
    }
  };

  if (!isMounted) return null;

  // --- 5. RENDERIZADO (JSX) ---
  return (
    <main className="flex h-screen w-full bg-tech-bg text-slate-200 overflow-hidden selection:bg-tech-neonViolet/30 selection:text-white">
      
      {/* BARRA LATERAL (Historial y Documentos) */}
      <ChatSidebar 
        documents={documents} 
        sessions={sessions}
        currentSessionId={sessionId}
        isUploading={isUploading} 
        onUpload={handleFileUpload}
        onSelectSession={loadSession}
        onNewChat={handleNewChat}
        onDeleteDocument={handleDeleteDocument}
      />

      {/* ÁREA PRINCIPAL */}
      <section className="flex-1 flex flex-col h-full min-w-0 bg-tech-bg">
        
        {/* Header */}
        <header className="h-16 border-b border-tech-border flex items-center justify-between px-6 bg-tech-bg/80 backdrop-blur-md flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              <h2 className="text-xs font-mono text-slate-400">SYSTEM: <span className="text-emerald-400">ONLINE</span></h2>
            </div>
            <div className="flex items-center gap-3">
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

        {/* Lista de Mensajes */}
        <ChatContainer messages={messages} />

        {/* Entrada de Texto */}
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