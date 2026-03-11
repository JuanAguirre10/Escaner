"""
Modelo para Documentos de Identidad
DNI, Carnet de Extranjería, Pasaporte, CPP de visitantes
"""

from sqlalchemy import Column, Integer, String, Text, Date, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class DocumentoIdentidad(Base):
    __tablename__ = "documentos_identidad"
    __table_args__ = {'schema': 'documentos_db'}
    
    id = Column(Integer, primary_key=True, index=True)
    expediente_id = Column(Integer, ForeignKey("documentos_db.expedientes.id", ondelete="CASCADE"), nullable=False, index=True)
    documento_id = Column(Integer, ForeignKey("documentos_db.documentos.id", ondelete="SET NULL"), nullable=True)
    
    # Tipo detectado automáticamente: DNI, CARNET_EXTRANJERIA, PASAPORTE, CPP, OTRO
    tipo_documento = Column(String(50), nullable=False, index=True)
    
    # Datos principales (SIEMPRE extraídos)
    numero_documento = Column(String(50), nullable=False, index=True)
    nombres = Column(String(200))
    apellidos = Column(String(200))
    nombre_completo = Column(String(400))
    
    # Datos opcionales
    nacionalidad = Column(String(100))
    fecha_nacimiento = Column(Date)
    fecha_emision = Column(Date)
    fecha_vencimiento = Column(Date)
    sexo = Column(String(10))
    
    # Datos de la visita
    fecha_visita = Column(TIMESTAMP(timezone=True), server_default=func.now())
    motivo_visita = Column(Text)
    empresa_visitante = Column(String(200))
    cargo = Column(String(100))
    
    # OCR completo
    datos_ocr_completos = Column(JSONB)
    
    # Auditoría
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    created_by = Column(String(100), default='admin')
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relaciones
    expediente = relationship("Expediente", back_populates="documentos_identidad")
    documento = relationship("Documento", foreign_keys=[documento_id])