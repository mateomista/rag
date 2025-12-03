from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RAG Backend")

# Configurar CORS (para que el Frontend pueda hablar con el Backend)
# En producción, cambia allow_origins por la URL real de tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend de IA funcionando 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}