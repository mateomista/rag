from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    title: str = "Nueva Conversación"
    
    # Relación: Una sesión tiene muchos mensajes
    messages: List["ChatMessage"] = Relationship(back_populates="session")

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    role: str # "user" o "ai"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Relación: Un mensaje pertenece a una sesión
    session_id: int = Field(foreign_key="chatsession.id")
    session: ChatSession = Relationship(back_populates="messages")