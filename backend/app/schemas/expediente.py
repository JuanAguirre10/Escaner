"""
Schemas para Expedientes
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class ExpedienteBase(BaseModel):
    codigo_expediente: str = Field(..., max_length=50)
    numero_orden_compra: str = Field(..., max_length=50)
    empresa_id: int
    estado: Optional[str] = Field(default='en_proceso', max_length=50)
    fecha_creacion: date
    fecha_cierre: Optional[date] = None
    observaciones: Optional[str] = None


class ExpedienteCreate(ExpedienteBase):
    created_by: str = "admin"


class ExpedienteUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_cierre: Optional[date] = None
    observaciones: Optional[str] = None


class DocumentoExpediente(BaseModel):
    """Documento dentro de un expediente"""
    id: int
    tipo_documento_id: int
    numero_documento: str
    fecha_emision: date
    total: Optional[float] = None
    estado: str
    
    class Config:
        from_attributes = True


class NotaEntregaExpediente(BaseModel):
    """Nota de entrega dentro de un expediente"""
    id: int
    numero_nota: str
    fecha_recepcion: date
    recibido_por: Optional[str] = None
    estado_mercaderia: str
    
    class Config:
        from_attributes = True


from datetime import datetime  # ← ASEGÚRATE que esté importado arriba

class ExpedienteDetalle(ExpedienteBase):
    """Expediente con documentos asociados"""
    id: int
    documentos: List[DocumentoExpediente] = []
    notas_entrega: List[NotaEntregaExpediente] = []
    created_at: Optional[datetime] = None  # ← CAMBIAR date a datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExpedienteResponse(ExpedienteBase):
    """Expediente sin relaciones anidadas"""
    id: int
    created_at: Optional[datetime] = None  # ← CAMBIAR date a datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True