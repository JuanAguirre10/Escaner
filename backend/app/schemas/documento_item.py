"""
Schemas Pydantic para Items de Documento (antes FacturaItem)
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ==================================
# SCHEMAS BASE
# ==================================

class DocumentoItemBase(BaseModel):
    """Campos comunes de Item"""
    orden: int = Field(default=1, ge=1, description="Orden del item en el documento")
    codigo_producto: Optional[str] = Field(None, max_length=100)
    descripcion: str = Field(..., min_length=1, description="Descripción del producto/servicio")
    detalle_adicional: Optional[str] = None
    cantidad: Decimal = Field(..., gt=0, decimal_places=4, description="Cantidad del producto")
    unidad_medida: str = Field(default="UND", max_length=10)
    precio_unitario: Decimal = Field(..., ge=0, decimal_places=2)
    descuento_porcentaje: Decimal = Field(default=0.0, ge=0, le=100, decimal_places=2)
    valor_venta: Decimal = Field(..., ge=0, decimal_places=2)
    valor_total: Decimal = Field(..., ge=0, decimal_places=2)
    igv_item: Decimal = Field(default=0.0, ge=0, decimal_places=2)
    total_item: Decimal = Field(default=0.0, ge=0, decimal_places=2)


# ==================================
# SCHEMA PARA CREAR ITEM
# ==================================

class DocumentoItemCreate(DocumentoItemBase):
    """Schema para crear un nuevo item"""
    pass


# ==================================
# SCHEMA PARA ACTUALIZAR ITEM
# ==================================

class DocumentoItemUpdate(BaseModel):
    """Schema para actualizar item (todos opcionales)"""
    orden: Optional[int] = None
    codigo_producto: Optional[str] = None
    descripcion: Optional[str] = None
    detalle_adicional: Optional[str] = None
    cantidad: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    descuento_porcentaje: Optional[Decimal] = None
    valor_venta: Optional[Decimal] = None
    valor_total: Optional[Decimal] = None
    igv_item: Optional[Decimal] = None
    total_item: Optional[Decimal] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class DocumentoItemInDB(DocumentoItemBase):
    """Schema que representa un item en la base de datos"""
    id: int
    documento_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class DocumentoItem(DocumentoItemInDB):
    """Schema público para respuestas de la API"""
    pass


# ==================================
# SCHEMA SIMPLIFICADO
# ==================================

class DocumentoItemSimple(BaseModel):
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