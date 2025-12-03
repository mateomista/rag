from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
import time

router = APIRouter()

@router.post("/message", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # 1. Recibir el mensaje
    user_msg = request.message
    print(f"📥 Mensaje recibido: {user_msg}") # logs de Docker

    # 2. Simular pensamiento 
    # time.sleep(1) 
    
    # 3. Generar respuesta 
    fake_response = f"Hola, soy el Backend de Python. Recibí tu mensaje: '{user_msg}'."

    # 4. Responder
    return ChatResponse(
        response=fake_response,
        sources=["Sistema Base v1.0"]
    )