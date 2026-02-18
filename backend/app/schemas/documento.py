"""
Schemas Pydantic para Documento (antes Factura)
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from app.schemas.documento_item import DocumentoItem, DocumentoItemCreate
from app.schemas.empresa import EmpresaSimple
from app.schemas.tipo_documento import TipoDocumentoSimple
from app.schemas.guia_remision import GuiaRemisionResponse

# ==================================
# SCHEMAS BASE
# ==================================

class DocumentoBase(BaseModel):
    """Campos comunes de Documento"""
    # Identificación
    numero_documento: str = Field(..., max_length=50, description="Número completo del documento")
    serie: str = Field(..., max_length=10)
    correlativo: str = Field(..., max_length=20)
    tipo_comprobante: str = Field(default="FACTURA", max_length=50)
    guia_remision: Optional[str] = Field(None, max_length=50)
    
    # Fechas
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    
    # Datos del emisor
    ruc_emisor: str = Field(..., min_length=11, max_length=11)
    razon_social_emisor: str = Field(..., max_length=500)
    direccion_emisor: Optional[str] = None
    telefono_emisor: Optional[str] = Field(None, max_length=50)
    email_emisor: Optional[str] = Field(None, max_length=255)
    
    # Datos del cliente (SUPERVAN)
    ruc_cliente: Optional[str] = Field(None, max_length=11)
    razon_social_cliente: Optional[str] = Field(None, max_length=500)
    direccion_cliente: Optional[str] = None
    
    # Orden de compra
    orden_compra: Optional[str] = Field(None, max_length=50)
    
    # Montos
    subtotal: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    igv: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    total: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Moneda
    moneda: Optional[str] = Field(None, max_length=3)
    
    # Forma de pago
    forma_pago: Optional[str] = Field(None, max_length=50)
    condicion_pago: Optional[str] = Field(None, max_length=200)
    
    # Observaciones
    observaciones: Optional[str] = None
    notas_internas: Optional[str] = None
    
    @field_validator('ruc_emisor', 'ruc_cliente')
    @classmethod
    def validar_ruc(cls, v: Optional[str]) -> Optional[str]:
        """Validar que el RUC sea solo números de 11 dígitos"""
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 11:
            raise ValueError('El RUC debe tener 11 dígitos')
        return v
    
    @field_validator('moneda')
    @classmethod
    def validar_moneda(cls, v: Optional[str]) -> Optional[str]:
        """Validar que la moneda sea PEN, USD o EUR"""
        if v is None:
            return None
        v = v.upper()
        if v not in ['PEN', 'USD', 'EUR']:
            raise ValueError('La moneda debe ser PEN, USD o EUR')
        return v


# ==================================
# SCHEMA PARA CREAR DOCUMENTO
# ==================================

class DocumentoCreate(DocumentoBase):
    """Schema para crear un nuevo documento"""
    empresa_id: Optional[int] = None
    tipo_documento_id: Optional[int] = None
    archivo_original_nombre: Optional[str] = None
    archivo_original_url: Optional[str] = None
    archivo_original_tipo: Optional[str] = None
    archivo_original_size: Optional[int] = None
    items: List[DocumentoItemCreate] = Field(default_factory=list)


# ==================================
# SCHEMA PARA ACTUALIZAR DOCUMENTO
# ==================================

class DocumentoUpdate(BaseModel):
    """Schema para actualizar documento (todos opcionales)"""
    numero_documento: Optional[str] = None
    serie: Optional[str] = None
    correlativo: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    ruc_emisor: Optional[str] = None
    razon_social_emisor: Optional[str] = None
    direccion_emisor: Optional[str] = None
    orden_compra: Optional[str] = None
    guia_remision: Optional[str] = None
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

class DocumentoInDB(DocumentoBase):
    """Schema que representa un documento en la base de datos"""
    id: int
    uuid: UUID
    empresa_id: Optional[int]
    tipo_documento_id: Optional[int]
    
    # Archivos
    archivo_original_nombre: Optional[str]
    archivo_original_url: Optional[str]
    archivo_original_tipo: Optional[str]
    archivo_original_size: Optional[int]
    
    # OCR
    texto_ocr_completo: Optional[str]
    confianza_ocr_promedio: Optional[Decimal]
    procesado_con: Optional[str]
    tiempo_procesamiento_segundos: Optional[Decimal]
    
    # Estado
    estado: str
    es_duplicada: bool
    documento_original_id: Optional[int]
    validado: bool
    validado_por: Optional[str]
    validado_en: Optional[datetime]
    
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

class Documento(DocumentoInDB):
    """Schema público para respuestas de la API"""
    empresa: Optional[EmpresaSimple] = None
    tipo_documento: Optional[TipoDocumentoSimple] = None
    items: List[DocumentoItem] = Field(default_factory=list)
    datos_guia_remision: Optional[GuiaRemisionResponse] = None


# ==================================
# SCHEMA SIMPLIFICADO PARA LISTADOS
# ==================================

class DocumentoSimple(BaseModel):
    """Schema simplificado para listados"""
    id: int
    uuid: UUID
    numero_documento: str
    fecha_emision: date
    ruc_emisor: str
    razon_social_emisor: str
    total: Optional[Decimal] = None
    moneda: Optional[str] = None
    estado: str
    validado: bool
    confianza_ocr_promedio: Optional[Decimal]
    created_at: datetime
    tipo_documento_id: Optional[int] = None
    tipo_documento: Optional[TipoDocumentoSimple] = None
    datos_guia_remision: Optional[GuiaRemisionResponse] = None
    
    class Config:
        from_attributes = True


# ==================================
# SCHEMA PARA RESPUESTA DE OCR
# ==================================

class DocumentoOCRResponse(BaseModel):
    """Respuesta después de procesar OCR"""
    documento_id: int
    uuid: str
    numero_documento: Optional[str]
    datos_extraidos: dict
    confianza_promedio: Optional[float]
    tiempo_procesamiento: Optional[float]
    estado: str
    mensaje: str