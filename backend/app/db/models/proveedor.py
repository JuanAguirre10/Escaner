"""
Modelo de Proveedor (Emisor de facturas)
"""

from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Proveedor(Base):
    __tablename__ = "proveedores"
    
    # ==================================
    # COLUMNAS PRINCIPALES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    ruc = Column(String(11), unique=True, nullable=False, index=True)
    razon_social = Column(String(300), nullable=False, index=True)
    nombre_comercial = Column(String(300))
    direccion = Column(Text)
    telefono = Column(String(50))
    email = Column(String(150))
    
    # ==================================
    # DATOS ADICIONALES
    # ==================================
    pagina_web = Column(String(200))
    contacto_nombre = Column(String(200))
    contacto_cargo = Column(String(100))
    
    # ==================================
    # CONTROL
    # ==================================
    activo = Column(Boolean, default=True, index=True)
    notas = Column(Text)
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(100), default='admin')
    updated_by = Column(String(100), default='admin')
    
    # ==================================
    # RELACIONES
    # ==================================
    facturas = relationship("Factura", back_populates="proveedor", lazy="dynamic")
    
    def __repr__(self):
        return f"<Proveedor {self.ruc} - {self.razon_social}>"