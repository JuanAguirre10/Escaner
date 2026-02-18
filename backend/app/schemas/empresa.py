"""
Schemas Pydantic para Empresa (antes Proveedor)
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ==================================
# SCHEMAS BASE
# ==================================

class EmpresaBase(BaseModel):
    """Campos comunes de Empresa"""
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de 11 dígitos")
    razon_social: str = Field(..., min_length=1, max_length=500)
    direccion: Optional[str] = None
    telefono: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    
    @field_validator('ruc')
    @classmethod
    def validar_ruc(cls, v: str) -> str:
        """Validar que el RUC sea solo números"""
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v


# ==================================
# SCHEMA PARA CREAR EMPRESA
# ==================================

class EmpresaCreate(EmpresaBase):
    """Schema para crear una nueva empresa"""
    pass


# ==================================
# SCHEMA PARA ACTUALIZAR EMPRESA
# ==================================

class EmpresaUpdate(BaseModel):
    """Schema para actualizar empresa (todos los campos opcionales)"""
    ruc: Optional[str] = Field(None, min_length=11, max_length=11)
    razon_social: Optional[str] = Field(None, min_length=1, max_length=500)
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class EmpresaInDB(EmpresaBase):
    """Schema que representa una empresa en la base de datos"""
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class Empresa(EmpresaInDB):
    """Schema público para respuestas de la API"""
    pass


# ==================================
# SCHEMA SIMPLIFICADO
# ==================================

class EmpresaSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    ruc: str
    razon_social: str
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PARA VALIDAR RUC
# ==================================

class ValidarRUCRequest(BaseModel):
    """Request para validar RUC"""
    ruc: str = Field(..., min_length=11, max_length=11)
    
    @field_validator('ruc')
    @classmethod
    def validar_ruc(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v


class ValidarRUCResponse(BaseModel):
    """Response de validación de RUC"""
    ruc: str
    existe: bool
    empresa: Optional[EmpresaSimple] = None
    mensaje: str