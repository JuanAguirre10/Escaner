"""
Schemas Pydantic para Factura
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from app.schemas.item import FacturaItem, FacturaItemCreate
from app.schemas.proveedor import ProveedorSimple


# ==================================
# SCHEMAS BASE
# ==================================

class FacturaBase(BaseModel):
    """Campos comunes de Factura"""
    # Identificación
    numero_factura: str = Field(..., max_length=50, description="Número completo de factura (serie-correlativo)")
    serie: str = Field(..., max_length=10)
    correlativo: str = Field(..., max_length=20)
    tipo_comprobante: str = Field(default="FACTURA", max_length=20)
    
    # Fechas
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    fecha_recepcion: Optional[date] = None
    
    # Datos del emisor
    ruc_emisor: str = Field(..., min_length=11, max_length=11)
    razon_social_emisor: str = Field(..., max_length=300)
    direccion_emisor: Optional[str] = None
    telefono_emisor: Optional[str] = Field(None, max_length=50)
    email_emisor: Optional[str] = Field(None, max_length=150)
    
    # Datos del cliente (SUPERVAN)
    ruc_cliente: str = Field(default="20516185211", max_length=11)
    razon_social_cliente: str = Field(default="SUPERVAN S.A.C.", max_length=300)
    direccion_cliente: Optional[str] = None
    
    # Orden de compra
    orden_compra: Optional[str] = Field(None, max_length=50)
    numero_pedido: Optional[str] = Field(None, max_length=50)
    
    # Guía de remisión
    guia_remision_serie: Optional[str] = Field(None, max_length=10)
    guia_remision_numero: Optional[str] = Field(None, max_length=20)
    guia_remision_fecha: Optional[date] = None
    
    # Montos
    subtotal: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    descuento_global: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    operaciones_gravadas: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    operaciones_inafectas: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    operaciones_exoneradas: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    operaciones_gratuitas: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    igv: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    otros_cargos: Decimal = Field(default=0.0, ge=0, decimal_places=4)
    total: Decimal = Field(..., gt=0, decimal_places=4)
    
    # Moneda
    moneda: str = Field(default="PEN", max_length=3)
    tipo_cambio: Optional[Decimal] = Field(None, decimal_places=6)
    
    # Forma de pago
    forma_pago: Optional[str] = Field(None, max_length=50)
    condicion_pago: Optional[str] = Field(None, max_length=100)
    dias_credito: Optional[int] = Field(None, ge=0)
    numero_cuotas: Optional[int] = Field(None, ge=1)
    
    # Datos bancarios
    banco: Optional[str] = Field(None, max_length=100)
    cuenta_bancaria: Optional[str] = Field(None, max_length=50)
    cuenta_interbancaria: Optional[str] = Field(None, max_length=50)
    
    # Observaciones
    observaciones: Optional[str] = None
    notas_internas: Optional[str] = None
    
    @field_validator('ruc_emisor', 'ruc_cliente')
    @classmethod
    def validar_ruc(cls, v: str) -> str:
        """Validar que el RUC sea solo números de 11 dígitos"""
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v
    
    @field_validator('moneda')
    @classmethod
    def validar_moneda(cls, v: str) -> str:
        """Validar que la moneda sea PEN o USD"""
        v = v.upper()
        if v not in ['PEN', 'USD', 'EUR']:
            raise ValueError('La moneda debe ser PEN, USD o EUR')
        return v


# ==================================
# SCHEMA PARA CREAR FACTURA
# ==================================

class FacturaCreate(FacturaBase):
    """Schema para crear una nueva factura"""
    proveedor_id: Optional[int] = None
    archivo_original_nombre: str
    archivo_original_url: str
    archivo_original_tipo: Optional[str] = None
    archivo_original_size: Optional[int] = None
    items: List[FacturaItemCreate] = Field(default_factory=list)


# ==================================
# SCHEMA PARA ACTUALIZAR FACTURA
# ==================================

class FacturaUpdate(BaseModel):
    """Schema para actualizar factura (todos opcionales)"""
    numero_factura: Optional[str] = None
    serie: Optional[str] = None
    correlativo: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    ruc_emisor: Optional[str] = None
    razon_social_emisor: Optional[str] = None
    direccion_emisor: Optional[str] = None
    orden_compra: Optional[str] = None
    guia_remision_serie: Optional[str] = None
    guia_remision_numero: Optional[str] = None
    guia_remision_fecha: Optional[date] = None
    subtotal: Optional[Decimal] = None
    igv: Optional[Decimal] = None
    total: Optional[Decimal] = None
    moneda: Optional[str] = None
    forma_pago: Optional[str] = None
    condicion_pago: Optional[str] = None
    observaciones: Optional[str] = None
    notas_internas: Optional[str] = None
    estado: Optional[str] = None
    validado: Optional[bool] = None


# ==================================
# SCHEMA PARA RESPUESTA (DB)
# ==================================

class FacturaInDB(FacturaBase):
    """Schema que representa una factura en la base de datos"""
    id: int
    uuid: UUID
    proveedor_id: Optional[int]
    
    # Archivos
    archivo_original_nombre: str
    archivo_original_url: str
    archivo_original_tipo: Optional[str]
    archivo_original_size: Optional[int]
    archivo_pdf_url: Optional[str]
    archivo_imagen_url: Optional[str]
    
    # OCR
    texto_ocr_completo: Optional[str]
    confianza_ocr_promedio: Optional[Decimal]
    procesado_con: str
    tiempo_procesamiento_segundos: Optional[Decimal]
    
    # Estado
    estado: str
    es_duplicada: bool
    factura_original_id: Optional[int]
    validado: bool
    validado_por: Optional[str]
    validado_at: Optional[datetime]
    
    # Versiones
    version: int
    es_version_actual: bool
    version_anterior_id: Optional[int]
    motivo_nueva_version: Optional[str]
    
    # Auditoría
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    deleted_at: Optional[datetime]
    deleted_by: Optional[str]
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PÚBLICO (RESPONSE)
# ==================================

class Factura(FacturaInDB):
    """Schema público para respuestas de la API"""
    proveedor: Optional[ProveedorSimple] = None
    items: List[FacturaItem] = Field(default_factory=list)


# ==================================
# SCHEMA SIMPLIFICADO PARA LISTADOS
# ==================================

class FacturaSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    uuid: UUID
    numero_factura: str
    fecha_emision: date
    ruc_emisor: str
    razon_social_emisor: str
    total: Decimal
    moneda: str
    estado: str
    validado: bool
    confianza_ocr_promedio: Optional[Decimal]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PARA RESPUESTA DE OCR
# ==================================

class FacturaOCRResponse(BaseModel):
    """Respuesta después de procesar OCR"""
    factura_id: int
    uuid: str
    numero_factura: Optional[str]
    datos_extraidos: dict
    confianza_promedio: Optional[float]
    tiempo_procesamiento: Optional[float]
    estado: str
    mensaje: str