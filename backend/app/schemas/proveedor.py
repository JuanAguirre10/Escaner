"""
Schemas Pydantic para Proveedor
Define la estructura de datos para request/response
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ==================================
# SCHEMAS BASE
# ==================================

class ProveedorBase(BaseModel):
    """Campos comunes de Proveedor"""
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de 11 dígitos")
    razon_social: str = Field(..., min_length=1, max_length=300)
    nombre_comercial: Optional[str] = Field(None, max_length=300)
    direccion: Optional[str] = None
    telefono: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=150)
    pagina_web: Optional[str] = Field(None, max_length=200)
    contacto_nombre: Optional[str] = Field(None, max_length=200)
    contacto_cargo: Optional[str] = Field(None, max_length=100)
    notas: Optional[str] = None
    
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
# SCHEMA PARA CREAR PROVEEDOR
# ==================================

class ProveedorCreate(ProveedorBase):
    """Schema para crear un nuevo proveedor"""
    activo: bool = True


# ==================================
# SCHEMA PARA ACTUALIZAR PROVEEDOR
# ==================================

class ProveedorUpdate(BaseModel):
    """Schema para actualizar proveedor (todos los campos opcionales)"""
    ruc: Optional[str] = Field(None, min_length=11, max_length=11)
    razon_social: Optional[str] = Field(None, min_length=1, max_length=300)
    nombre_comercial: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    pagina_web: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_cargo: Optional[str] = None
    activo: Optional[bool] = None
    notas: Optional[str] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class ProveedorInDB(ProveedorBase):
    """Schema que representa un proveedor en la base de datos"""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    
    class Config:
        from_attributes = True  # Antes era orm_mode en Pydantic v1


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class Proveedor(ProveedorInDB):
    """Schema público para respuestas de la API"""
    pass


# ==================================
# SCHEMA SIMPLIFICADO
# ==================================

class ProveedorSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    ruc: str
    razon_social: str
    activo: bool
    
    class Config:
        from_attributes = True