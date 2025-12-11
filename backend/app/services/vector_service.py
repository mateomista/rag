import os
import shutil
from fastapi import UploadFile
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class VectorService:
    def __init__(self):
        self.chroma_path = "/chroma_data"
        
        # LÓGICA HÍBRIDA:
        # Si el chat usa Groq (Nube), asumimos que NO hay Ollama disponible.
        # Usamos HuggingFace (CPU) para los embeddings.
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
        
        self.db = Chroma(
            persist_directory=self.chroma_path,
            embedding_function=self.embedding_function
        )

    def get_retriever(self, k=3):
        return self.db.as_retriever(search_kwargs={"k": k})

    async def ingest_pdf(self, file: UploadFile):
        temp_file_path = f"temp_{file.filename}"
        
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            loader = PyPDFLoader(temp_file_path)
            docs = loader.load()

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=100
            )
            chunks = text_splitter.split_documents(docs)

            self.db.add_documents(chunks)
            
            return len(chunks)

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def delete_file_from_chroma(self, filename: str):
        try:
            source_id = f"temp_{filename}"
            self.db._collection.delete(where={"source": source_id})
            return True
        except Exception as e:
            print(f"Error borrando de Chroma: {e}")
            return False