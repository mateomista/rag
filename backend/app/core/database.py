from sqlmodel import SQLModel, create_engine, Session

sqlite_file_name = "nexus.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Creamos el motor de conexión
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """Crea las tablas si no existen"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependencia para obtener una sesión de base de datos"""
    with Session(engine) as session:
        yield session