"""
Modelo de Orden de Compra
Almacena órdenes de compra emitidas por SUPERVAN a proveedores
"""

from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"
    __table_args__ = {'schema': 'documentos_db'}
    
    # ==================================
    # IDENTIFICADORES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(
        Integer, 
        ForeignKey("documentos_db.documentos.id", ondelete="CASCADE"), 
        nullable=False,
        unique=True,
        index=True
    )
    
    # ==================================
    # IDENTIFICACIÓN DE LA OC
    # ==================================
    numero_orden_compra = Column(String(50), nullable=False, unique=True, index=True)
    serie_orden = Column(String(10))
    correlativo_orden = Column(String(20))
    
    # ==================================
    # COMPRADOR (SUPERVAN)
    # ==================================
    ruc_comprador = Column(String(11), nullable=False)
    razon_social_comprador = Column(String(500))
    direccion_comprador = Column(Text)
    telefono_comprador = Column(String(50))
    
    # ==================================
    # PROVEEDOR
    # ==================================
    ruc_proveedor = Column(String(11), nullable=False, index=True)
    razon_social_proveedor = Column(String(500))
    direccion_proveedor = Column(Text)
    
    # ==================================
    # FECHAS Y ENTREGA
    # ==================================
    fecha_entrega = Column(Date)
    direccion_entrega = Column(Text)
    
    # ==================================
    # CONDICIONES COMERCIALES
    # ==================================
    modo_pago = Column(String(100))
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    
    # ==================================
    # RELACIONES
    # ==================================
    documento = relationship("Documento", back_populates="datos_orden_compra")
    
    def __repr__(self):
        return f"<OrdenCompra {self.numero_orden_compra} - {self.razon_social_proveedor}>"