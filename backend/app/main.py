"""
Aplicación principal de FastAPI
Punto de entrada del backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.api.v1.router import api_router
from app.db.session import verify_db_connection

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# ==================================
# CREAR APLICACIÓN FASTAPI
# ==================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API REST para gestión de facturas con OCR automático usando Google Vision",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
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
# INCLUIR ROUTERS
# ==================================

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX
)

# ==================================
# ENDPOINTS DE SALUD
# ==================================

@app.get("/")
def root():
    """
    Endpoint raíz - Información de la API
    """
    return {
        "message": f"🚀 {settings.PROJECT_NAME}",
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    """
    Health check - Verifica que la API y la BD estén funcionando
    """
    # Verificar conexión a BD
    db_ok = verify_db_connection()
    
    if not db_ok:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected"
            }
        )
    
    return {
        "status": "healthy",
        "database": "connected",
        "version": settings.PROJECT_VERSION
    }


# ==================================
# EVENTOS DE INICIO Y CIERRE
# ==================================

@app.on_event("startup")
async def startup_event():
    """
    Se ejecuta al iniciar la aplicación
    """
    logger.info("="*60)
    logger.info(f"🚀 Iniciando {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")
    logger.info("="*60)
    
    # Verificar conexión a BD
    if verify_db_connection():
        logger.info("✅ Base de datos conectada correctamente")
    else:
        logger.error("❌ Error conectando a la base de datos")
    
    logger.info("="*60)
    logger.info(f"📚 Documentación disponible en: http://localhost:8000/docs")
    logger.info(f"🔗 API V1 disponible en: http://localhost:8000{settings.API_V1_PREFIX}")
    logger.info("="*60)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Se ejecuta al cerrar la aplicación
    """
    logger.info("="*60)
    logger.info("👋 Cerrando aplicación...")
    logger.info("="*60)


# ==================================
# MANEJO DE ERRORES GLOBAL
# ==================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Manejador global de excepciones no capturadas
    """
    logger.error(f"❌ Error no manejado: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "error": str(exc) if settings.DEBUG else "Internal server error"
        }
    )