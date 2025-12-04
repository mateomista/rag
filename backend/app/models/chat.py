from pydantic import BaseModel
from typing import List, Optional

# Lo que se recibe del Frontend
class ChatRequest(BaseModel):
    message: str

# Lo que se responde
class ChatResponse(BaseModel):
    response: str
    sources: List[str] = [] # Nombres de PDFs