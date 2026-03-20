"""
Modelo para Expedientes
Agrupa documentos relacionados: OC + Factura + Guía + Nota
"""

from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Expediente(Base):
    __tablename__ = "expedientes"
    __table_args__ = {'schema': 'documentos_db'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificación
    codigo_expediente = Column(String(50), nullable=False, unique=True, index=True)
    numero_orden_compra = Column(String(50), nullable=False, index=True)
    
    # Empresa (Proveedor)
    empresa_id = Column(Integer, ForeignKey("documentos_db.empresas.id"), nullable=False, index=True)
    
    # Estado del expediente
    estado = Column(String(50), default='en_proceso', index=True)
    # Estados: en_proceso, completo, incompleto, cerrado, cerrado_manual
    
    # Fechas
    fecha_creacion = Column(Date, nullable=False)
    fecha_cierre = Column(Date, nullable=True)
    
    # Información adicional
    observaciones = Column(Text)

    # Documentos exentos (tipos que no se requieren para completitud)
    documentos_exentos = Column(JSON, default=list, nullable=True)

    # Cerrado manual (NUEVO)
    cerrado_manualmente = Column(Boolean, default=False)
    cerrado_por = Column(String(100), nullable=True)
    motivo_cierre = Column(Text, nullable=True)
    
    # Auditoría
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    created_by = Column(String(100), default='admin')
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="expedientes")
    documentos = relationship("Documento", back_populates="expediente")
    notas_entrega = relationship("NotaEntrega", back_populates="expediente")
    documentos_identidad = relationship("DocumentoIdentidad", back_populates="expediente", cascade="all, delete-orphan")