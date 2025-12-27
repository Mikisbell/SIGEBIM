# SYSTEM_REQUIREMENTS.md - Especificaciones Técnicas "Nivel Dios"

## 1. Seguridad y Gobierno de Datos (La Muralla)

### 1.1. Aislamiento Multi-Tenant (RLS)
El sistema debe garantizar matemáticamente que ningún usuario pueda acceder a datos de otra organización.
- **Mecanismo:** PostgreSQL Row Level Security (RLS).
- **Entidad Crítica:** `organization_members`.
- **Regla Global:** `SELECT * FROM table WHERE organization_id IN (my_org_ids)`.

### 1.2. Seguridad de Archivos (Storage)
- **Bucket:** Privado (`files_bucket`).
- **Acceso:** Limitado estrictamente a Signed URLs temporales (TTL 60s).
- **Prohibido:** URLs públicas permanentes.

## 2. Contrato de Comunicación (API Contract)

### 2.1. Trigger de Auditoría (Frontend -> Backend)
**Endpoint:** `POST /api/v1/audit` (Internal / Edge Function wrapper)
**Header:** `Authorization: Bearer <SERVICE_KEY>`

**Request Payload:**
```json
{
  "file_id": "uuid-v4",
  "file_url": "https://supabase.../signed-url.dxf?token=...",
  "audit_rules_id": "uuid-v4 (optional)"
}
```

**Response (Sync Acknowledgement):**
```json
{
  "job_id": "uuid-v4",
  "status": "queued",
  "estimated_time_ms": 15000
}
```

### 2.2. Persistencia de Resultados (Backend -> DB)
El backend no devuelve el resultado en la respuesta HTTP. Lo escribe en la BD.

**Target Table:** `audit_results`
**Payload Structure (JSONB):**
```json
{
  "summary": {
    "total_layers": 15,
    "errors": 2,
    "score": 85
  },
  "details": [
    {
      "code": "LAYER_NAMING",
      "severity": "error", // error, warning, info
      "message": "Capa 'Muro-01' no cumple estándar ISO.",
      "location": "Handle ID: 3A4F"
    }
  ]
}
```

## 3. Requisitos de Ingeniería (Motor CAD)

### 3.1. Soporte de Formatos
- **MVP Intent:** Solo `.DXF` (ASCII/Binary).
- **Versiones:** R12 a R2018 (AC1009 - AC1032).
- **Legacy DWG:** Si no es DXF, rechazar en MVP. (Futuro: ODA File Converter).

### 3.2. Límites de Recursos (Container)
- **Memoria:** Mínimo 2GB RAM garantizados (Large parsing ops).
- **Timeout:** 300 segundos (5 minutos) hard limit.
- **Concurrency:** 1 request por contenedor (inicialmente) para evitar OOM.

## 4. Estándares de Código SQL
- **Identificadores:** `snake_case`.
- **Primary Keys:** `UUID` (v4).
- **Foreign Keys:** Siempre con constraints explícitos.
- **Timestamps:** `created_at`, `updated_at` (con triggers).
