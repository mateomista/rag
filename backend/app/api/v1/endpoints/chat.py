import os
from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

router = APIRouter()

# 1. CONFIGURACIÓN
CHROMA_PATH = "/chroma_data" 

# El Modelo de Chat 
llm = ChatOllama(
    model="llama3.2",
    base_url="http://host.docker.internal:11434",
    temperature=0.3 # Bajamos la temperatura para que sea más fiel al documento
)

# El Modelo de Embeddings 
embedding_function = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://host.docker.internal:11434"
)

# 2. CONEXIÓN A LA BASE DE DATOS
vector_db = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embedding_function
)

# 3. PROMPT RAG
rag_template = """
Eres un asistente experto. Usa EXCLUSIVAMENTE el siguiente contexto recuperado para responder la pregunta del usuario.
Si la respuesta no está en el contexto, di "No encuentro esa información en los documentos proporcionados".
No inventes nada.

CONTEXTO RECUPERADO:
{context}

PREGUNTA DEL USUARIO:
{question}
"""

prompt = ChatPromptTemplate.from_template(rag_template)
retriever = vector_db.as_retriever(search_kwargs={"k": 3}) # Traer los 3 trozos más relevantes

@router.post("/message", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    user_msg = request.message
    print(f"📥 Pregunta: {user_msg}")

    try:
        # A. Recuperar documentos relevantes manualmente para ver las fuentes
        docs = retriever.invoke(user_msg)
        
        # Si no hay documentos en la base de datos o no hay coincidencias
        if not docs:
            print("⚠️ No se encontró contexto relevante.")
            sources = []
            context_text = ""
        else:
            print(f"📚 Contexto encontrado: {len(docs)} fragmentos")
            # Extraer nombres de archivos para mostrar al usuario
            sources = list(set([doc.metadata.get("source", "Desconocido") for doc in docs]))
            # Unir el texto de los documentos
            context_text = "\n\n".join([doc.page_content for doc in docs])

        # B. Preparar la cadena de pensamiento (Chain)
        # Llenamos el template con el contexto y la pregunta
        chain = prompt | llm | StrOutputParser()
        
        # C. Generar respuesta
        response_text = chain.invoke({
            "context": context_text,
            "question": user_msg
        })

        return ChatResponse(
            response=response_text,
            sources=sources # el frontend recibe los nombres de los PDFs usados
        )

    except Exception as e:
        print(f"❌ Error RAG: {str(e)}")
        return ChatResponse(
            response="Lo siento, ocurrió un error al consultar la memoria vectorial.",
            sources=["Error"]
        )