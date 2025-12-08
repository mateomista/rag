from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.vector_service import VectorService
from app.services.history_service import HistoryService

router = APIRouter()
vector_service = VectorService()
history_service = HistoryService() 

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # 1. Procesar Vectorialmente (ChromaDB)
        chunks_count = await vector_service.ingest_pdf(file)
        
        # 2. Registrar en SQL (Para que aparezca en el sidebar)
        history_service.add_document(file.filename)
        
        return {
            "status": "success", 
            "filename": file.filename, 
            "chunks_created": chunks_count,
            "message": "Documento indexado correctamente 🧠"
        }
    except Exception as e:
        print(f"Error en upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_documents():
    try:
        docs = history_service.get_all_documents()
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.delete("/{filename}")
async def delete_document(filename: str):
    try:
        # 1. Borrar de la memoria vectorial 
        vector_success = vector_service.delete_file_from_chroma(filename)
        
        # 2. Borrar del registro visual (SQL)
        db_success = history_service.delete_document_record(filename)
        
        if not vector_success and not db_success:
             raise HTTPException(status_code=404, detail="No se pudo borrar el documento")

        return {
            "status": "success",
            "message": f"Documento '{filename}' eliminado del sistema y de la memoria."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))