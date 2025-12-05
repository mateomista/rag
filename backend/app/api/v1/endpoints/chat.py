from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter()

# Instanciamos el servicio
chat_service = ChatService()

@router.post("/message", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Pasamos el mensaje Y el historial al servicio
        response_text, sources = chat_service.generate_rag_response(
            request.message, 
            request.history
        )

        return ChatResponse(
            response=response_text,
            sources=sources
        )
    except Exception as e:
        print(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))