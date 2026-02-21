"""
Endpoints para Notas de Entrega
Documentos manuales de recepción
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.db.models import NotaEntrega
from app.schemas import (
    NotaEntregaCreate,
    NotaEntregaUpdate,
    NotaEntregaResponse
)

router = APIRouter()


@router.get("/", response_model=List[NotaEntregaResponse])
def listar_notas(
    skip: int = 0,
    limit: int = 100,
    orden_compra_numero: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista todas las notas de entrega"""
    query = db.query(NotaEntrega)
    
    if orden_compra_numero:
        query = query.filter(NotaEntrega.orden_compra_numero == orden_compra_numero)
    
    notas = query.order_by(NotaEntrega.created_at.desc()).offset(skip).limit(limit).all()
    return notas


@router.get("/{nota_id}", response_model=NotaEntregaResponse)
def obtener_nota(
    nota_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene una nota de entrega por ID"""
    nota = db.query(NotaEntrega).filter(NotaEntrega.id == nota_id).first()
    
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota de entrega con ID {nota_id} no encontrada"
        )
    
    return nota


@router.post("/", response_model=NotaEntregaResponse, status_code=status.HTTP_201_CREATED)
def crear_nota(
    nota: NotaEntregaCreate,
    db: Session = Depends(get_db)
):
    """Crea una nueva nota de entrega"""
    # Verificar que no exista el número
    print(f"📝 CREANDO NOTA: {nota.model_dump()}")
    
    nota_existente = db.query(NotaEntrega).filter(
        NotaEntrega.numero_nota == nota.numero_nota
    ).first()
    
    if nota_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una nota con el número {nota.numero_nota}"
        )
    
    nueva_nota = NotaEntrega(**nota.model_dump())
    db.add(nueva_nota)
    db.commit()
    db.refresh(nueva_nota)
    
    return nueva_nota


@router.put("/{nota_id}", response_model=NotaEntregaResponse)
def actualizar_nota(
    nota_id: int,
    nota_update: NotaEntregaUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza una nota de entrega"""
    nota = db.query(NotaEntrega).filter(NotaEntrega.id == nota_id).first()
    
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota de entrega con ID {nota_id} no encontrada"
        )
    
    update_data = nota_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(nota, field, value)
    
    db.commit()
    db.refresh(nota)
    
    return nota


@router.delete("/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_nota(
    nota_id: int,
    db: Session = Depends(get_db)
):
    """Elimina una nota de entrega"""
    nota = db.query(NotaEntrega).filter(NotaEntrega.id == nota_id).first()
    
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota de entrega con ID {nota_id} no encontrada"
        )
    
    db.delete(nota)
    db.commit()
    
    return None


@router.get("/por-orden/{orden_compra_numero}", response_model=List[NotaEntregaResponse])
def obtener_notas_por_orden(
    orden_compra_numero: str,
    db: Session = Depends(get_db)
):
    """Obtiene todas las notas asociadas a una orden de compra"""
    notas = db.query(NotaEntrega).filter(
        NotaEntrega.orden_compra_numero == orden_compra_numero
    ).all()
    
    return notas