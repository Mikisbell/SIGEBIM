import ezdxf
import tempfile
import os
import httpx
from loguru import logger
from datetime import datetime
from typing import Dict, Any

async def process_cad_file_sync(file_url: str) -> Dict[str, Any]:
    """
    Synchronous DXF processing - downloads and processes immediately.
    Returns audit results directly.
    """
    logger.info(f"Starting sync processing for: {file_url}")
    
    try:
        # Special case for testing
        if file_url == 'test' or file_url.startswith('test:'):
            doc = ezdxf.new('R2010')
            msp = doc.modelspace()
            msp.add_line((0, 0), (10, 0), dxfattribs={'layer': 'Muros', 'color': 1})
            msp.add_circle((10, 10), radius=5, dxfattribs={'layer': 'Columnas', 'color': 2})
            msp.add_text("Test", dxfattribs={'layer': 'Texto', 'height': 2.0})
        else:
            # Download real file
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(file_url)
                resp.raise_for_status()
                
                # Save to temp file
                with tempfile.NamedTemporaryFile(suffix='.dxf', delete=False) as f:
                    f.write(resp.content)
                    temp_path = f.name
                
                # Parse DXF
                doc = ezdxf.readfile(temp_path)
                
                # Cleanup
                os.unlink(temp_path)
        
        # Extract data
        stats = {
            "layers": [],
            "entities_count": 0,
            "version": doc.dxfversion
        }

        for layer in doc.layers:
            stats["layers"].append({
                "name": layer.dxf.name,
                "color": layer.dxf.color,
                "linetype": layer.dxf.linetype
            })

        msp = doc.modelspace()
        stats["entities_count"] = len(msp)

        # Build audit report
        audit_report = {
            "summary": {
                "total_layers": len(stats["layers"]),
                "entities": stats["entities_count"],
                "version": stats["version"],
                "score": 100
            },
            "layers": stats["layers"],
            "details": []
        }

        # Apply validation rules
        for layer in stats["layers"]:
            # Rule: Layer 'Muros' should be Red (1)
            if layer["name"] == "Muros" and layer["color"] != 1:
                audit_report["details"].append({
                    "code": "WRONG_COLOR",
                    "severity": "fail",
                    "layer": layer["name"],
                    "message": f"Layer 'Muros' debería ser Rojo (1), encontrado {layer['color']}"
                })
                audit_report["summary"]["score"] -= 20

            # Rule: Layer 'Columnas' should be Yellow (2)
            if layer["name"] == "Columnas" and layer["color"] != 2:
                audit_report["details"].append({
                    "code": "WRONG_COLOR",
                    "severity": "warning",
                    "layer": layer["name"],
                    "message": f"Layer 'Columnas' debería ser Amarillo (2), encontrado {layer['color']}"
                })
                audit_report["summary"]["score"] -= 10

        # Determine overall status
        if audit_report["summary"]["score"] >= 80:
            audit_report["status"] = "pass"
        elif audit_report["summary"]["score"] >= 50:
            audit_report["status"] = "warning"
        else:
            audit_report["status"] = "fail"

        logger.success(f"Sync audit complete. Score: {audit_report['summary']['score']}")
        return audit_report

    except Exception as e:
        logger.error(f"Failed to process file: {str(e)}")
        return {
            "status": "error",
            "summary": {"error": str(e), "score": 0},
            "details": [{"code": "PROCESSING_ERROR", "severity": "fail", "message": str(e)}]
        }


async def process_cad_file(file_id: str, file_url: str):
    """
    Background async processing - for larger files.
    Updates database with results.
    """
    logger.info(f"Starting background processing for Job: {file_id}")
    
    result = await process_cad_file_sync(file_url)
    
    logger.info(f"Background processing complete for {file_id}")
    logger.info(f"Result: {result}")
    
    # TODO: Update Supabase with results
    # supabase.table('audit_results').insert({
    #     'file_id': file_id,
    #     'status': result['status'],
    #     'summary': result['summary'],
    #     'details': result['details']
    # }).execute()

