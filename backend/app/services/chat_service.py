import os
from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from app.services.vector_service import VectorService

class ChatService:
    def __init__(self):
        self.vector_service = VectorService()
        
        # 1. CONFIGURACIÓN DEL MODELO (Híbrido Nube/Local)
        provider = os.getenv("LLM_PROVIDER", "ollama")
        groq_api_key = os.getenv("GROQ_API_KEY")
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

        print(f"🧠 Chat Service: Iniciando en MODO DIRECTO ({provider.upper()})")

        if provider == "groq" and groq_api_key:
            self.llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=groq_api_key,
                temperature=0.3
            )
        else:
            self.llm = ChatOllama(
                model="llama3.2",
                base_url=ollama_url,
                temperature=0.3
            )

        # 2. PROMPT UNIFICADO CON MEMORIA

        qa_system_prompt = """Eres Nexus AI, un asistente experto.
        
        INSTRUCCIONES:
        1. Tu fuente principal de verdad es el CONTEXTO RECUPERADO.
        2. Usa el HISTORIAL DE CHAT para entender a qué se refieren pronombres como "él", "eso", "el documento".
        3. Si la respuesta no está en el contexto, di que no lo sabes.
        
        CONTEXTO RECUPERADO:
        {context}"""
        
        self.qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"), 
            ("human", "{input}"),
        ])

    def generate_rag_response(self, message: str, history: list):
        
        # A. Preparar historial (Formato LangChain)
        chat_history = []
        for msg in history:
            if msg.role == "user":
                chat_history.append(HumanMessage(content=msg.content))
            elif msg.role == "ai":
                chat_history.append(AIMessage(content=msg.content))

        # B. BÚSQUEDA DIRECTA (Sin reformular)
        
        print(f"🔍 Buscando: {message}")
        retriever = self.vector_service.get_retriever(k=3)
        docs = retriever.invoke(message)

        # C. Extraer Fuentes y Contexto
        sources = []
        context_text = ""
        if docs:
            sources = list(set([doc.metadata.get("source", "Desconocido") for doc in docs]))
            context_text = "\n\n".join([doc.page_content for doc in docs])
        
        # D. Generación con Memoria

        rag_chain = self.qa_prompt | self.llm | StrOutputParser()

        token_generator = rag_chain.stream({
            "context": context_text,
            "chat_history": chat_history,
            "input": message
        })

        return token_generator, sources