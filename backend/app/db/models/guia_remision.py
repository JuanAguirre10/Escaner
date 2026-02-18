"""
Modelo SQLAlchemy para Guías de Remisión
"""

from sqlalchemy import Column, Integer, String, Date, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class GuiaRemision(Base):
    """Modelo para guías de remisión electrónicas"""
    __tablename__ = "guias_remision"
    __table_args__ = {"schema": "documentos_db"}
    
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos_db.documentos.id", ondelete="CASCADE"), nullable=False)
    
    # Datos del traslado
    numero_guia = Column(String(50), nullable=False)
    fecha_traslado = Column(Date)
    motivo_traslado = Column(String(100))
    modalidad_transporte = Column(String(50))
    
    # Puntos
    punto_partida = Column(Text)
    punto_llegada = Column(Text)
    
    # Transportista
    transportista_razon_social = Column(String(255))
    transportista_ruc = Column(String(11))
    
    # Vehículo
    vehiculo_placa = Column(String(20))
    vehiculo_mtc = Column(String(50))
    
    # Conductor
    conductor_nombre = Column(String(255))
    conductor_dni = Column(String(8))
    conductor_licencia = Column(String(20))
    
    # Carga
    peso_bruto = Column(Numeric(10, 2))
    unidad_peso = Column(String(10), default="KGM")
    transbordo_programado = Column(Boolean, default=False)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación
    documento = relationship("Documento", back_populates="datos_guia_remision")