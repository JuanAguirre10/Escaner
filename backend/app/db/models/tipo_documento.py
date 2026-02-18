"""
Modelo de Tipo de Documento
Define los tipos: FACTURA, GUIA_REMISION, ORDEN_VENTA
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class TipoDocumento(Base):
    __tablename__ = "tipos_documento"
    __table_args__ = {'schema': 'documentos_db'}
    
    # ==================================
    # COLUMNAS PRINCIPALES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True, index=True)
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # ==================================
    # RELACIONES
    # ==================================
    documentos = relationship("Documento", back_populates="tipo_documento", lazy="dynamic")
    
    def __repr__(self):
        return f"<TipoDocumento {self.codigo} - {self.nombre}>"