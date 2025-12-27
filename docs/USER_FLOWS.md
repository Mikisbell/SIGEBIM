# USER_FLOWS.md - Flujos de Usuario

## 1. Onboarding (Primer Uso)
1. **Registro:** Usuario entra a `/register`, ingresa email/password (o Google Auth).
2. **Creación de Organización:**
    - Input: Nombre de la Empresa.
    - Sistema: Crea registro en `organizations` y asocia al usuario como `owner`.
3. **Setup Inicial:** Usuario es redirigido al Dashboard Principal (vacío).

## 2. Core Loop: Auditoría de Planos
1. **Crear Proyecto:**
    - Usuario click en "Nuevo Proyecto".
    - Input: Nombre "Residencial Los Andes".
    - Sistema: Crea row en `projects`.
2. **Subir Archivo:**
    - Usuario entra al Proyecto.
    - Drag & Drop de archivo `.DXF`.
    - Frontend: Sube a Storage -> Crea registro en `files` con status `uploading` -> `uploaded`.
3. **Auditoría (Trigger):**
    - Usuario click en botón "Auditar" (o automático al terminar subida).
    - Estado cambia a `processing`.
    - Backend Python analiza el archivo.
4. **Resultados:**
    - Estado cambia a `processed` (o `error`).
    - Usuario ve una tabla con los hallazgos:
        - "Capa 'Cimientos' cumple norma."
        - "Capa 'Textos' tiene altura incorrecta."

## 3. Exportación
1. **Descarga:** Usuario click en "Exportar Reporte".
2. **Formato:** PDF generado (puede ser simple inicialmente o HTML imprimible) con el resumen de validación y sello de "Conforme/No Conforme".
