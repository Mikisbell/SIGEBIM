# ARCHITECTURE.md - Arquitectura del Sistema

## 1. Esquema Lógico General
El sistema utiliza una arquitectura híbrida moderna, separando la interfaz de usuario ligera del procesamiento pesado de ingeniería.

### Frontend (Cliente Web)
- **Framework:** Next.js 14 (App Router).
- **UI Library:** Shadcn/UI + Tailwind CSS (Diseño "Ingeniería de Precisión").
- **Hosting:** Vercel (Edge Network).
- **Responsabilidad:** Gestión de usuarios, dashboards, subida de archivos, visualización de reportes.

### Backend (Servicios Gestionados)
- **Auth:** Supabase Auth (Email/Password, Google).
- **Database:** Supabase PostgreSQL.
- **Storage:** Supabase Storage (Buckets privados para .DWG/.DXF/.IFC).

### Core de Procesamiento (El "Cerebro")
- **Motor:** Python 3.11+.
- **Framework API:** FastAPI (para comunicación interna y health checks).
- **Librerías Clave:** `ezdxf` (CAD), `pandas` (Data), `IfcOpenShell` (BIM - Futuro).
- **Despliegue:** Docker Container en Google Cloud Run (Serverless) o Hugging Face Spaces.
- **Flujo de Ejecución:** Asíncrono / On-Demand.

## 2. Flujo de Datos Principal (Pipeline de Auditoría)
1. **Upload:** El Usuario sube un archivo `.DXF` desde el Frontend directamente a Supabase Storage.
2. **Trigger:** El Frontend notifica al Backend Python (vía API REST) con la ruta del archivo (`file_path`).
3. **Download:** El Backend Python descarga el archivo desde Supabase Storage usando una Service Key segura.
4. **Processing:**
   - El script Python abre el archivo en memoria.
   - Ejecuta las reglas de validación (ej. verificar nombres de capas, colores, bloques requeridos).
   - Genera un reporte de resultados (JSON).
5. **Persistence:** El Backend guarda el reporte JSON en la base de datos `audit_results`.
6. **Notification:** El Backend responde al Frontend (o actualiza el estado en DB) para indicar finalización.
7. **Display:** El Frontend lee el reporte de la DB y lo renderiza en una tabla interactiva.

## 3. Decisiones de Diseño Críticas
- **No procesar en Next.js:** Los archivos CAD son pesados y requieren librerías de sistema que no corren en Vercel Edge/Serverless functions estándar. Python es el líder indiscutible en ingeniería.
- **Almacenamiento Separado:** La base de datos solo guarda metadatos y rutas. Los binarios CAD van siempre a Object Storage (S3/Supabase Storage).
- **Stateless Workers:** El contenedor de Python no guarda estado. Procesa y muere (o escala a cero).
