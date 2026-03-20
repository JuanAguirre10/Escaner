"""
Schemas para Notas de Entrega
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class NotaEntregaBase(BaseModel):
    expediente_id: Optional[int] = None
    numero_nota: str = Field(..., max_length=50)
    fecha_recepcion: date
    recibido_por: Optional[str] = Field(None, max_length=200)
    estado_mercaderia: Optional[str] = Field(None, max_length=50)
    observaciones: Optional[str] = None
    orden_compra_numero: Optional[str] = Field(None, max_length=50)
    factura_numero: Optional[str] = Field(None, max_length=50)
    guia_numero: Optional[str] = Field(None, max_length=50)
    visitante_nombre: Optional[str] = Field(None, max_length=200)
    visitante_dni: Optional[str] = Field(None, max_length=20)
    visitante_empresa: Optional[str] = Field(None, max_length=200)


class NotaEntregaCreate(NotaEntregaBase):
    expediente_id: Optional[int] = None 
    created_by: str = "admin"


class NotaEntregaUpdate(BaseModel):
    fecha_recepcion: Optional[date] = None
    recibido_por: Optional[str] = None
    estado_mercaderia: Optional[str] = None
    observaciones: Optional[str] = None
    orden_compra_numero: Optional[str] = None
    factura_numero: Optional[str] = None
    guia_numero: Optional[str] = None
    visitante_nombre: Optional[str] = Field(None, max_length=200)
    visitante_dni: Optional[str] = Field(None, max_length=20)
    visitante_empresa: Optional[str] = Field(None, max_length=200)


class NotaEntregaResponse(NotaEntregaBase):
    id: int
    expediente_id: Optional[int] = None
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True