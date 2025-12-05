import React, { useRef } from "react";
import { Terminal, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type DocStatus = "indexed" | "processing" | "error";
export type DocumentItem = { id: number; name: string; status: DocStatus };

interface ChatSidebarProps {
  documents: DocumentItem[];
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ChatSidebar({ documents, isUploading, onUpload }: ChatSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
          <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" accept=".pdf" />
          <Button 
            variant="outline" 
            disabled={isUploading} 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full border-dashed border-slate-700 bg-transparent text-slate-400 hover:text-tech-neonViolet hover:border-tech-neonViolet hover:bg-tech-neonViolet/5 transition-all uppercase text-[10px] font-mono tracking-widest h-9"
          >
              {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Plus className="w-3 h-3 mr-2" />}
              {isUploading ? "Procesando..." : "Ingestar Data"}
          </Button>
        </div>
      </aside>
  );
}