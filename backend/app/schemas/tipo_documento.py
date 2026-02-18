"""
Schemas Pydantic para TipoDocumento
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ==================================
# SCHEMAS BASE
# ==================================

class TipoDocumentoBase(BaseModel):
    """Campos comunes de TipoDocumento"""
    codigo: str = Field(..., max_length=20, description="Código único: FACTURA, GUIA_REMISION, ORDEN_VENTA")
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    activo: bool = True


# ==================================
# SCHEMA PARA CREAR TIPO DOCUMENTO
# ==================================

class TipoDocumentoCreate(TipoDocumentoBase):
    """Schema para crear un nuevo tipo de documento"""
    pass


# ==================================
# SCHEMA PARA ACTUALIZAR TIPO DOCUMENTO
# ==================================

class TipoDocumentoUpdate(BaseModel):
    """Schema para actualizar tipo documento (todos opcionales)"""
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class TipoDocumentoInDB(TipoDocumentoBase):
    """Schema que representa un tipo documento en la base de datos"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class TipoDocumento(TipoDocumentoInDB):
    """Schema público para respuestas de la API"""
    pass


# ==================================
# SCHEMA SIMPLIFICADO
# ==================================

class TipoDocumentoSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    codigo: str
    nombre: str
    activo: bool
    
    class Config:
        from_attributes = True