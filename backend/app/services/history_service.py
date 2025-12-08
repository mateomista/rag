from sqlmodel import Session, select
from app.models.sql import ChatSession, ChatMessage, UploadedDocument
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
        
    def get_all_sessions(self):
        """Devuelve todas las sesiones ordenadas por la más reciente"""
        with Session(engine) as session:
            # Ordenamos por ID descendente (la última creada primero)
            statement = select(ChatSession).order_by(ChatSession.id.desc())
            results = session.exec(statement).all()
            return results
        
    def add_document(self, filename: str):
        """Registra un documento en la base de datos SQL"""
        with Session(engine) as session:
            doc = UploadedDocument(filename=filename)
            session.add(doc)
            session.commit()
            session.refresh(doc)
            return doc

    def get_all_documents(self):
        """Recupera la lista de documentos subidos"""
        with Session(engine) as session:
            statement = select(UploadedDocument).order_by(UploadedDocument.created_at.desc())
            results = session.exec(statement).all()
            return results
    
    def delete_document_record(self, filename: str):
        """Borra el registro del documento de la DB SQL"""
        with Session(engine) as session:
            statement = select(UploadedDocument).where(UploadedDocument.filename == filename)
            results = session.exec(statement).all()
            
            for doc in results:
                session.delete(doc)
            
            session.commit()
            return True