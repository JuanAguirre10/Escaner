"""
Modelo de Factura (Comprobante principal)
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


class Factura(Base):
    __tablename__ = "facturas"
    
    # ==================================
    # IDENTIFICADORES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    
    # ==================================
    # RELACIÓN CON PROVEEDOR
    # ==================================
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"), index=True)
    
    # ==================================
    # IDENTIFICACIÓN DE LA FACTURA
    # ==================================
    numero_factura = Column(String(50), nullable=False, index=True)
    serie = Column(String(10), nullable=False)
    correlativo = Column(String(20), nullable=False)
    tipo_comprobante = Column(String(20), default='FACTURA')
    
    # ==================================
    # FECHAS
    # ==================================
    fecha_emision = Column(Date, nullable=False, index=True)
    fecha_vencimiento = Column(Date)
    fecha_recepcion = Column(Date, server_default=func.current_date())
    
    # ==================================
    # DATOS DEL EMISOR (por si no está en catálogo)
    # ==================================
    ruc_emisor = Column(String(11), nullable=False, index=True)
    razon_social_emisor = Column(String(300), nullable=False, index=True)
    direccion_emisor = Column(Text)
    telefono_emisor = Column(String(50))
    email_emisor = Column(String(150))
    
    # ==================================
    # DATOS DEL CLIENTE (SUPERVAN)
    # ==================================
    ruc_cliente = Column(String(11), default='20516185211')
    razon_social_cliente = Column(String(300), default='SUPERVAN S.A.C.')
    direccion_cliente = Column(Text)
    
    # ==================================
    # ORDEN DE COMPRA
    # ==================================
    orden_compra = Column(String(50), index=True)
    numero_pedido = Column(String(50))
    
    # ==================================
    # GUÍA DE REMISIÓN
    # ==================================
    guia_remision_serie = Column(String(10))
    guia_remision_numero = Column(String(20))
    guia_remision_fecha = Column(Date)
    
    # ==================================
    # MONTOS FINANCIEROS
    # ==================================
    subtotal = Column(DECIMAL(15, 4), default=0.0)
    descuento_global = Column(DECIMAL(15, 4), default=0.0)
    operaciones_gravadas = Column(DECIMAL(15, 4), default=0.0)
    operaciones_inafectas = Column(DECIMAL(15, 4), default=0.0)
    operaciones_exoneradas = Column(DECIMAL(15, 4), default=0.0)
    operaciones_gratuitas = Column(DECIMAL(15, 4), default=0.0)
    igv = Column(DECIMAL(15, 4), default=0.0)
    otros_cargos = Column(DECIMAL(15, 4), default=0.0)
    total = Column(DECIMAL(15, 4), nullable=False)
    
    # ==================================
    # MONEDA
    # ==================================
    moneda = Column(String(3), default='PEN')
    tipo_cambio = Column(DECIMAL(10, 6))
    
    # ==================================
    # FORMA DE PAGO
    # ==================================
    forma_pago = Column(String(50))
    condicion_pago = Column(String(100))
    dias_credito = Column(Integer)
    numero_cuotas = Column(Integer)
    
    # ==================================
    # DATOS BANCARIOS
    # ==================================
    banco = Column(String(100))
    cuenta_bancaria = Column(String(50))
    cuenta_interbancaria = Column(String(50))
    
    # ==================================
    # ARCHIVOS
    # ==================================
    archivo_original_nombre = Column(String(300), nullable=False)
    archivo_original_url = Column(String(500), nullable=False)
    archivo_original_tipo = Column(String(20))
    archivo_original_size = Column(Integer)
    archivo_pdf_url = Column(String(500))
    archivo_imagen_url = Column(String(500))
    
    # ==================================
    # OCR Y PROCESAMIENTO
    # ==================================
    texto_ocr_completo = Column(Text)
    datos_ocr_json = Column(JSONB)
    confianza_ocr_promedio = Column(DECIMAL(5, 2))
    procesado_con = Column(String(50), default='google_vision')
    tiempo_procesamiento_segundos = Column(DECIMAL(8, 2))
    
    # ==================================
    # CONTROL DE ESTADO Y VALIDACIÓN
    # ==================================
    estado = Column(String(30), default='pendiente_validacion', index=True)
    # Estados: pendiente_validacion, validada, rechazada, duplicada, anulada
    
    es_duplicada = Column(Boolean, default=False)
    factura_original_id = Column(Integer, ForeignKey("facturas.id", ondelete="SET NULL"))
    
    validado = Column(Boolean, default=False, index=True)
    validado_por = Column(String(100))
    validado_at = Column(TIMESTAMP(timezone=True))
    
    # ==================================
    # OBSERVACIONES
    # ==================================
    observaciones = Column(Text)
    notas_internas = Column(Text)
    
    # ==================================
    # SISTEMA DE VERSIONES
    # ==================================
    version = Column(Integer, default=1, nullable=False)
    es_version_actual = Column(Boolean, default=True, index=True)
    version_anterior_id = Column(Integer, ForeignKey("facturas.id", ondelete="SET NULL"))
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
    proveedor = relationship("Proveedor", back_populates="facturas", foreign_keys=[proveedor_id])
    items = relationship("FacturaItem", back_populates="factura", cascade="all, delete-orphan", lazy="dynamic")
    
    # Relaciones de versiones
    factura_original = relationship("Factura", remote_side=[id], foreign_keys=[factura_original_id], backref="duplicadas")
    version_anterior = relationship("Factura", remote_side=[id], foreign_keys=[version_anterior_id], backref="versiones_posteriores")
    
    # ==================================
    # ÍNDICES COMPUESTOS
    # ==================================
    __table_args__ = (
        Index('idx_facturas_numero_version', 'numero_factura', 'version', unique=True),
        Index('idx_facturas_serie_correlativo', 'serie', 'correlativo'),
        Index('idx_facturas_guia_remision', 'guia_remision_serie', 'guia_remision_numero'),
    )
    
    def __repr__(self):
        return f"<Factura {self.numero_factura} - {self.razon_social_emisor} - S/ {self.total}>"