import os
import shutil
from fastapi import UploadFile
from langchain_community.vectorstores import FAISS  # <--- CAMBIO IMPORTANTE
from langchain_ollama import OllamaEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class VectorService:
    def __init__(self):
        self.faiss_path = "faiss_index"  
        
        # --- LÓGICA HÍBRIDA ---
        provider = os.getenv("LLM_PROVIDER", "ollama")
        
        if provider == "groq":
            print("Embeddings: Modo Nube (HuggingFace CPU)")
            self.embedding_function = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2" 
            )
        else:
            print("Embeddings: Modo Local (Ollama)")
            self.embedding_function = OllamaEmbeddings(
                model="nomic-embed-text",
                base_url=os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
            )
        
        # --- INICIALIZACIÓN DE FAISS --
        if os.path.exists(self.faiss_path):
            try:
                self.db = FAISS.load_local(
                    self.faiss_path, 
                    self.embedding_function,
                    allow_dangerous_deserialization=True
                )
                print("Índice FAISS cargado correctamente desde disco.")
            except Exception as e:
                print(f"Error cargando FAISS, se iniciará uno nuevo: {e}")
                self.db = None
        else:
            print("No se encontró índice FAISS previo. Se creará uno nuevo al ingerir documentos.")
            self.db = None

    def get_retriever(self, k=3):
        # Si en RAM está vacío, intentamos rescatarlo del disco duro
        if self.db is None:
            if os.path.exists(self.faiss_path):
                print("Recuperando FAISS desde el disco duro para el chat...")
                self.db = FAISS.load_local(
                    self.faiss_path, 
                    self.embedding_function,
                    allow_dangerous_deserialization=True
                )
            else:
                print("Definitivamente no hay índice en disco. Retornando None.")
                return None
                
        return self.db.as_retriever(search_kwargs={"k": k})

    async def ingest_pdf(self, file: UploadFile):
        temp_file_path = f"temp_{file.filename}"
        
        try:
            # 1. Guardar archivo temporal
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # 2. Cargar y procesar PDF
            loader = PyPDFLoader(temp_file_path)
            docs = loader.load()

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=100
            )
            chunks = text_splitter.split_documents(docs)

            # 3. AGREGAR A FAISS
            if self.db is None:
                # Si es el primer documento, CREAMOS el índice
                self.db = FAISS.from_documents(chunks, self.embedding_function)
            else:
                # Si ya existe, AGREGAMOS al índice
                self.db.add_documents(chunks)
            
            self.db.save_local(self.faiss_path)
            
            return len(chunks)

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def delete_file_from_chroma(self, filename: str):

        return False