"""
Modelo de Documento (antes Factura)
Almacena facturas, guías de remisión, órdenes de venta
"""

from sqlalchemy import (
    Column, Integer, String, Date, TIMESTAMP, Text, 
    Boolean, DECIMAL, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.db.base import Base


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = (
        Index('idx_documentos_numero_version', 'numero_documento', 'version', unique=True),
        Index('idx_documentos_serie_correlativo', 'serie', 'correlativo'),
        {'schema': 'documentos_db'}
    )
    
    # ==================================
    # IDENTIFICADORES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    
    # ==================================
    # RELACIONES CON EMPRESA Y TIPO
    # ==================================
    empresa_id = Column(Integer, ForeignKey("documentos_db.empresas.id", ondelete="SET NULL"), index=True)
    expediente_id = Column(Integer, ForeignKey("documentos_db.expedientes.id"), nullable=True, index=True)
    tipo_documento_id = Column(Integer, ForeignKey("documentos_db.tipos_documento.id", ondelete="SET NULL"), index=True)
    
    # ==================================
    # IDENTIFICACIÓN DEL DOCUMENTO
    # ==================================
    numero_documento = Column(String(50), nullable=False, index=True)
    serie = Column(String(10), nullable=False)
    correlativo = Column(String(20), nullable=False)
    tipo_comprobante = Column(String(50), default='FACTURA')
    guia_remision = Column(String(50))
    
    # ==================================
    # FECHAS
    # ==================================
    fecha_emision = Column(Date, nullable=False, index=True)
    fecha_vencimiento = Column(Date)
    
    # ==================================
    # DATOS DEL EMISOR (EMPRESA)
    # ==================================
    ruc_emisor = Column(String(11), nullable=False, index=True)
    razon_social_emisor = Column(String(500), nullable=False)
    direccion_emisor = Column(Text)
    telefono_emisor = Column(String(50))
    email_emisor = Column(String(255))
    
    # ==================================
    # DATOS DEL CLIENTE (SUPERVAN)
    # ==================================
    ruc_cliente = Column(String(11))
    razon_social_cliente = Column(String(500))
    direccion_cliente = Column(Text)
    
    # ==================================
    # DATOS COMERCIALES
    # ==================================
    orden_compra = Column(String(50))
    
    # ==================================
    # MONTOS
    # ==================================
    subtotal = Column(DECIMAL(15, 2), nullable=True)
    igv = Column(DECIMAL(15, 2), nullable=True)
    total = Column(DECIMAL(15, 2), nullable=True)
    moneda = Column(String(3), nullable=True)
    
    # ==================================
    # FORMA DE PAGO
    # ==================================
    forma_pago = Column(String(50))
    condicion_pago = Column(String(200))
    
    # ==================================
    # ARCHIVOS
    # ==================================
    archivo_original_nombre = Column(String(255))
    archivo_original_url = Column(Text)
    archivo_original_tipo = Column(String(10))
    archivo_original_size = Column(Integer)
    
    # ==================================
    # DATOS OCR
    # ==================================
    texto_ocr_completo = Column(Text)
    datos_ocr_json = Column(Text)
    confianza_ocr_promedio = Column(DECIMAL(5, 2))
    procesado_con = Column(String(50))
    tiempo_procesamiento_segundos = Column(DECIMAL(8, 2))
    
    # ==================================
    # ESTADO Y VALIDACIÓN
    # ==================================
    estado = Column(String(50), nullable=False, default='pendiente_validacion', index=True)
    
    validado = Column(Boolean, default=False)
    validado_por = Column(String(100))
    validado_en = Column(TIMESTAMP(timezone=True))
    
    rechazado_por = Column(String(100))
    rechazado_en = Column(TIMESTAMP(timezone=True))
    motivo_rechazo = Column(Text)
    
    # ==================================
    # SISTEMA DE DUPLICADOS
    # ==================================
    es_duplicada = Column(Boolean, default=False)
    documento_original_id = Column(Integer, ForeignKey("documentos_db.documentos.id", ondelete="SET NULL"))
    
    # ==================================
    # OBSERVACIONES
    # ==================================
    observaciones = Column(Text)
    notas_internas = Column(Text)
    
    # ==================================
    # SISTEMA DE VERSIONES
    # ==================================
    version = Column(Integer, nullable=False, default=1)
    es_version_actual = Column(Boolean, default=True, index=True)
    version_anterior_id = Column(Integer, ForeignKey("documentos_db.documentos.id", ondelete="SET NULL"))
    motivo_nueva_version = Column(Text)
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(100), default='admin')
    updated_by = Column(String(100), default='admin')
    deleted_at = Column(TIMESTAMP(timezone=True))
    deleted_by = Column(String(100))
    
    # ==================================
    # RELACIONES
    # ==================================
    empresa = relationship("Empresa", back_populates="documentos", foreign_keys=[empresa_id])
    expediente = relationship("Expediente", back_populates="documentos")
    tipo_documento = relationship("TipoDocumento", back_populates="documentos", foreign_keys=[tipo_documento_id])
    items = relationship("DocumentoItem", back_populates="documento", cascade="all, delete-orphan", lazy="dynamic")
    datos_guia_remision = relationship("GuiaRemision", back_populates="documento", uselist=False, cascade="all, delete-orphan")
    
    # Relaciones de versiones
    documento_original = relationship("Documento", remote_side=[id], foreign_keys=[documento_original_id], backref="duplicados")
    version_anterior = relationship("Documento", remote_side=[id], foreign_keys=[version_anterior_id], backref="versiones_posteriores")
    
    # Relación con Orden de Compra
    datos_orden_compra = relationship(
        "OrdenCompra", 
        back_populates="documento", 
        uselist=False, 
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Documento {self.numero_documento} - {self.razon_social_emisor} - {self.moneda} {self.total}>"