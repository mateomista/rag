from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.services.history_service import HistoryService 
from typing import List
import json
from fastapi.responses import StreamingResponse

router = APIRouter()
chat_service = ChatService()
history_service = HistoryService() 

@router.post("/message") 
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Gestión de Sesión
        current_session_id = request.session_id
        if not current_session_id:
            current_session_id = history_service.create_session()

        db_history = history_service.get_chat_history(current_session_id)
        
        # 2. Guardar mensaje del usuario
        history_service.add_message(current_session_id, "user", request.message)

        # 3. Obtener el generador del servicio
        token_generator, sources = chat_service.generate_rag_response(
            request.message, 
            db_history
        )

        # 4. DEFINIR EL GENERADOR DE STREAMING
        async def stream_response():
            full_response = ""
            
            # A. Enviar tokens de texto uno por uno
            for token in token_generator:
                full_response += token
                # Formato NDJSON
                data = json.dumps({"type": "content", "data": token})
                yield data + "\n"
            
            # B. Al terminar, guardar en la base de datos
            history_service.add_message(current_session_id, "ai", full_response)
            
            # C. Enviar metadatos al final (Fuentes y ID de sesión)
            meta_data = json.dumps({
                "type": "meta", 
                "sources": sources, 
                "session_id": current_session_id
            })
            yield meta_data + "\n"

        # 5. Devolver la respuesta en streaming
        return StreamingResponse(stream_response(), media_type="application/x-ndjson")

    except Exception as e:
        print(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/history/{session_id}")
async def get_history(session_id: int):
    try:
        # 1. Recuperar mensajes de la DB
        raw_messages = history_service.get_chat_history(session_id)
        
        # 2. Formatear para el Frontend (JSON limpio)
        frontend_history = []
        for msg in raw_messages:
            frontend_history.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.strftime("%I:%M %p"), # Formato "09:00 AM"
                "sources": [] 
            })
            
        return frontend_history
    except Exception as e:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
@router.get("/sessions")
async def get_sessions():
    try:
        sessions = history_service.get_all_sessions()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))