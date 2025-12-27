from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
import uvicorn
import os

from core.audit_engine import process_cad_file, process_cad_file_sync

# Initialize App
app = FastAPI(
    title="SIGEBIM Core Engine",
    description="Microservicio de Auditoría CAD/BIM",
    version="0.1.0"
)

# CORS - Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AuditRequest(BaseModel):
    file_id: str
    file_url: str
    audit_rules_id: str | None = None

class AuditResponse(BaseModel):
    job_id: str
    status: str
    estimated_time: str

class SyncAuditRequest(BaseModel):
    file_url: str

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sigebim-core"}

# Async Audit Endpoint (Background)
@app.post("/api/v1/audit", response_model=AuditResponse)
async def trigger_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    logger.info(f"Recibida solicitud de auditoría para archivo: {request.file_id}")
    
    if not request.file_url:
        raise HTTPException(status_code=400, detail="file_url is required")

    background_tasks.add_task(process_cad_file, request.file_id, request.file_url)

    return {
        "job_id": f"job-{request.file_id}",
        "status": "queued",
        "estimated_time": "15s"
    }

# Sync Audit Endpoint (Immediate Response)
@app.post("/api/v1/audit/sync")
async def sync_audit(request: SyncAuditRequest):
    """
    Synchronous audit - downloads file, processes, returns results immediately.
    Use for smaller files or when immediate feedback is needed.
    """
    logger.info(f"Sync audit requested for: {request.file_url}")
    
    try:
        result = await process_cad_file_sync(request.file_url)
        return result
    except Exception as e:
        logger.error(f"Sync audit failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GEMINI AI CHAT
# ============================================================================
from core.gemini_service import chat_with_gemini
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    file_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    success: bool

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI Chat endpoint - restricted to CAD/BIM/Construction topics only.
    Optionally accepts file context for more relevant responses.
    """
    logger.info(f"Chat request: {request.message[:50]}...")
    
    try:
        response = await chat_with_gemini(
            user_message=request.message,
            file_context=request.file_context
        )
        return {"response": response, "success": True}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return {"response": f"Error: {str(e)}", "success": False}


# ============================================================================
# R2 STORAGE (Cloudflare)
# ============================================================================
from core.r2_storage import generate_upload_url, generate_download_url, delete_file

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str = 'application/octet-stream'

class UploadUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    success: bool

@app.post("/api/v1/storage/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(request: UploadUrlRequest):
    """
    Generate a presigned URL for direct browser upload to R2.
    Frontend can PUT the file directly to this URL.
    """
    logger.info(f"Generating upload URL for: {request.filename}")
    
    result = await generate_upload_url(request.filename, request.content_type)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")
    
    return {
        "upload_url": result["upload_url"],
        "file_key": result["file_key"],
        "success": True
    }


class DownloadUrlRequest(BaseModel):
    file_key: str

@app.post("/api/v1/storage/download-url")
async def get_download_url(request: DownloadUrlRequest):
    """
    Generate a presigned URL for downloading a file from R2.
    """
    url = await generate_download_url(request.file_key)
    
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate download URL")
    
    return {"download_url": url, "success": True}


@app.delete("/api/v1/storage/{file_key:path}")
async def delete_storage_file(file_key: str):
    """
    Delete a file from R2 storage.
    """
    success = await delete_file(file_key)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file")
    
    return {"success": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
