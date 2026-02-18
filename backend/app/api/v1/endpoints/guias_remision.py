"""
Endpoints para gestión de guías de remisión
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import GuiaRemision
from app.schemas import GuiaRemisionUpdate, GuiaRemisionResponse

router = APIRouter()


@router.get("/{documento_id}", response_model=GuiaRemisionResponse)
def obtener_guia_por_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """Obtener guía de remisión de un documento"""
    guia = db.query(GuiaRemision).filter(
        GuiaRemision.documento_id == documento_id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guía de remisión no encontrada"
        )
    
    return guia


@router.put("/{documento_id}", response_model=GuiaRemisionResponse)
def actualizar_guia(
    documento_id: int,
    guia_data: GuiaRemisionUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar datos de guía de remisión"""
    guia = db.query(GuiaRemision).filter(
        GuiaRemision.documento_id == documento_id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guía de remisión no encontrada"
        )
    
    # Actualizar campos
    for campo, valor in guia_data.dict(exclude_unset=True).items():
        setattr(guia, campo, valor)
    
    db.commit()
    db.refresh(guia)
    
    return guia