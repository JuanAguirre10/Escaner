"""
Modelo para Notas de Entrega
Documento manual de recepción de mercadería
"""

from sqlalchemy import Column, Integer, String, Date, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class NotaEntrega(Base):
    __tablename__ = "notas_entrega"
    __table_args__ = {'schema': 'documentos_db'}
    
    id = Column(Integer, primary_key=True, index=True)
    expediente_id = Column(Integer, ForeignKey("documentos_db.expedientes.id"), nullable=True, index=True)
    
    # Identificación
    numero_nota = Column(String(50), nullable=False, unique=True, index=True)
    fecha_recepcion = Column(Date, nullable=False)
    
    # Recepción
    recibido_por = Column(String(200))
    estado_mercaderia = Column(String(50))  # conforme, no_conforme, parcial
    observaciones = Column(Text)
    
    # Referencias a otros documentos
    orden_compra_numero = Column(String(50), index=True)
    factura_numero = Column(String(50))
    guia_numero = Column(String(50))
    
    # Auditoría
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    created_by = Column(String(100))
    
    # Relaciones
    expediente = relationship("Expediente", back_populates="notas_entrega")