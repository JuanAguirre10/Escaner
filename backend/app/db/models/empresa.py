"""
Modelo de Empresa (antes Proveedor)
Empresas que emiten documentos (facturas, guías, órdenes)
"""

from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = {'schema': 'documentos_db'}
    
    # ==================================
    # COLUMNAS PRINCIPALES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    ruc = Column(String(11), unique=True, nullable=False, index=True)
    razon_social = Column(String(500), nullable=False, index=True)
    direccion = Column(Text)
    telefono = Column(String(50))
    email = Column(String(255))
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(TIMESTAMP(timezone=True))
    deleted_by = Column(String(100))
    
    # ==================================
    # RELACIONES
    # ==================================
    documentos = relationship("Documento", back_populates="empresa", lazy="dynamic")
    
    def __repr__(self):
        return f"<Empresa {self.ruc} - {self.razon_social}>"