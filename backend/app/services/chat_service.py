from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.services.vector_service import VectorService

class ChatService:
    def __init__(self):
        # Configuración del LLM
        self.llm = ChatOllama(
            model="llama3.2",
            base_url="http://host.docker.internal:11434",
            temperature=0.3
        )
        
        # Inyectamos el servicio de vectores para poder buscar
        self.vector_service = VectorService()
        
        # El Prompt principal
        self.prompt_template = ChatPromptTemplate.from_template("""
            Eres Nexus AI, un asistente experto y útil.
            Usa EXCLUSIVAMENTE el siguiente contexto recuperado para responder la pregunta del usuario.
            Si la respuesta no está en el contexto, di "No tengo información suficiente en los documentos para responder eso".
            
            CONTEXTO RECUPERADO:
            {context}
            
            PREGUNTA DEL USUARIO:
            {question}
        """)

    def generate_rag_response(self, question: str):
        """Orquesta todo el flujo RAG: Búsqueda -> Prompt -> Generación"""
        
        # 1. Obtener el buscador
        retriever = self.vector_service.get_retriever(k=3)
        
        # 2. Buscar documentos relevantes
        docs = retriever.invoke(question)
        
        # Si no hay coincidencias
        if not docs:
            return "No encontré información relevante en tus documentos.", []

        # 3. Preparar el texto del contexto y las fuentes
        context_text = "\n\n".join([doc.page_content for doc in docs])
        sources = list(set([doc.metadata.get("source", "Desconocido") for doc in docs]))

        # 4. Crear la cadena (Chain) y ejecutarla
        chain = self.prompt_template | self.llm | StrOutputParser()
        response_text = chain.invoke({
            "context": context_text,
            "question": question
        })
        
        return response_text, sources