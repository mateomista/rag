from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains.history_aware_retriever import create_history_aware_retriever
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

from app.services.vector_service import VectorService

class ChatService:
    def __init__(self):
        # 1. Configuración del LLM
        self.llm = ChatOllama(
            model="llama3.2",
            base_url="http://host.docker.internal:11434",
            temperature=0.3
        )
        self.vector_service = VectorService()

        # 2. PROMPT DE CONTEXTUALIZACIÓN
        contextualize_q_system_prompt = """Dado un historial de chat y la última pregunta del usuario 
        (que podría hacer referencia al contexto del historial), formula una pregunta independiente 
        que pueda entenderse sin el historial. NO respondas a la pregunta, solo reformúlala si es necesario 
        o devuélvela tal cual si ya es clara."""
        
        self.contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        # 3. PROMPT DE RESPUESTA (QA)
        qa_system_prompt = """Eres un asistente experto. 
        Usa los siguientes fragmentos de contexto recuperado para responder la pregunta. 
        Si no sabes la respuesta, di simplemente que no lo sabes. 
        
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

        # B. Crear Retriever con Historial
        retriever = self.vector_service.get_retriever(k=3)
        history_aware_retriever = create_history_aware_retriever(
            self.llm, retriever, self.contextualize_q_prompt
        )

        # C. Crear Cadena de Documentos
        question_answer_chain = create_stuff_documents_chain(self.llm, self.qa_prompt)

        # D. Crear Cadena RAG Final
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        # E. Ejecutar
        result = rag_chain.invoke({
            "input": message,
            "chat_history": chat_history
        })
        
        # Extraer fuentes
        sources = []
        if "context" in result:
            sources = list(set([doc.metadata.get("source", "Desconocido") for doc in result["context"]]))

        return result["answer"], sources