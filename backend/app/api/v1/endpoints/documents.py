from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.vector_service import VectorService

router = APIRouter()

# Instanciamos el servicio 
vector_service = VectorService()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Delegamos todo el trabajo al servicio
        chunks_count = await vector_service.ingest_pdf(file)
        
        return {
            "status": "success", 
            "filename": file.filename, 
            "chunks_created": chunks_count,
            "message": "Documento indexado correctamente 🧠"
        }
    except Exception as e:
        # Manejo de errores limpio
        print(f"Error al cargar: {e}")
        raise HTTPException(status_code=500, detail=str(e))