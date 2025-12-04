import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

router = APIRouter()

# 1. Configuración base de datos vectorial
CHROMA_PATH = "/chroma_data" 

# 2. Configuración del Modelo de Embeddings 
embedding_function = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://host.docker.internal:11434"
)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # A. Guardar el archivo temporalmente para poder leerlo
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # B. Leer el PDF
        loader = PyPDFLoader(temp_file_path)
        docs = loader.load()

        # C. Dividir el texto en trozos pequeños (Chunks)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, # 1000 caracteres por trozo
            chunk_overlap=100 # 100 de solapamiento para no cortar frases
        )
        chunks = text_splitter.split_documents(docs)

        # D. Guardar en ChromaDB
        db = Chroma.from_documents(
            documents=chunks,
            embedding=embedding_function,
            persist_directory=CHROMA_PATH
        )
        
        # Limpieza del archivo temporal
        os.remove(temp_file_path)

        return {
            "status": "success", 
            "filename": file.filename, 
            "chunks_created": len(chunks),
            "message": f"Procesado exitosamente. Se crearon {len(chunks)} fragmentos de memoria."
        }

    except Exception as e:
        print(f"Error procesando documento: {e}")
        return {"status": "error", "message": str(e)}