"""
Schemas para Orden de Compra
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class OrdenCompraBase(BaseModel):
    """Schema base para Orden de Compra"""
    numero_orden_compra: str = Field(..., max_length=50)
    serie_orden: Optional[str] = Field(None, max_length=10)
    correlativo_orden: Optional[str] = Field(None, max_length=20)
    
    ruc_comprador: str = Field(..., max_length=11)
    razon_social_comprador: Optional[str] = Field(None, max_length=500)
    direccion_comprador: Optional[str] = None
    telefono_comprador: Optional[str] = Field(None, max_length=50)
    
    ruc_proveedor: str = Field(..., max_length=11)
    razon_social_proveedor: Optional[str] = Field(None, max_length=500)
    direccion_proveedor: Optional[str] = None
    
    fecha_entrega: Optional[date] = None
    direccion_entrega: Optional[str] = None
    modo_pago: Optional[str] = Field(None, max_length=100)


class OrdenCompraCreate(OrdenCompraBase):
    """Schema para crear Orden de Compra"""
    documento_id: int


class OrdenCompraUpdate(BaseModel):
    """Schema para actualizar Orden de Compra"""
    fecha_entrega: Optional[date] = None
    direccion_entrega: Optional[str] = None
    modo_pago: Optional[str] = None


class OrdenCompraResponse(OrdenCompraBase):
    """Schema de respuesta con datos completos"""
    id: int
    documento_id: int
    
    class Config:
        from_attributes = True