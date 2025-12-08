import os
import shutil
from fastapi import UploadFile
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class VectorService:
    
    def __init__(self):
        # Configuración centralizada
        self.chroma_path = "/chroma_data"
        self.embedding_model = "nomic-embed-text"
        self.ollama_url = "http://host.docker.internal:11434"
        
        # Inicializamos los embeddings una sola vez
        self.embedding_function = OllamaEmbeddings(
            model=self.embedding_model,
            base_url=self.ollama_url
        )
        
        # Conexión a la DB
        self.db = Chroma(
            persist_directory=self.chroma_path,
            embedding_function=self.embedding_function
        )

    def get_retriever(self, k=3):
        """Devuelve la herramienta para buscar los 'k' fragmentos más parecidos"""
        return self.db.as_retriever(search_kwargs={"k": k})

    async def ingest_pdf(self, file: UploadFile):
        """Lógica completa de ingestión: Guardar -> Cargar -> Partir -> Vectorizar"""
        temp_file_path = f"temp_{file.filename}"
        
        try:
            # 1. Guardar archivo temporal
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # 2. Leer PDF
            loader = PyPDFLoader(temp_file_path)
            docs = loader.load()

            # 3. Dividir en trozos (Chunks)
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=100
            )
            chunks = text_splitter.split_documents(docs)

            # 4. Guardar en Chroma (Vectorizar)
            # add_documents agrega a lo que ya existe
            self.db.add_documents(chunks)
            
            return len(chunks)

        finally:
            # Siempre borrar el archivo temporal, incluso si falla
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    def delete_file_from_chroma(self, filename: str):
        """Elimina los vectores asociados a un archivo específico"""
        try:
            # Reconstruimos el nombre de la fuente tal como se guardó (temp_nombre.pdf)
            # Nota: PyPDFLoader guarda la ruta relativa como 'source'
            source_id = f"temp_{filename}"
            
            # Accedemos a la colección cruda para borrar por metadatos (where clause)
            self.db._collection.delete(where={"source": source_id})
            print(f"🗑️ Vectores eliminados para: {source_id}")
            return True
        except Exception as e:
            print(f"Error borrando de Chroma: {e}")
            return False