# Sistema de Gestión Documental — SUPERVAN S.A.C.

Sistema web full-stack para gestionar el ciclo completo de documentos comerciales. Utiliza Claude Vision API para extraer datos automáticamente de documentos escaneados y los organiza en **expedientes** agrupados por Orden de Compra.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg)](https://tailwindcss.com/)

---

## Características

### OCR con IA
- Extracción automática de datos vía **Claude Sonnet Vision API**
- Soporta PDF, PNG, JPG (hasta 10 MB)
- Aprobación automática si confianza ≥ 98%, validación manual si es menor
- Prompts especializados por tipo de documento (Factura, Guía, OC, RxH)
- Validación matemática de items (cantidad × precio = total)

### Gestión de Expedientes
- Creación automática al subir la primera OC
- Seguimiento de completitud: OC + (Factura o RxH) + Guía de Remisión
- Documentos opcionales: marcar Factura/RxH o Guía como "no requerido" por expediente
- Cierre manual con motivo justificado y reapertura
- Descarga masiva de todos los documentos en ZIP
- Detección de duplicados por número de OC

### Notas de Entrega
- Registro manual de cada visita del proveedor (puede haber múltiples por expediente)
- No afectan la completitud del expediente
- Datos del visitante (nombre + DNI) pre-rellenados desde el documento de identidad registrado
- Generación automática de PDF por cada nota

### Tipos de Documento Soportados

| ID | Tipo | Serie | Notas |
|---|---|---|---|
| 1 | Factura Electrónica | F, B | Con IGV 18% |
| 2 | Guía de Remisión | T, G | Datos de transporte y conductor |
| 3 | Orden de Compra | — | Documento base del expediente |
| 4 | Nota de Entrega | — | Manual, una por visita del proveedor |
| 5 | Documento de Identidad | — | DNI, CE, Pasaporte, CPP |
| 6 | Recibo por Honorarios | E | Sin IGV, con retención IR 8% |

### Diseño Responsive
- Optimizado para móvil, tablet y desktop
- Sidebar colapsable con menú hamburguesa
- Tabs con scroll horizontal en móvil
- Grids adaptativos (1 col móvil → 2–4 cols desktop)
- Accesible desde cualquier dispositivo en la misma red local

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI · SQLAlchemy 2.0 · PostgreSQL 15 · Alembic · ReportLab |
| Frontend | React 19 · Vite · TailwindCSS 4 · React Router v7 · Axios |
| OCR | Claude Vision API (`claude-sonnet-4-20250514`) |
| PDF | ReportLab (generación de Notas de Entrega) |

---

## Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- API Key de Anthropic

---

## Instalación

### 1. Base de datos

```bash
psql -U postgres -c "CREATE DATABASE documentos_db;"
```

### 2. Backend

```bash
cd backend

# Crear y activar entorno virtual (Windows)
python -m venv venv
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

Crear `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/documentos_db
ANTHROPIC_API_KEY=sk-ant-...
UPLOAD_DIR=uploads
OCR_CONFIDENCE_THRESHOLD=80.0
AUTO_APPROVE_CONFIDENCE=98.0
EMPRESA_RUC=20516185211
EMPRESA_RAZON_SOCIAL=SUPERVAN S.A.C.
EMPRESA_DIRECCION=Av. Principal 123, Lima
SECRET_KEY=cambia_esto_en_produccion
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
npm install
```

Crear `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_PREFIX=/api/v1
```

---

## Ejecución

### Desarrollo local

```bash
# Terminal 1 — Backend
cd backend && venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Acceso desde móvil/tablet (misma red WiFi)

```bash
# Backend con acceso de red
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Cambiar en frontend/.env:
VITE_API_BASE_URL=http://192.168.x.x:8000

# Frontend accesible en red
npm run dev -- --host
```

### URLs

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health check | http://localhost:8000/health |

---

## Flujo de trabajo

```
1. Seleccionar empresa (buscar por RUC o nombre)
        ↓
2. Crear nuevo expediente o continuar uno incompleto
        ↓
3. Subir Orden de Compra → el expediente se nombra con el N° de OC
        ↓
4. Subir Factura (o Recibo por Honorarios) y Guía de Remisión
   - Si alguno no aplica → marcarlo como "No requerido"
        ↓
5. Subir Documento de Identidad del proveedor (DNI, CE, etc.)
        ↓
6. Días después llega el proveedor → Crear Nota de Entrega
   - Se pre-rellena con el visitante del DNI registrado
   - Se pueden crear múltiples notas si el proveedor vuelve
        ↓
7. Expediente completo → disponible para descarga ZIP
```

---

## Estructura del proyecto

```
sistema-facturas/
├── backend/
│   ├── app/
│   │   ├── main.py                      # Entry point, CORS, archivos estáticos
│   │   ├── config.py                    # Settings Pydantic (lee .env)
│   │   ├── api/v1/endpoints/
│   │   │   ├── ocr.py                   # Upload + procesamiento OCR por tipo
│   │   │   ├── expedientes.py           # CRUD + completitud + exenciones + ZIP
│   │   │   ├── notas_entrega.py         # CRUD + generación PDF
│   │   │   ├── documentos_identidad.py  # OCR de identidad + CRUD
│   │   │   ├── guias_remision.py
│   │   │   ├── empresas.py
│   │   │   └── tipos_documento.py
│   │   ├── core/ocr/
│   │   │   ├── claude_extractor.py      # Prompts y llamadas a Claude Vision
│   │   │   ├── parser.py                # Parseo de respuestas OCR
│   │   │   └── ocr_identidad.py
│   │   ├── db/
│   │   │   ├── models/                  # Modelos SQLAlchemy
│   │   │   └── session.py
│   │   └── schemas/                     # Schemas Pydantic
│   ├── uploads/                         # Archivos subidos (gitignored)
│   │   ├── facturas/
│   │   ├── guias_remision/
│   │   ├── ordenes_compra/
│   │   ├── notas_entrega/
│   │   ├── documentos_identidad/
│   │   └── recibos_honorarios/
│   ├── alembic/                         # Migraciones de base de datos
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    └── src/
        ├── App.jsx                      # Rutas React Router
        ├── pages/
        │   ├── Upload.jsx               # Subida con selector de tipo por colores
        │   ├── VerExpediente.jsx        # Detalle completo del expediente
        │   ├── ListaExpedientes.jsx
        │   ├── ListaDocumentos.jsx
        │   ├── ListaNotasEntrega.jsx
        │   ├── ValidarFactura.jsx
        │   ├── ValidarGuiaRemision.jsx
        │   └── ValidarOrdenCompra.jsx
        ├── components/
        │   ├── common/                  # Badge, Button, Card, Input, Modal...
        │   ├── layout/                  # Layout, Header, Sidebar
        │   └── NotaEntregaForm.jsx      # Formulario con auto-fill de visitante
        ├── services/                    # Un archivo por dominio (Axios)
        └── utils/
            ├── constants.js             # Enums: TIPOS_DOCUMENTO, ESTADOS, etc.
            └── formatters.js            # Fechas, monedas
```

---

## API — Endpoints principales

### OCR / Upload
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/ocr/procesar` | Procesa un documento con Claude Vision |
| `DELETE` | `/api/v1/ocr/documentos/{id}` | Elimina un documento |

### Expedientes
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/expedientes` | Listar con filtros (fecha, estado, empresa) |
| `GET` | `/api/v1/expedientes/{id}` | Detalle completo |
| `POST` | `/api/v1/expedientes/crear-temporal` | Crear expediente vacío |
| `POST` | `/api/v1/expedientes/{id}/asociar-documento/{doc_id}` | Asociar documento |
| `POST` | `/api/v1/expedientes/{id}/verificar-completitud` | Actualizar estado |
| `POST` | `/api/v1/expedientes/{id}/exentar` | Marcar tipo como no requerido |
| `POST` | `/api/v1/expedientes/{id}/cerrar` | Cierre manual con motivo |
| `POST` | `/api/v1/expedientes/{id}/reabrir` | Reabrir expediente cerrado |
| `GET` | `/api/v1/expedientes/{id}/descargar-zip` | Descargar todos los archivos |
| `GET` | `/api/v1/expedientes/verificar-oc/{numero}` | Verificar si OC ya existe |

### Notas de Entrega
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/notas-entrega` | Listar notas |
| `POST` | `/api/v1/notas-entrega` | Crear nota + generar PDF |
| `PUT` | `/api/v1/notas-entrega/{id}` | Actualizar nota |

### Empresas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/empresas/buscar` | Buscar por RUC o nombre |
| `GET` | `/api/v1/empresas/{id}` | Obtener empresa |

### Documentos de Identidad
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/documentos-identidad/procesar` | OCR de documento de identidad |
| `PUT` | `/api/v1/documentos-identidad/{id}` | Actualizar datos |

---

## Base de datos — tablas principales

| Tabla | Campos destacados |
|---|---|
| `expedientes` | `codigo_expediente`, `estado`, `documentos_exentos` (JSON), `cerrado_manualmente` |
| `documentos` | `tipo_documento_id`, `numero_documento`, `estado`, `confianza_ocr_promedio`, `tipo_comprobante` |
| `notas_entrega` | `fecha_recepcion`, `estado_mercaderia`, `visitante_nombre`, `visitante_dni`, `visitante_empresa` |
| `documentos_identidad` | `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `expediente_id` |
| `empresas` | `ruc`, `razon_social`, `direccion` |
| `tipos_documento` | IDs 1–6 (Factura, Guía, OC, Nota, DNI, RxH) |
| `documentos_items` | Items de facturas y OC con cantidad, precio, descuento |
| `guias_remision` | Transporte, conductor, vehículo, puntos de partida/llegada |
| `ordenes_compra` | Fecha entrega, modo pago, dirección entrega, items con peso |

---

## Estados del sistema

### Documento
| Estado | Descripción |
|---|---|
| `pendiente_validacion` | Procesado por OCR, esperando revisión manual |
| `validada` | Aprobado (automático si confianza ≥ 98%, o manual) |
| `rechazada` | Rechazado con motivo registrado |

### Expediente
| Estado | Descripción |
|---|---|
| `en_proceso` | Tiene OC, faltan documentos requeridos |
| `completo` | Tiene OC + (Factura o RxH) + Guía (o exenciones aplicadas) |
| `incompleto` | Sin OC todavía |
| `cerrado_manual` | Cerrado manualmente con motivo |

---

## Problemas comunes

**PostgreSQL no conecta**
```bash
# Windows — verificar que el servicio esté corriendo
services.msc → PostgreSQL → Iniciar
```

**Puerto 8000 ocupado**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Backend no accesible desde móvil**
1. Usar `--host 0.0.0.0` al levantar uvicorn
2. Actualizar `VITE_API_BASE_URL` con la IP local
3. Abrir puertos en el firewall de Windows:
```powershell
New-NetFirewallRule -DisplayName "FastAPI" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Vite" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## Autor

**Juan Aguirre** — [@JuanAguirre10](https://github.com/JuanAguirre10)
