from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.services.history_service import HistoryService 
from typing import List

router = APIRouter()
chat_service = ChatService()
history_service = HistoryService() 

@router.post("/message", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Gestión de Sesión
        current_session_id = request.session_id
        if not current_session_id:
            # Si no viene ID, creamos una sesión nueva en la DB
            current_session_id = history_service.create_session()
            print(f"🆕 Nueva sesión creada: {current_session_id}")

        # 2. Recuperar historial real de la DB
        db_history = history_service.get_chat_history(current_session_id)
        
        # 3. Guardar el mensaje del usuario ANTES de procesar
        history_service.add_message(current_session_id, "user", request.message)

        # 4. Generar respuesta (pasándole el historial de la DB)
        response_text, sources = chat_service.generate_rag_response(
            request.message, 
            db_history
        )

        # 5. Guardar la respuesta de la IA
        history_service.add_message(current_session_id, "ai", response_text)

        return ChatResponse(
            response=response_text,
            sources=sources,
            session_id=current_session_id # Devolvemos el ID al front
        )

    except Exception as e:
        print(f"Error: {e}")
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