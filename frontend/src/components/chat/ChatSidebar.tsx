import React, { useState, useRef } from "react";
import { Terminal, FileText, Loader2, Plus, MessageSquare, History, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentItem, ChatSession } from "@/types/chat";

interface ChatSidebarProps {
  documents: DocumentItem[];
  sessions: ChatSession[];
  currentSessionId: number | null;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteDocument: (filename: string) => void;
}

export function ChatSidebar({ 
  documents, 
  sessions, 
  currentSessionId,
  isUploading, 
  onUpload,
  onSelectSession,
  onNewChat,
  onDeleteDocument 
}: ChatSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "chats">("docs"); // Empieza en Docs por comodidad

  return (
    <aside className="w-72 bg-tech-panel border-r border-tech-border hidden md:flex flex-col flex-shrink-0 transition-all duration-300">
        
        <div className="h-16 flex items-center justify-between px-4 border-b border-tech-border/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-tech-neonViolet" />
            <h1 className="font-bold text-sm tracking-widest text-transparent bg-clip-text bg-cyber-gradient">
                NEXUS
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onNewChat} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" title="Nuevo Chat">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex p-2 gap-1 border-b border-tech-border/30">
            <button onClick={() => setActiveTab("chats")} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "chats" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"}`}>
                <History className="w-3.5 h-3.5" /> Historial
            </button>
            <button onClick={() => setActiveTab("docs")} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "docs" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"}`}>
                <FolderOpen className="w-3.5 h-3.5" /> Docs
            </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col p-3">
          <ScrollArea className="flex-1 pr-2">
            
            {activeTab === "chats" && (
                <div className="space-y-1">
                    {sessions.length === 0 && <div className="text-xs text-slate-600 text-center py-10">No hay historial</div>}
                    {sessions.map((session) => (
                        <button key={session.id} onClick={() => onSelectSession(session.id)} className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-all border ${currentSessionId === session.id ? "bg-tech-neonViolet/10 border-tech-neonViolet/20 text-tech-neonViolet" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <div className="truncate">
                                <div className="text-xs font-medium truncate">Sesión #{session.id}</div>
                                <div className="text-[10px] opacity-60 truncate">{new Date(session.created_at).toLocaleDateString()}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === "docs" && (
                <div className="space-y-1">
                    {documents.map((doc) => (
                        <div key={doc.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-all border border-transparent hover:border-tech-border/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-4 h-4 text-slate-500 group-hover:text-tech-neonViolet transition-colors" />
                                <span className="truncate text-xs text-slate-400 group-hover:text-slate-200 font-medium">{doc.name}</span>
                            </div>
                            
                            {/* ESTADO O BOTÓN DE BORRAR */}
                            {doc.status === 'indexed' ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Evitar clicks accidentales
                                        onDeleteDocument(doc.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-slate-500 hover:text-red-500"
                                    title="Eliminar documento"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <div className={`w-1.5 h-1.5 rounded-full shadow-lg flex-shrink-0 ${doc.status === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                            )}
                        </div>
                    ))}
                    
                    <div className="mt-4">
                        <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" accept=".pdf" />
                        <Button variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="w-full border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-tech-neonViolet hover:border-tech-neonViolet hover:bg-tech-neonViolet/5 transition-all uppercase text-[10px] font-mono tracking-widest h-9">
                            {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Plus className="w-3 h-3 mr-2" />}
                            {isUploading ? "Procesando..." : "Subir PDF"}
                        </Button>
                    </div>
                </div>
            )}

          </ScrollArea>
        </div>
      </aside>
  );
}