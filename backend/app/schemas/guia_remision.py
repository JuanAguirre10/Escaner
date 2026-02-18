"""
Schemas Pydantic para Guías de Remisión
"""

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class GuiaRemisionBase(BaseModel):
    """Schema base para guía de remisión"""
    numero_guia: str
    fecha_traslado: Optional[date] = None
    motivo_traslado: Optional[str] = None
    modalidad_transporte: Optional[str] = None
    punto_partida: Optional[str] = None
    punto_llegada: Optional[str] = None
    transportista_razon_social: Optional[str] = None
    transportista_ruc: Optional[str] = None
    vehiculo_placa: Optional[str] = None
    vehiculo_mtc: Optional[str] = None
    conductor_nombre: Optional[str] = None
    conductor_dni: Optional[str] = None
    conductor_licencia: Optional[str] = None
    peso_bruto: Optional[Decimal] = None
    unidad_peso: str = "KGM"
    transbordo_programado: bool = False


class GuiaRemisionCreate(GuiaRemisionBase):
    """Schema para crear guía de remisión"""
    documento_id: int


class GuiaRemisionUpdate(BaseModel):
    """Schema para actualizar guía de remisión"""
    fecha_traslado: Optional[date] = None
    motivo_traslado: Optional[str] = None
    punto_partida: Optional[str] = None
    punto_llegada: Optional[str] = None
    transportista_razon_social: Optional[str] = None
    transportista_ruc: Optional[str] = None
    vehiculo_placa: Optional[str] = None
    conductor_nombre: Optional[str] = None
    conductor_dni: Optional[str] = None
    conductor_licencia: Optional[str] = None
    peso_bruto: Optional[Decimal] = None


class GuiaRemisionResponse(GuiaRemisionBase):
    """Schema para respuesta con ID y timestamps"""
    id: int
    documento_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True