from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import chat, documents
from app.core.database import create_db_and_tables

create_db_and_tables()

app = FastAPI(title="Nexus RAG Backend")

# Configurar CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar la ruta del chat
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Nexus Brain Online 🟢"}