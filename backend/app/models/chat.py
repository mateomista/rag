from pydantic import BaseModel
from typing import List, Optional

# Lo que se recibe del Frontend

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    session_id: Optional[int] = None

# Lo que se responde
class ChatResponse(BaseModel):
    response: str
    sources: List[str] = [] # Nombres de PDFs
    session_id: Optional[int] = None