"""
Schemas para Documentos de Identidad
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import date, datetime


class DocumentoIdentidadBase(BaseModel):
    tipo_documento: str
    numero_documento: str
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    nombre_completo: Optional[str] = None
    nacionalidad: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    sexo: Optional[str] = None
    motivo_visita: Optional[str] = None
    empresa_visitante: Optional[str] = None
    cargo: Optional[str] = None


class DocumentoIdentidadCreate(DocumentoIdentidadBase):
    expediente_id: int
    documento_id: Optional[int] = None
    datos_ocr_completos: Optional[Dict[str, Any]] = None


class DocumentoIdentidadUpdate(BaseModel):
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    nombre_completo: Optional[str] = None
    nacionalidad: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    sexo: Optional[str] = None
    motivo_visita: Optional[str] = None
    empresa_visitante: Optional[str] = None
    cargo: Optional[str] = None


class DocumentoIdentidadResponse(DocumentoIdentidadBase):
    id: int
    expediente_id: int
    documento_id: Optional[int] = None
    fecha_visita: datetime
    datos_ocr_completos: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    
    class Config:
        from_attributes = True


# Schemas para cerrar expediente
class CerrarExpedienteRequest(BaseModel):
    motivo_cierre: str = Field(..., min_length=10, description="Razón del cierre")
    documentos_faltantes: Optional[list[str]] = Field(default=[], description="Documentos que faltan")


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