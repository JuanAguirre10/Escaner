"""
Modelo de Expediente
Agrupa documentos relacionados (factura + guía + orden de compra)
"""

from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Expediente(Base):
    __tablename__ = "expedientes"
    __table_args__ = {'schema': 'documentos_db'}
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("documentos_db.empresas.id"), nullable=False)
    
    # Identificador único del expediente
    numero_expediente = Column(String(50), unique=True, nullable=False, index=True)
    
    # Descripción
    descripcion = Column(Text)
    
    # Auditoría
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    created_by = Column(String(100), default='admin')
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="expedientes")
    documentos = relationship("Documento", back_populates="expediente", cascade="all, delete-orphan")