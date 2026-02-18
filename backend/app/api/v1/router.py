"""
Router principal de la API v1
Agrupa todos los endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    empresas,
    tipos_documento,
    documentos,
    ocr,
    guias_remision,
)

# Crear router principal
api_router = APIRouter()

# Incluir routers de cada módulo
api_router.include_router(
    empresas.router,
    prefix="/empresas",
    tags=["Empresas"]
)

api_router.include_router(
    tipos_documento.router,
    prefix="/tipos-documento",
    tags=["Tipos de Documento"]
)

api_router.include_router(
    documentos.router,
    prefix="/documentos",
    tags=["Documentos"]
)

api_router.include_router(
    ocr.router,
    prefix="/ocr",
    tags=["OCR"]
)

api_router.include_router(
    guias_remision.router, 
    prefix="/guias-remision", 
    tags=["guias-remision"])