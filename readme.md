# 📄 Sistema de Gestión de Facturas con OCR

> Sistema completo de procesamiento y validación de documentos comerciales mediante OCR con Claude Vision API

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Características Principales

### 📸 Procesamiento OCR Inteligente
- ✅ Extracción automática de datos de facturas, órdenes de compra y guías de remisión
- ✅ Reconocimiento mediante **Claude 3.5 Sonnet Vision API**
- ✅ Soporte para PDF, PNG, JPG
- ✅ Validación automática de RUC y datos empresariales

### 📦 Gestión de Expedientes
- ✅ Organización automática por expedientes
- ✅ Validación de completitud (OC + Factura + Guía + Nota de Entrega)
- ✅ Descarga masiva en formato ZIP
- ✅ Expedientes temporales para flujo progresivo

### 📋 Validación y Edición
- ✅ Interfaz de validación con vista previa de documentos
- ✅ Edición manual de campos extraídos
- ✅ Detección de duplicados
- ✅ Sistema de aprobación/rechazo con motivos

### 🔍 Búsqueda y Filtros
- ✅ Búsqueda por RUC, razón social, número de documento
- ✅ Filtros por estado (pendiente, validada, rechazada)
- ✅ Filtros por fecha de emisión
- ✅ Listado de expedientes completos e incompletos

### 📊 Dashboard y Reportes
- ✅ Estadísticas de documentos procesados
- ✅ Estado de expedientes (completos/incompletos)
- ✅ Métricas de validación

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno y rápido
- **PostgreSQL** - Base de datos relacional
- **SQLAlchemy** - ORM para Python
- **Anthropic Claude API** - Procesamiento OCR con IA
- **Pydantic** - Validación de datos
- **python-multipart** - Manejo de archivos
- **Pillow** - Procesamiento de imágenes

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación SPA
- **TailwindCSS** - Estilos utility-first
- **Lucide React** - Iconos
- **React Hot Toast** - Notificaciones
- **Axios** - Cliente HTTP

### Base de Datos
- **PostgreSQL 15+** - Sistema de gestión de bases de datos
- **pgAdmin 4** - Herramienta de administración

---

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)
- Cuenta en [Anthropic](https://www.anthropic.com/) (para API Key de Claude)

---

## 🔧 Instalación

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/JuanAguirre10/Escaner.git
cd Escaner
```

### 2️⃣ Configurar Base de Datos

#### Opción A: Usando pgAdmin 4

1. Abre **pgAdmin 4**
2. Click derecho en "Databases" → "Create" → "Database"
3. **Name:** `facturas_db`
4. **Owner:** `postgres`
5. **Encoding:** `UTF8`
6. Click "Save"

#### Opción B: Usando Terminal

```bash
psql -U postgres
CREATE DATABASE facturas_db;
\q
```

#### Restaurar datos iniciales (si existe backup)

```bash
psql -U postgres -d facturas_db -f backend/database/facturas_db.sql
```

### 3️⃣ Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear carpeta de uploads
mkdir uploads
```

#### Crear archivo `.env`

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/facturas_db

# Claude API
ANTHROPIC_API_KEY=tu_clave_api_de_claude

# Configuración
SECRET_KEY=mi_clave_super_secreta_12345678
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# CORS
FRONTEND_URL=http://localhost:5173
```

**⚠️ Importante:** Reemplaza `tu_password` y `tu_clave_api_de_claude` con tus valores reales.

### 4️⃣ Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

#### Crear archivo `.env`

Crea un archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## ▶️ Ejecución

### Opción 1: Dos Terminales (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Opción 2: Script de Inicio Rápido

**Windows** (`iniciar.bat`):
```bat
@echo off
start cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak > nul
start cmd /k "cd frontend && npm run dev"
```

---

## 🌐 Acceso al Sistema

Una vez ejecutado:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Documentación API:** http://localhost:8000/docs
- **Documentación Alternativa:** http://localhost:8000/redoc

---

## 📁 Estructura del Proyecto

```
Escaner/
│
├── backend/                      # Backend FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/    # Endpoints de la API
│   │   │       │   ├── documentos.py
│   │   │       │   ├── expedientes.py
│   │   │       │   ├── empresas.py
│   │   │       │   ├── guias_remision.py
│   │   │       │   ├── ordenes_compra.py
│   │   │       │   └── notas_entrega.py
│   │   │       └── router.py
│   │   ├── core/                 # Configuración central
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/               # Modelos SQLAlchemy
│   │   │   ├── documento.py
│   │   │   ├── expediente.py
│   │   │   ├── empresa.py
│   │   │   ├── orden_compra.py
│   │   │   ├── guia_remision.py
│   │   │   └── nota_entrega.py
│   │   ├── schemas/              # Schemas Pydantic
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── ocr_service.py
│   │   │   └── expediente_service.py
│   │   └── main.py               # Punto de entrada
│   ├── database/                 # Backups y migraciones
│   ├── uploads/                  # Archivos subidos
│   ├── requirements.txt
│   └── .env
│
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Componentes reutilizables
│   │   │   └── NotaEntregaForm.jsx
│   │   ├── pages/                # Páginas principales
│   │   │   ├── Upload.jsx
│   │   │   ├── ListaFacturas.jsx
│   │   │   ├── ValidarFactura.jsx
│   │   │   ├── ValidarOrdenCompra.jsx
│   │   │   ├── ValidarGuiaRemision.jsx
│   │   │   ├── ListaExpedientes.jsx
│   │   │   ├── VerExpediente.jsx
│   │   │   └── VerNotaEntrega.jsx
│   │   ├── services/             # Servicios API
│   │   │   ├── api.js
│   │   │   ├── documentoService.js
│   │   │   ├── expedienteService.js
│   │   │   ├── empresaService.js
│   │   │   └── notaEntregaService.js
│   │   ├── utils/                # Utilidades
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── README.md
└── LICENSE
```

---

## 🔌 API Endpoints

### Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/documentos` | Listar todos los documentos |
| `GET` | `/api/v1/documentos/{id}` | Obtener documento específico |
| `POST` | `/api/v1/documentos/ocr` | Procesar documento con OCR |
| `PUT` | `/api/v1/documentos/{id}` | Actualizar documento |
| `DELETE` | `/api/v1/documentos/{id}` | Eliminar documento |
| `POST` | `/api/v1/documentos/{id}/validar` | Validar documento |
| `POST` | `/api/v1/documentos/{id}/rechazar` | Rechazar documento |

### Expedientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/expedientes` | Listar expedientes |
| `GET` | `/api/v1/expedientes/{id}` | Obtener expediente específico |
| `POST` | `/api/v1/expedientes/temporal` | Crear expediente temporal |
| `GET` | `/api/v1/expedientes/incompletos/{empresa_id}` | Listar expedientes incompletos |
| `POST` | `/api/v1/expedientes/{id}/asociar-documento` | Asociar documento a expediente |
| `GET` | `/api/v1/expedientes/{id}/descargar-zip` | Descargar expediente en ZIP |
| `DELETE` | `/api/v1/expedientes/{id}` | Eliminar expediente |

### Empresas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/empresas` | Listar empresas |
| `GET` | `/api/v1/empresas/buscar` | Buscar empresa por RUC o nombre |
| `GET` | `/api/v1/empresas/{id}` | Obtener empresa específica |

### Notas de Entrega

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/notas-entrega` | Listar notas de entrega |
| `GET` | `/api/v1/notas-entrega/{id}` | Obtener nota específica |
| `POST` | `/api/v1/notas-entrega` | Crear nota de entrega |
| `PUT` | `/api/v1/notas-entrega/{id}` | Actualizar nota de entrega |

---

## 📊 Modelo de Base de Datos

### Tablas Principales

**`documentos`** - Documentos procesados
- Información general del documento
- Estado de validación
- Datos de emisor y cliente
- Totales y moneda

**`expedientes`** - Agrupación de documentos
- Código de expediente (EXP-{numero_oc})
- Estado (incompleto/en_proceso/completo)
- Relación con empresa

**`empresas`** - Catálogo de empresas
- RUC y razón social
- Datos de contacto

**`ordenes_compra`** - Datos específicos de OC
- Fecha de entrega
- Modo de pago
- Dirección de entrega

**`guias_remision`** - Datos de guías
- Punto de partida y llegada
- Transportista
- Placas de vehículo

**`notas_entrega`** - Registro de recepción
- Estado de mercadería (conforme/no conforme/parcial)
- Fecha de recepción
- Observaciones

**`documentos_items`** - Items de documentos
- Descripción de productos
- Cantidades y precios
- Descuentos

---

## 🎯 Flujo de Trabajo

### 1. Subir Documento

```
Usuario selecciona empresa → Crea/selecciona expediente → Sube documento → OCR procesa
```

### 2. Validación

```
Sistema extrae datos → Usuario valida/corrige → Aprueba o rechaza
```

### 3. Expediente Completo

```
OC + Factura + Guía + Nota → Expediente marcado como completo → Descarga disponible
```

### 4. Gestión

```
Búsqueda y filtros → Ver documentos/expedientes → Edición → Descarga ZIP
```

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | ✅ |
| `ANTHROPIC_API_KEY` | API Key de Claude | ✅ |
| `SECRET_KEY` | Clave secreta para JWT | ✅ |
| `ALGORITHM` | Algoritmo de encriptación | ✅ |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tiempo de expiración del token | ✅ |
| `UPLOAD_DIR` | Directorio de uploads | ✅ |
| `MAX_FILE_SIZE_MB` | Tamaño máximo de archivo | ✅ |
| `FRONTEND_URL` | URL del frontend para CORS | ✅ |

### Frontend (`frontend/.env`)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_API_URL` | URL base del backend API | ✅ |

---

## 🧪 Testing

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

---

## 📦 Deployment

### Backend (FastAPI)

#### Con Uvicorn

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Con Gunicorn (Producción)

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (React)

```bash
cd frontend
npm run build
```

Los archivos estáticos se generan en `frontend/dist/` y pueden servirse con Nginx, Apache, o cualquier servidor web.

---

## 🐛 Problemas Comunes

### Error: "could not connect to database"

**Solución:** Verifica que PostgreSQL esté corriendo
```bash
# Windows
services.msc → PostgreSQL → Iniciar

# Linux
sudo systemctl start postgresql
```

### Error: "Module not found" (Python)

**Solución:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"

**Solución:** Cambiar el puerto
```bash
uvicorn app.main:app --reload --port 8001
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


## 👤 Autor

**Juan Aguirre**
- GitHub: [@JuanAguirre10](https://github.com/JuanAguirre10)
- Proyecto: [Escaner](https://github.com/JuanAguirre10/Escaner)

---

## 🙏 Agradecimientos

- [Anthropic](https://www.anthropic.com/) - Por Claude Vision API
- [FastAPI](https://fastapi.tiangolo.com/) - Excelente framework web
- [React](https://reactjs.org/) - Librería UI potente
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utility-first

