"""
Modelo de Item de Factura (Productos/Servicios)
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, DECIMAL, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class FacturaItem(Base):
    __tablename__ = "facturas_items"
    
    # ==================================
    # COLUMNAS PRINCIPALES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # ==================================
    # ORDEN EN LA FACTURA
    # ==================================
    orden = Column(Integer, nullable=False, default=1)
    
    # ==================================
    # IDENTIFICACIÓN DEL PRODUCTO
    # ==================================
    codigo_producto = Column(String(100), index=True)
    codigo_interno = Column(String(100))
    codigo_sunat = Column(String(20))
    
    # ==================================
    # DESCRIPCIÓN
    # ==================================
    descripcion = Column(Text, nullable=False)
    descripcion_adicional = Column(Text)
    marca = Column(String(100))
    modelo = Column(String(100))
    
    # ==================================
    # CANTIDADES Y UNIDADES
    # ==================================
    cantidad = Column(DECIMAL(15, 4), nullable=False)
    unidad_medida = Column(String(20), default='UND')
    
    # ==================================
    # PRECIOS
    # ==================================
    precio_unitario = Column(DECIMAL(15, 4), nullable=False)
    valor_unitario = Column(DECIMAL(15, 4))
    
    # ==================================
    # DESCUENTOS
    # ==================================
    descuento_porcentaje = Column(DECIMAL(5, 2), default=0.0)
    descuento_monto = Column(DECIMAL(15, 4), default=0.0)
    
    # ==================================
    # VALORES
    # ==================================
    valor_venta = Column(DECIMAL(15, 4), nullable=False)
    valor_total = Column(DECIMAL(15, 4), nullable=False)
    
    # ==================================
    # IGV POR ITEM
    # ==================================
    igv_item = Column(DECIMAL(15, 4), default=0.0)
    afecto_igv = Column(Boolean, default=True)
    
    # ==================================
    # OBSERVACIONES
    # ==================================
    notas = Column(Text)
    
    # ==================================
    # OCR DEL ITEM
    # ==================================
    confianza_ocr = Column(DECIMAL(5, 2))
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # ==================================
    # RELACIONES
    # ==================================
    factura = relationship("Factura", back_populates="items")
    
    # ==================================
    # ÍNDICES
    # ==================================
    __table_args__ = (
        Index('idx_items_factura_orden', 'factura_id', 'orden'),
    )
    
    def __repr__(self):
        return f"<FacturaItem {self.codigo_producto} - {self.descripcion[:30]}... x {self.cantidad}>"