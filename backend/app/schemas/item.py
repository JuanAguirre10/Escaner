"""
Schemas Pydantic para Items de Factura
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ==================================
# SCHEMAS BASE
# ==================================

class FacturaItemBase(BaseModel):
    """Campos comunes de Item"""
    orden: int = Field(default=1, ge=1, description="Orden del item en la factura")
    codigo_producto: Optional[str] = Field(None, max_length=100)
    codigo_interno: Optional[str] = Field(None, max_length=100)
    codigo_sunat: Optional[str] = Field(None, max_length=20)
    descripcion: str = Field(..., min_length=1, description="Descripción del producto/servicio")
    descripcion_adicional: Optional[str] = None
    marca: Optional[str] = Field(None, max_length=100)
    modelo: Optional[str] = Field(None, max_length=100)
    cantidad: Decimal = Field(..., gt=0, decimal_places=4, description="Cantidad del producto")
    unidad_medida: str = Field(default="UND", max_length=20)
    precio_unitario: Decimal = Field(..., ge=0, decimal_places=4)
    valor_unitario: Optional[Decimal] = Field(None, decimal_places=4)
    descuento_porcentaje: Decimal = Field(default=0.0, ge=0, le=100, decimal_places=2)
    descuento_monto: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    valor_venta: Decimal = Field(..., ge=0, decimal_places=4)
    valor_total: Decimal = Field(..., ge=0, decimal_places=4)
    igv_item: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    afecto_igv: bool = True
    notas: Optional[str] = None
    confianza_ocr: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)


# ==================================
# SCHEMA PARA CREAR ITEM
# ==================================

class FacturaItemCreate(FacturaItemBase):
    """Schema para crear un nuevo item"""
    pass


# ==================================
# SCHEMA PARA ACTUALIZAR ITEM
# ==================================

class FacturaItemUpdate(BaseModel):
    """Schema para actualizar item (todos opcionales)"""
    orden: Optional[int] = None
    codigo_producto: Optional[str] = None
    descripcion: Optional[str] = None
    descripcion_adicional: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    cantidad: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    valor_unitario: Optional[Decimal] = None
    descuento_porcentaje: Optional[Decimal] = None
    descuento_monto: Optional[Decimal] = None
    valor_venta: Optional[Decimal] = None
    valor_total: Optional[Decimal] = None
    igv_item: Optional[Decimal] = None
    afecto_igv: Optional[bool] = None
    notas: Optional[str] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class FacturaItemInDB(FacturaItemBase):
    """Schema que representa un item en la base de datos"""
    id: int
    factura_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class FacturaItem(FacturaItemInDB):
    """Schema público para respuestas de la API"""
    pass


# ==================================
# SCHEMA SIMPLIFICADO
# ==================================

class FacturaItemSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    orden: int
    codigo_producto: Optional[str]
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    valor_total: Decimal
    
    class Config:
        from_attributes = True