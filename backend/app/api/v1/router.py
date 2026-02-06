"""
Router principal de la API v1
Agrupa todos los endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import facturas, ocr, proveedores

# Crear router principal
api_router = APIRouter()

# Incluir routers de endpoints
api_router.include_router(
    ocr.router,
    prefix="/ocr",
    tags=["OCR"]
)

api_router.include_router(
    facturas.router,
    prefix="/facturas",
    tags=["Facturas"]
)

api_router.include_router(
    proveedores.router,
    prefix="/proveedores",
    tags=["Proveedores"]
)