"""
Endpoints para Tipos de Documento
FACTURA, GUIA_REMISION, ORDEN_VENTA
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import TipoDocumento
from app.schemas import (
    TipoDocumento as TipoDocumentoSchema,
    TipoDocumentoSimple,
)

router = APIRouter()


# ==================================
# LISTAR TIPOS DE DOCUMENTO
# ==================================

@router.get("/", response_model=List[TipoDocumentoSimple])
def listar_tipos_documento(
    solo_activos: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lista todos los tipos de documento
    
    **Parámetros:**
    - solo_activos: Si True, solo retorna tipos activos (por defecto True)
    
    **Tipos disponibles:**
    - FACTURA (activo)
    - GUIA_REMISION (inactivo por ahora)
    - ORDEN_VENTA (inactivo por ahora)
    """
    query = db.query(TipoDocumento)
    
    if solo_activos:
        query = query.filter(TipoDocumento.activo == True)
    
    tipos = query.order_by(TipoDocumento.id).all()
    return tipos


# ==================================
# OBTENER TIPO POR ID
# ==================================

@router.get("/{tipo_id}", response_model=TipoDocumentoSchema)
def obtener_tipo_documento(
    tipo_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene un tipo de documento por su ID"""
    tipo = db.query(TipoDocumento).filter(
        TipoDocumento.id == tipo_id
    ).first()
    
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tipo de documento con ID {tipo_id} no encontrado"
        )
    
    return tipo


# ==================================
# OBTENER TIPO POR CÓDIGO
# ==================================

@router.get("/codigo/{codigo}", response_model=TipoDocumentoSchema)
def obtener_tipo_por_codigo(
    codigo: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene un tipo de documento por su código
    
    **Códigos válidos:**
    - FACTURA
    - GUIA_REMISION
    - ORDEN_VENTA
    """
    codigo = codigo.upper()
    
    tipo = db.query(TipoDocumento).filter(
        TipoDocumento.codigo == codigo
    ).first()
    
    if not tipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tipo de documento '{codigo}' no encontrado"
        )
    
    return tipo