"""
Modelo de Item de Documento (antes FacturaItem)
Items/productos/servicios de cada documento
"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, DECIMAL, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class DocumentoItem(Base):
    __tablename__ = "documentos_items"
    __table_args__ = (
        Index('idx_items_documento_orden', 'documento_id', 'orden'),
        {'schema': 'documentos_db'}
    )
    
    # ==================================
    # COLUMNAS PRINCIPALES
    # ==================================
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos_db.documentos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # ==================================
    # ORDEN
    # ==================================
    orden = Column(Integer, nullable=False)
    
    # ==================================
    # IDENTIFICACIÓN DEL PRODUCTO
    # ==================================
    codigo_producto = Column(String(100), index=True)
    
    # ==================================
    # DESCRIPCIÓN
    # ==================================
    descripcion = Column(Text, nullable=False)
    detalle_adicional = Column(Text)
    
    # ==================================
    # CANTIDADES
    # ==================================
    cantidad = Column(DECIMAL(15, 4), nullable=False, default=1.0000)
    unidad_medida = Column(String(10), default='UND')
    peso_bruto = Column(DECIMAL(15, 4), default=0.0000)
    
    # ==================================
    # PRECIOS
    # ==================================
    precio_unitario = Column(DECIMAL(15, 2), nullable=False, default=0.00)
    descuento_porcentaje = Column(DECIMAL(5, 2), default=0.00)
    valor_venta = Column(DECIMAL(15, 2), nullable=False, default=0.00)
    valor_total = Column(DECIMAL(15, 2), nullable=False, default=0.00)
    
    # ==================================
    # IGV
    # ==================================
    igv_item = Column(DECIMAL(15, 2), default=0.00)
    total_item = Column(DECIMAL(15, 2), default=0.00)
    
    # ==================================
    # AUDITORÍA
    # ==================================
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # ==================================
    # RELACIONES
    # ==================================
    documento = relationship("Documento", back_populates="items")
    
    def __repr__(self):
        return f"<DocumentoItem {self.codigo_producto} - {self.descripcion[:30]}... x {self.cantidad}>"