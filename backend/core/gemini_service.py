"""
SIGEBIM AI Chat Service - Gemini Integration
Restricted to CAD/BIM/Construction topics only.
"""

import os
import google.generativeai as genai
from loguru import logger
from typing import Dict, Any, Optional

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# System prompt that restricts Gemini to CAD/BIM topics
SYSTEM_PROMPT = """Eres un asistente experto en ingeniería CAD/BIM llamado "SIGEBIM Assistant".
Tu especialidad es analizar archivos DXF, planos de construcción, y normas de edificación.

REGLAS ESTRICTAS:
1. SOLO responde preguntas sobre:
   - Archivos DXF/DWG/IFC y sus componentes (capas, entidades, bloques)
   - Planos de construcción y arquitectura
   - Normas de construcción (E.060, E.030, ACI, etc.)
   - Validación de diseños estructurales
   - Metrados y presupuestos de construcción
   - Materiales de construcción
   
2. Si el usuario pregunta algo NO relacionado con construcción/CAD/BIM, responde EXACTAMENTE:
   "🔒 Solo puedo ayudarte con temas de planos, construcción y archivos CAD. 
   ¿Tienes alguna pregunta sobre tu proyecto o archivo DXF?"

3. Cuando analices datos de un archivo DXF, sé específico y técnico.

4. Responde siempre en español.

5. Sé conciso pero completo. Usa bullet points cuando sea apropiado.

6. Si no tienes datos suficientes para responder, pide más información sobre el archivo.
"""

# Model configuration
MODEL_NAME = "gemini-1.5-flash"


async def chat_with_gemini(
    user_message: str,
    file_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[list] = None
) -> str:
    """
    Send a message to Gemini with optional file context.
    
    Args:
        user_message: The user's question
        file_context: Optional DXF file data (layers, entities, etc)
        conversation_history: Previous messages in the conversation
    
    Returns:
        Gemini's response text
    """
    if not GEMINI_API_KEY:
        return "❌ Error: API de Gemini no configurada. Contacta al administrador."
    
    try:
        # Build context message
        context_parts = [SYSTEM_PROMPT]
        
        if file_context:
            context_parts.append(f"""
DATOS DEL ARCHIVO DXF ACTUAL:
- Versión: {file_context.get('version', 'No disponible')}
- Total de capas: {file_context.get('total_layers', 0)}
- Total de entidades: {file_context.get('entities', 0)}
- Score de auditoría: {file_context.get('score', 'No auditado')}/100

CAPAS DETECTADAS:
{format_layers(file_context.get('layers', []))}

PROBLEMAS ENCONTRADOS:
{format_issues(file_context.get('details', []))}
""")
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction="\n".join(context_parts)
        )
        
        # Create chat session
        chat = model.start_chat(history=conversation_history or [])
        
        # Send message
        response = chat.send_message(user_message)
        
        logger.info(f"Gemini response received. Length: {len(response.text)}")
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return f"❌ Error al procesar tu pregunta: {str(e)}"


def format_layers(layers: list) -> str:
    """Format layer data for context."""
    if not layers:
        return "No hay datos de capas disponibles."
    
    lines = []
    for layer in layers:
        color_name = get_color_name(layer.get('color', 0))
        lines.append(f"  - {layer.get('name', 'Sin nombre')}: Color {layer.get('color', 0)} ({color_name}), Tipo: {layer.get('linetype', 'Continuous')}")
    return "\n".join(lines)


def format_issues(details: list) -> str:
    """Format audit issues for context."""
    if not details:
        return "No se encontraron problemas."
    
    lines = []
    for issue in details:
        severity_icon = "🔴" if issue.get('severity') == 'fail' else "🟡"
        lines.append(f"  {severity_icon} {issue.get('code', 'UNKNOWN')}: {issue.get('message', 'Sin descripción')}")
    return "\n".join(lines)


def get_color_name(color_index: int) -> str:
    """Convert AutoCAD color index to name."""
    colors = {
        0: "ByBlock",
        1: "Rojo",
        2: "Amarillo",
        3: "Verde",
        4: "Cian",
        5: "Azul",
        6: "Magenta",
        7: "Blanco/Negro",
        256: "ByLayer"
    }
    return colors.get(color_index, f"Color {color_index}")
