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
        
        # 1. DETECTAR PROVEEDOR (Nube vs Local)
        provider = os.getenv("LLM_PROVIDER", "ollama")
        print(f"🧠 Inicializando Cerebro con: {provider.upper()}")

        if provider == "groq":
            api_key = os.getenv("GROQ_API_KEY")
            # Modelo Creativo (Para responder)
            self.llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=api_key,
                temperature=0
            )
            # Modelo Estricto (Para reformular preguntas)
            self.llm_strict = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=api_key,
                temperature=0
            )
        else:
            # Fallback a Ollama Local
            ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
            # Modelo Creativo
            self.llm = ChatOllama(
                model="llama3.2",
                base_url=ollama_url,
                temperature=0.3
            )
            # Modelo Estricto
            self.llm_strict = ChatOllama(
                model="llama3.2",
                base_url=ollama_url,
                temperature=0
            )

        # 2. PROMPT DE REFORMULACIÓN (Estricto)
        contextualize_q_system_prompt = """
            <task>
            Analyze the chat history and the latest user input.
            Construct a standalone search query that represents the user's intent.
            </task>

            <rules>
            - OUTPUT ONLY THE QUERY STRING.
            - DO NOT ANSWER THE QUESTION.
            - DO NOT ADD "The query is...".
            - IF NO CONTEXT IS NEEDED, RETURN INPUT AS IS.
            </rules>

            Chat History:
            {chat_history}

            Latest Input:
            {input}

            Standalone Query:
            """

        
        self.contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        # 3. PROMPT DE RESPUESTA (QA)
        qa_system_prompt = """Eres Nexus AI. Usa el siguiente contexto para responder.
        Si no sabes, di que no sabes.
        
        CONTEXTO:
        {context}"""
        
        self.qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

    def generate_rag_response(self, message: str, history: list):
        # A. Preparar historial
        chat_history = []
        for msg in history:
            if msg.role == "user":
                chat_history.append(HumanMessage(content=msg.content))
            elif msg.role == "ai":
                chat_history.append(AIMessage(content=msg.content))

        # B. Lógica de Reformulación Inteligente (Usando llm_strict)
        search_query = message
        if chat_history:
            rephrase_chain = self.contextualize_q_prompt | self.llm_strict | StrOutputParser()
            try:
                search_query = rephrase_chain.invoke({
                    "chat_history": chat_history,
                    "input": message
                })
                print(f"🔄 Query reformulada: {search_query}")
            except Exception as e:
                print(f"⚠️ Falló reformulación, usando original: {e}")

        # C. Recuperar Documentos
        retriever = self.vector_service.get_retriever(k=3)
        docs = retriever.invoke(search_query)

        # D. Extraer Fuentes
        sources = []
        context_text = ""
        if docs:
            sources = list(set([doc.metadata.get("source", "Desconocido") for doc in docs]))
            context_text = "\n\n".join([doc.page_content for doc in docs])

        # E. Streaming de Respuesta (Usando llm normal)
        rag_chain = self.qa_prompt | self.llm | StrOutputParser()

        token_generator = rag_chain.stream({
            "context": context_text,
            "chat_history": chat_history,
            "input": message
        })

        return token_generator, sources