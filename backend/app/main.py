"""
Aplicación principal FastAPI
Sistema de Gestión de Documentos SUPERVAN
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)
from app.db.session import verify_db_connection
from app.api.v1.router import api_router


# ==================================
# CREAR APLICACIÓN FASTAPI
# ==================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Sistema de gestión de documentos con OCR usando Claude Vision",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ==================================
# CONFIGURAR CORS
# ==================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================
# MONTAR ARCHIVOS ESTÁTICOS
# ==================================

# Servir archivos subidos
uploads_path = Path(__file__).parent.parent / "uploads" 
uploads_path.mkdir(parents=True, exist_ok=True)


app.mount(
    "/uploads",
    StaticFiles(directory=str(uploads_path)),
    name="uploads"
)

logger.info(f"StaticFiles montado: /uploads -> {uploads_path}")


# ==================================
# INCLUIR ROUTERS
# ==================================

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX
)


# ==================================
# EVENTOS DE INICIO/CIERRE
# ==================================

@app.on_event("startup")
async def startup_event():
    """Ejecutar al iniciar la aplicación"""
    logger.info(f"Iniciando {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")
    if verify_db_connection():
        logger.info("Base de datos conectada correctamente")
    else:
        logger.error("Error conectando a la base de datos - la aplicación puede no funcionar correctamente")


@app.on_event("shutdown")
async def shutdown_event():
    """Ejecutar al cerrar la aplicación"""
    logger.info(f"Cerrando {settings.PROJECT_NAME}")


# ==================================
# ENDPOINTS RAÍZ
# ==================================

@app.get("/")
def root():
    """Endpoint raíz - información de la API"""
    return {
        "nombre": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "descripcion": "Sistema de gestión de documentos con OCR",
        "docs": "/docs",
        "redoc": "/redoc",
        "api_v1": settings.API_V1_PREFIX,
        "endpoints": {
            "empresas": f"{settings.API_V1_PREFIX}/empresas",
            "tipos_documento": f"{settings.API_V1_PREFIX}/tipos-documento",
            "documentos": f"{settings.API_V1_PREFIX}/documentos",
            "ocr": f"{settings.API_V1_PREFIX}/ocr",
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    db_status = "ok" if verify_db_connection() else "error"
    
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "version": settings.PROJECT_VERSION,
    }


# ==================================
# MANEJO DE ERRORES PERSONALIZADOS
# ==================================

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Maneja errores de validación de Pydantic"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "body": exc.body,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Maneja errores de base de datos"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Error de base de datos",
            "error": str(exc),
        },
    )


# ==================================
# EJECUTAR APLICACIÓN (para desarrollo)
# ==================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )