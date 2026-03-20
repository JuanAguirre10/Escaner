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
    # NUEVO - Cerrado manual
    cerrado_manualmente: Optional[bool] = False
    cerrado_por: Optional[str] = None
    motivo_cierre: Optional[str] = None
    documentos_exentos: Optional[List[int]] = Field(default_factory=list)


class ExpedienteCreate(ExpedienteBase):
    created_by: str = "admin"


class ExpedienteUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_cierre: Optional[date] = None
    observaciones: Optional[str] = None
    cerrado_manualmente: Optional[bool] = None
    cerrado_por: Optional[str] = None
    motivo_cierre: Optional[str] = None
    documentos_exentos: Optional[List[int]] = None


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
    visitante_nombre: Optional[str] = None
    visitante_dni: Optional[str] = None
    visitante_empresa: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentoIdentidadExpediente(BaseModel):
    """Documento de identidad dentro de un expediente"""
    id: int
    tipo_documento: str
    numero_documento: str
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    nombre_completo: Optional[str] = None
    empresa_visitante: Optional[str] = None
    fecha_visita: datetime
    
    class Config:
        from_attributes = True


class ExpedienteDetalle(ExpedienteBase):
    """Expediente con documentos asociados"""
    id: int
    documentos: List[DocumentoExpediente] = []
    notas_entrega: List[NotaEntregaExpediente] = []
    documentos_identidad: List[DocumentoIdentidadExpediente] = []  # NUEVO
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExpedienteResponse(ExpedienteBase):
    """Expediente sin relaciones anidadas"""
    id: int
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


# NUEVO - Schemas para cerrar expediente
class CerrarExpedienteRequest(BaseModel):
    motivo_cierre: str = Field(..., min_length=10, description="Razón del cierre")
    documentos_faltantes: Optional[List[str]] = Field(default=[], description="Documentos que faltan")


class CerrarExpedienteResponse(BaseModel):
    id: int
    codigo_expediente: str
    estado: str
    cerrado_manualmente: bool
    fecha_cierre: Optional[date] = None
    cerrado_por: Optional[str] = None
    motivo_cierre: Optional[str] = None
    
    class Config:
        from_attributes = True