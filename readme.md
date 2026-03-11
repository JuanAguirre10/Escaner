# 📄 Sistema de Gestión de Facturas con OCR

> Sistema completo de procesamiento y validación de documentos comerciales mediante OCR con Claude Vision API. **Totalmente responsive** para desktop, tablet y móvil.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Características Principales

### 📸 Procesamiento OCR Inteligente
- ✅ Extracción automática de datos de facturas, órdenes de compra y guías de remisión
- ✅ Reconocimiento mediante **Claude Sonnet 4.5 Vision API**
- ✅ Soporte para PDF, PNG, JPG
- ✅ Validación automática de RUC y datos empresariales
- ✅ Procesamiento de documentos de identidad (DNI, CE, Pasaporte, CPP)

### 📦 Gestión de Expedientes
- ✅ Organización automática por expedientes
- ✅ Validación de completitud (OC + Factura + Guía + Nota de Entrega)
- ✅ Descarga masiva en formato ZIP
- ✅ Expedientes temporales para flujo progresivo
- ✅ Cierre manual de expedientes con motivo
- ✅ Reapertura de expedientes cerrados

### 📋 Validación y Edición
- ✅ Interfaz de validación con vista previa de documentos
- ✅ Edición manual de campos extraídos
- ✅ Detección automática de duplicados por N° OC
- ✅ Sistema de aprobación/rechazo con motivos
- ✅ Validación de items con cálculo automático de totales
- ✅ Edición de documentos de identidad

### 🔍 Búsqueda y Filtros
- ✅ Búsqueda por RUC, razón social, número de documento
- ✅ Filtros por estado (pendiente, validada, rechazada)
- ✅ Filtros por fecha de emisión y rango de fechas
- ✅ Filtros por tipo de documento (5 tipos)
- ✅ Listado de expedientes completos e incompletos
- ✅ Búsqueda de documentos de identidad

### 📊 Dashboard y Reportes
- ✅ Estadísticas de documentos procesados por tipo
- ✅ Estado de expedientes (completos/incompletos/cerrados)
- ✅ Métricas de validación y confianza OCR
- ✅ Documentos pendientes de validación
- ✅ Acciones rápidas desde dashboard

### 📱 **100% Responsive Design**
- ✅ **Optimizado para móvil, tablet y desktop**
- ✅ Sidebar colapsable con menú hamburguesa
- ✅ Cards verticales en móvil, tablas en desktop
- ✅ Botones adaptativos con active states táctiles
- ✅ Textos y espaciados adaptativos
- ✅ Grids responsive (1 col móvil → 2-4 cols desktop)
- ✅ Imágenes y previews adaptativas
- ✅ Pestañas con scroll horizontal en móvil
- ✅ Modales responsive con padding adaptativo

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI 0.109+** - Framework web moderno y rápido
- **PostgreSQL 15+** - Base de datos relacional
- **SQLAlchemy 2.0** - ORM para Python
- **Anthropic Claude API** - Procesamiento OCR con IA (claude-sonnet-4-20250514)
- **Pydantic V2** - Validación de datos
- **python-multipart** - Manejo de archivos multipart
- **Pillow** - Procesamiento de imágenes
- **python-dotenv** - Gestión de variables de entorno
- **uvicorn** - Servidor ASGI de alto rendimiento

### Frontend
- **React 18** - Librería UI con hooks
- **Vite 5** - Build tool y dev server ultrarrápido
- **React Router v6** - Navegación SPA
- **TailwindCSS 3** - Framework CSS utility-first responsive
- **Lucide React** - Librería de iconos moderna (800+ iconos)
- **React Hot Toast** - Sistema de notificaciones elegante
- **Axios** - Cliente HTTP con interceptors

### Base de Datos
- **PostgreSQL 15+** - Sistema de gestión de bases de datos
- **pgAdmin 4** - Herramienta de administración
- Schema: `documentos_db`

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
3. **Name:** `documentos_db`
4. **Owner:** `postgres`
5. **Encoding:** `UTF8`
6. Click "Save"

#### Opción B: Usando Terminal

```bash
psql -U postgres
CREATE DATABASE documentos_db;
\q
```

#### Restaurar datos iniciales (si existe backup)

```bash
psql -U postgres -d documentos_db -f backend/database/documentos_db.sql
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
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/documentos_db

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-tu_clave_aqui

# Configuración
SECRET_KEY=mi_clave_super_secreta_cambiar_en_produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# CORS
FRONTEND_URL=http://localhost:5173
```

**⚠️ Importante:** Reemplaza `tu_password` y `tu_clave_aqui` con tus valores reales.

### 4️⃣ Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

#### Crear archivo `.env`

Crea un archivo `.env` en la carpeta `frontend/`:

```env
# Desarrollo Local (laptop)
VITE_API_BASE_URL=http://localhost:8000
VITE_API_V1_PREFIX=/api/v1

# Para pruebas en red local (móvil/tablet)
# VITE_API_BASE_URL=http://TU_IP_LOCAL:8000
# Ejemplo: VITE_API_BASE_URL=http://192.168.100.24:8000
```

#### Configurar Vite para red local (opcional)

Si deseas probar en móvil/tablet, edita `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Permite acceso desde otros dispositivos
    port: 5173,
  }
})
```

---

## ▶️ Ejecución

### Desarrollo Local

#### Terminal 1 - Backend:
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
uvicorn app.main:app --reload --port 8000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Desarrollo en Red Local (para móvil/tablet)

#### Terminal 1 - Backend:
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Acceso desde móvil/tablet:**
1. Conecta el dispositivo a la **misma red WiFi**
2. Obtén tu IP local:
   - Windows: `ipconfig` → busca "Dirección IPv4"
   - Linux/Mac: `ifconfig` o `ip addr`
3. Abre en el navegador móvil: `http://TU_IP:5173`
   - Ejemplo: `http://192.168.100.24:5173`

**Importante:** Asegúrate de configurar el firewall de Windows para permitir conexiones en los puertos 5173 y 8000.

---

## 🌐 Acceso al Sistema

### Desarrollo Local

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Documentación API (Swagger):** http://localhost:8000/docs
- **Documentación API (ReDoc):** http://localhost:8000/redoc

### Red Local (móvil/tablet)

- **Frontend:** http://TU_IP:5173
- **Backend API:** http://TU_IP:8000
- **Documentación API:** http://TU_IP:8000/docs

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
│   │   │       │   ├── notas_entrega.py
│   │   │       │   └── documentos_identidad.py
│   │   │       └── router.py
│   │   ├── core/                 # Configuración central
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── db/                   # Modelos y base de datos
│   │   │   ├── models.py
│   │   │   └── database.py
│   │   ├── schemas/              # Schemas Pydantic
│   │   │   ├── documento.py
│   │   │   ├── expediente.py
│   │   │   ├── orden_compra.py
│   │   │   ├── guia_remision.py
│   │   │   ├── nota_entrega.py
│   │   │   └── documento_identidad.py
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── ocr_service.py
│   │   │   ├── expediente_service.py
│   │   │   └── documento_identidad_service.py
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
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── DocumentPreview.jsx
│   │   │   │   └── ProgressToast.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── NotaEntregaForm.jsx
│   │   │   ├── SubirDocumentoIdentidad.jsx
│   │   │   └── FiltrosFecha.jsx
│   │   ├── pages/                # Páginas principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── CrearNotaEntrega.jsx
│   │   │   ├── ListaDocumentos.jsx
│   │   │   ├── ListaExpedientes.jsx
│   │   │   ├── ListaNotasEntrega.jsx
│   │   │   ├── Pendientes.jsx
│   │   │   ├── ValidarFactura.jsx
│   │   │   ├── ValidarOrdenCompra.jsx
│   │   │   ├── ValidarGuia.jsx
│   │   │   ├── VerExpediente.jsx
│   │   │   ├── VerNotaEntrega.jsx
│   │   │   └── VerDocumentoIdentidad.jsx
│   │   ├── services/             # Servicios API
│   │   │   ├── api.js
│   │   │   ├── documentoService.js
│   │   │   ├── expedienteService.js
│   │   │   ├── empresaService.js
│   │   │   ├── notaEntregaService.js
│   │   │   └── documentoIdentidadService.js
│   │   ├── utils/                # Utilidades
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
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
| `GET` | `/api/v1/documentos` | Listar todos los documentos con filtros |
| `GET` | `/api/v1/documentos/{id}` | Obtener documento específico |
| `POST` | `/api/v1/documentos/ocr` | Procesar documento con OCR |
| `PUT` | `/api/v1/documentos/{id}` | Actualizar documento |
| `DELETE` | `/api/v1/documentos/{id}` | Eliminar documento |
| `POST` | `/api/v1/documentos/{id}/validar` | Validar documento |
| `POST` | `/api/v1/documentos/{id}/rechazar` | Rechazar documento |

### Expedientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/expedientes` | Listar expedientes con filtros |
| `GET` | `/api/v1/expedientes/{id}` | Obtener expediente específico |
| `POST` | `/api/v1/expedientes/temporal` | Crear expediente temporal |
| `GET` | `/api/v1/expedientes/incompletos/{empresa_id}` | Listar expedientes incompletos |
| `POST` | `/api/v1/expedientes/{id}/asociar-documento` | Asociar documento a expediente |
| `GET` | `/api/v1/expedientes/{id}/descargar-zip` | Descargar expediente en ZIP |
| `POST` | `/api/v1/expedientes/{id}/cerrar` | Cerrar expediente manualmente |
| `POST` | `/api/v1/expedientes/{id}/reabrir` | Reabrir expediente cerrado |
| `GET` | `/api/v1/expedientes/verificar-oc/{numero_orden}` | Verificar si OC existe |
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

### Documentos de Identidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/documentos-identidad` | Listar documentos de identidad |
| `GET` | `/api/v1/documentos-identidad/{id}` | Obtener documento específico |
| `POST` | `/api/v1/documentos-identidad/procesar` | Procesar documento con OCR |
| `PUT` | `/api/v1/documentos-identidad/{id}` | Actualizar documento de identidad |

---

## 📊 Modelo de Base de Datos

### Tablas Principales

**`documentos`** - Documentos procesados
- `id`: INTEGER (PK)
- `tipo_documento_id`: INTEGER (FK → tipos_documento)
- `numero_documento`: VARCHAR
- `expediente_id`: INTEGER (FK → expedientes)
- `estado`: VARCHAR (pendiente, validada, rechazada)
- `confianza_ocr_promedio`: FLOAT
- `ruc_emisor`: VARCHAR
- `razon_social_emisor`: VARCHAR
- `fecha_emision`: DATE
- `total`: DECIMAL
- `moneda`: VARCHAR
- `archivo_url`: VARCHAR
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

**`expedientes`** - Agrupación de documentos
- `id`: INTEGER (PK)
- `codigo_expediente`: VARCHAR (UNIQUE)
- `numero_orden_compra`: VARCHAR
- `empresa_id`: INTEGER (FK → empresas)
- `estado`: VARCHAR (incompleto, en_proceso, completo, cerrado_manual)
- `cerrado_manualmente`: BOOLEAN
- `motivo_cierre`: TEXT
- `fecha_creacion`: TIMESTAMP
- `fecha_cierre`: TIMESTAMP

**`empresas`** - Catálogo de empresas
- `id`: INTEGER (PK)
- `ruc`: VARCHAR (UNIQUE)
- `razon_social`: VARCHAR
- `direccion`: VARCHAR
- `telefono`: VARCHAR
- `email`: VARCHAR

**`tipos_documento`** - Tipos de documentos
1. Factura
2. Guía de Remisión
3. Orden de Compra
4. Nota de Entrega
5. Documento de Identidad

**`ordenes_compra`** - Datos específicos de OC
- `id`: INTEGER (PK)
- `documento_id`: INTEGER (FK → documentos)
- `fecha_entrega`: DATE
- `modo_pago`: VARCHAR
- `direccion_entrega`: TEXT

**`guias_remision`** - Datos de guías
- `id`: INTEGER (PK)
- `documento_id`: INTEGER (FK → documentos)
- `punto_partida`: VARCHAR
- `punto_llegada`: VARCHAR
- `transportista_ruc`: VARCHAR
- `transportista_nombre`: VARCHAR
- `placa_vehiculo`: VARCHAR

**`notas_entrega`** - Registro de recepción
- `id`: INTEGER (PK)
- `numero_nota`: VARCHAR
- `expediente_id`: INTEGER (FK → expedientes)
- `fecha_recepcion`: DATE
- `recibido_por`: VARCHAR
- `estado_mercaderia`: VARCHAR (conforme, no_conforme, parcial)
- `observaciones`: TEXT
- `orden_compra_numero`: VARCHAR
- `factura_numero`: VARCHAR
- `guia_numero`: VARCHAR

**`documentos_identidad`** - Documentos de identidad de visitantes
- `id`: INTEGER (PK)
- `tipo_documento`: VARCHAR (DNI, CARNET_EXTRANJERIA, PASAPORTE, CPP)
- `numero_documento`: VARCHAR
- `nombres`: VARCHAR
- `apellidos`: VARCHAR
- `nombre_completo`: VARCHAR
- `nacionalidad`: VARCHAR
- `sexo`: CHAR(1)
- `fecha_nacimiento`: DATE
- `fecha_emision`: DATE
- `fecha_vencimiento`: DATE
- `expediente_id`: INTEGER (FK → expedientes)
- `motivo_visita`: VARCHAR
- `empresa_visitante`: VARCHAR
- `cargo`: VARCHAR
- `created_at`: TIMESTAMP

**`documentos_items`** - Items de documentos
- `id`: INTEGER (PK)
- `documento_id`: INTEGER (FK → documentos)
- `codigo`: VARCHAR
- `descripcion`: TEXT
- `cantidad`: DECIMAL
- `unidad`: VARCHAR
- `precio_unitario`: DECIMAL
- `descuento`: DECIMAL
- `importe`: DECIMAL

---

## 🎯 Flujo de Trabajo

### 1. Subir Documento (OC/Factura/Guía)

```
Usuario selecciona empresa 
  → Crea/selecciona expediente 
  → Sube documento (PDF/PNG/JPG)
  → OCR procesa con Claude Vision
  → Sistema valida duplicados por N° OC
  → Extrae datos automáticamente
```

### 2. Validación de Documento

```
Sistema extrae datos 
  → Usuario revisa/corrige en interfaz
  → Valida items y totales
  → Aprueba o rechaza
  → Actualiza estado del expediente
```

### 3. Registro de Nota de Entrega

```
Expediente con OC/Factura/Guía 
  → Usuario crea Nota de Entrega manual
  → Registra fecha recepción, estado mercadería
  → Sistema completa expediente automáticamente
```

### 4. Documento de Identidad

```
Visitante entrega documento
  → Sube DNI/CE/Pasaporte/CPP
  → OCR extrae datos personales
  → Asocia a expediente
  → Registra motivo visita y empresa
```

### 5. Expediente Completo

```
OC + Factura + Guía + Nota de Entrega 
  → Expediente marcado como completo automáticamente
  → Descarga ZIP disponible con todos los archivos
  → Puede cerrarse manualmente si incompleto
```

### 6. Gestión y Búsqueda

```
Búsqueda por múltiples criterios 
  → Filtros por fecha, estado, tipo
  → Ver documentos/expedientes
  → Edición de datos
  → Descarga individual o masiva
```

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/db` | ✅ |
| `ANTHROPIC_API_KEY` | API Key de Claude | `sk-ant-api03-...` | ✅ |
| `SECRET_KEY` | Clave secreta para JWT | `mi_clave_secreta_cambiar` | ✅ |
| `ALGORITHM` | Algoritmo de encriptación | `HS256` | ✅ |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tiempo de expiración del token | `30` | ✅ |
| `UPLOAD_DIR` | Directorio de uploads | `./uploads` | ✅ |
| `MAX_FILE_SIZE_MB` | Tamaño máximo de archivo | `10` | ✅ |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` | ✅ |

### Frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `VITE_API_BASE_URL` | URL base del backend API | `http://localhost:8000` | ✅ |
| `VITE_API_V1_PREFIX` | Prefijo de versión API | `/api/v1` | ✅ |

---

## 🔥 Configuración de Firewall (Windows)

Si necesitas acceso desde red local (móvil/tablet):

### PowerShell como Administrador:

```powershell
# Backend (puerto 8000)
New-NetFirewallRule -DisplayName "FastAPI Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Frontend (puerto 5173)
New-NetFirewallRule -DisplayName "Vite Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Verificar reglas:
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*FastAPI*" -or $_.DisplayName -like "*Vite*"}
```

---

## 🐛 Problemas Comunes

### Error: "could not connect to database"

**Solución:** Verifica que PostgreSQL esté corriendo
```bash
# Windows
services.msc → PostgreSQL → Iniciar

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Error: "Module not found" (Python)

**Solución:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"

**Solución:** Cambiar el puerto o matar el proceso
```bash
# Cambiar puerto
uvicorn app.main:app --reload --port 8001

# O matar proceso (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Error: Backend no carga en móvil

**Soluciones:**
1. Verifica que ambos dispositivos estén en la **misma red WiFi**
2. Obtén tu IP local: `ipconfig` (Windows) o `ifconfig` (Linux/Mac)
3. Actualiza `.env` del frontend con tu IP
4. Configura firewall (ver sección anterior)
5. Reinicia backend con `--host 0.0.0.0`

### Error: "CORS policy" en navegador

**Solución:** Verifica que `FRONTEND_URL` en backend `.env` coincida con la URL del frontend

---

## 🎨 Responsive Design - Breakpoints

El sistema utiliza TailwindCSS con los siguientes breakpoints:

| Prefijo | Ancho Mínimo | Dispositivo |
|---------|--------------|-------------|
| `sm:` | 640px | Móvil grande / Tablet pequeña |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop pequeño |
| `xl:` | 1280px | Desktop grande |
| `2xl:` | 1536px | Desktop extra grande |

**Patrón común:**
- Móvil: 1 columna, cards verticales, botones full-width
- Tablet: 2 columnas, layout mixto
- Desktop: 3-4 columnas, tablas, layout horizontal

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Estilo

**Python (Backend):**
- Sigue PEP 8
- Usa type hints
- Docstrings en funciones públicas

**JavaScript (Frontend):**
- Usa ESLint
- Componentes funcionales con hooks
- PropTypes o TypeScript (futuro)

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Juan Aguirre**
- GitHub: [@JuanAguirre10](https://github.com/JuanAguirre10)
- Proyecto: [Escaner](https://github.com/JuanAguirre10/Escaner)

---

## 🙏 Agradecimientos

- [Anthropic](https://www.anthropic.com/) - Por Claude Vision API y el procesamiento OCR de clase mundial
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web Python moderno y rápido
- [React](https://reactjs.org/) - Librería UI potente y flexible
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utility-first que hizo el responsive design más fácil
- [Vite](https://vitejs.dev/) - Build tool increíblemente rápido
- [PostgreSQL](https://www.postgresql.org/) - Base de datos robusta y confiable