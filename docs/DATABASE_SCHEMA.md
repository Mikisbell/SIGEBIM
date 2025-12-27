# DATABASE_SCHEMA.md - Modelado de Datos

## Entidades Principales

### 1. organizations (Empresas)
Representa al cliente B2B (Constructora, Consultora). Supporta Multi-tenancy.
- `id`: UUID (PK)
- `name`: Text
- `subscription_plan`: Enum ('free', 'pro', 'enterprise')
- `created_at`: Timestamp

### 2. projects (Proyectos/Obras)
Contenedor principal de trabajo.
- `id`: UUID (PK)
- `organization_id`: UUID (FK -> organizations.id)
- `name`: Text (ej. "Hospital Huancayo")
- `code`: Text (ej. "PRJ-2024-001")
- `status`: Enum ('active', 'archived', 'completed')
- `created_at`: Timestamp

### 3. files (Archivos/Planos)
Registro de cada archivo subido. Maneja control de versiones básico.
- `id`: UUID (PK)
- `project_id`: UUID (FK -> projects.id)
- `uploader_id`: UUID (FK -> auth.users.id)
- `filename`: Text (Nombre original)
- `storage_path`: Text (Ruta en Supabase Storage)
- `file_type`: Enum ('dxf', 'dwg', 'ifc')
- `size_bytes`: BigInt
- `version`: Integer (Auto-incremental por proyecto/nombre)
- `upload_status`: Enum ('uploading', 'uploaded', 'processing', 'processed', 'error')
- `created_at`: Timestamp

### 4. audit_results (Resultados de Auditoría)
Almacena el output del procesamiento para no re-procesar innecesariamente.
- `id`: UUID (PK)
- `file_id`: UUID (FK -> files.id)
- `status`: Enum ('pass', 'fail', 'warning')
- `summary`: JSONB (Resumen rápido: { "errors": 5, "warnings": 2 })
- `details`: JSONB (Lista detallada de fallos para renderizar tabla)
    - Ejemplo: `[ { "layer": "Muros", "error": "Color incorrecto", "expected": "Red", "found": "Blue" } ]`
- `processed_at`: Timestamp

*(Futuro)*
### 5. audit_rules (Reglas Configurables)
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `name`: Text (ej. "Norma MTC Carreteras")
- `rules_config`: JSONB (Definición de reglas)
