# ROADMAP - SIGEBIM (Plan de 7 Días)

## Fase 1: Cimientos (Día 1-2)
- [ ] Inicializar repositorio Monorepo (o estructura híbrida).
- [ ] Configurar proyecto en Supabase (Tablas: `projects`, `reports`).
- [ ] **Hito Crítico:** Crear script Python "Hola Mundo CAD" que lea un .DXF y devuelva un JSON con sus capas.
- [ ] Dockerizar el script de Python.

## Fase 2: El Motor de Validación (Día 3)
- [ ] Implementar lógica de validación (ej. detectar capas fuera de norma).
- [ ] Exponer lógica vía API REST (FastAPI).
- [ ] Desplegar Backend en Cloud Run/Hugging Face (Test de conexión).

## Fase 3: La Interfaz de Usuario (Día 4-5)
- [ ] Setup de Next.js con Shadcn/UI.
- [ ] Crear Dashboard de Proyectos.
- [ ] Implementar subida de archivos a Supabase Storage.
- [ ] Conectar botón "Auditar" con la API de Python.
- [ ] Visualizar resultados (Tabla de errores).

## Fase 4: Pulido y Venta (Día 6-7)
- [ ] Grabar video demo con un caso real de fallo.
- [ ] Crear Landing Page simple en el mismo Next.js.
- [ ] Outreach a primeros contactos.
