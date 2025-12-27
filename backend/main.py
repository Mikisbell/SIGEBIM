from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
import uvicorn
import os

from core.audit_engine import process_cad_file

# Initialize App
app = FastAPI(
    title="SIGEBIM Core Engine",
    description="Microservicio de Auditoría CAD/BIM",
    version="0.1.0"
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

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sigebim-core"}

# Core Endpoint
@app.post("/api/v1/audit", response_model=AuditResponse)
async def trigger_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    logger.info(f"Recibida solicitud de auditoría para archivo: {request.file_id}")
    
    # Validation (Basic)
    if not request.file_url:
        raise HTTPException(status_code=400, detail="file_url is required")

    # Enqueue Job (Simulation of Async Worker)
    # In production, this would push to a Redis Queue (Celery/Bull)
    # For MVP, we use FastAPI BackgroundTasks
    background_tasks.add_task(process_cad_file, request.file_id, request.file_url)

    return {
        "job_id": f"job-{request.file_id}", # Simplification
        "status": "queued",
        "estimated_time": "15s"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
