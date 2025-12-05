from sqlmodel import Session, select
from app.models.sql import ChatSession, ChatMessage
from app.core.database import engine

class HistoryService:
    def create_session(self):
        """Crea una nueva conversación vacía"""
        with Session(engine) as session:
            new_session = ChatSession()
            session.add(new_session)
            session.commit()
            session.refresh(new_session)
            return new_session.id

    def add_message(self, session_id: int, role: str, content: str):
        """Guarda un mensaje en la base de datos"""
        with Session(engine) as session:
            msg = ChatMessage(session_id=session_id, role=role, content=content)
            session.add(msg)
            session.commit()

    def get_chat_history(self, session_id: int):
        """Recupera los mensajes crudos de la DB"""
        with Session(engine) as session:
            statement = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp)
            results = session.exec(statement).all()
            return results # Devolvemos la lista de objetos SQLModel directos