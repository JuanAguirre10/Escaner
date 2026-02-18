"""
Endpoints para Documentos (antes Facturas)
CRUD completo para documentos: facturas, guías, órdenes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_
from typing import List, Optional
from datetime import date

from app.db.session import get_db
from app.db.models import Documento, DocumentoItem, Empresa, TipoDocumento
from app.schemas import (
    Documento as DocumentoSchema,
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoSimple,
)

router = APIRouter()


# ==================================
# LISTAR DOCUMENTOS
# ==================================

@router.get("/", response_model=List[DocumentoSimple])
def listar_documentos(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    tipo_documento_id: Optional[int] = None,
    empresa_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista documentos con filtros opcionales
    
    **Filtros:**
    - estado: pendiente_validacion, validada, rechazada
    - tipo_documento_id: 1 (FACTURA), 2 (GUIA_REMISION), 3 (ORDEN_VENTA)
    - empresa_id: ID de la empresa emisora
    - fecha_desde, fecha_hasta: Rango de fechas de emisión
    - buscar: Busca en número, RUC o razón social
    """
    # Query con joinedload para incluir guía de remisión
    query = db.query(Documento).options(
        joinedload(Documento.datos_guia_remision)
    ).filter(
        Documento.deleted_at.is_(None),
        Documento.es_version_actual == True
    )
    
    # Aplicar filtros
    if estado:
        query = query.filter(Documento.estado == estado)
    
    if tipo_documento_id:
        query = query.filter(Documento.tipo_documento_id == tipo_documento_id)
    
    if empresa_id:
        query = query.filter(Documento.empresa_id == empresa_id)
    
    if fecha_desde:
        query = query.filter(Documento.fecha_emision >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(Documento.fecha_emision <= fecha_hasta)
    
    if buscar:
        query = query.filter(
            or_(
                Documento.numero_documento.ilike(f"%{buscar}%"),
                Documento.ruc_emisor.ilike(f"%{buscar}%"),
                Documento.razon_social_emisor.ilike(f"%{buscar}%")
            )
        )
    
    # Ordenar por fecha de creación descendente
    documentos = query.order_by(desc(Documento.created_at)).offset(skip).limit(limit).all()
    
    return documentos


# ==================================
# OBTENER DOCUMENTO POR ID
# ==================================

@router.get("/{documento_id}", response_model=DocumentoSchema)
def obtener_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene un documento completo por su ID (incluye items y guía)"""
    documento = db.query(Documento).options(
        joinedload(Documento.datos_guia_remision) 
    ).filter(   
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    return documento


# ==================================
# OBTENER DOCUMENTO POR UUID
# ==================================

@router.get("/uuid/{uuid}", response_model=DocumentoSchema)
def obtener_documento_por_uuid(
    uuid: str,
    db: Session = Depends(get_db)
):
    """Obtiene un documento por su UUID"""
    documento = db.query(Documento).options(
        joinedload(Documento.datos_guia_remision)
    ).filter(
        Documento.uuid == uuid,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con UUID {uuid} no encontrado"
        )
    
    return documento


# ==================================
# CREAR DOCUMENTO
# ==================================

@router.post("/", response_model=DocumentoSchema, status_code=status.HTTP_201_CREATED)
def crear_documento(
    documento: DocumentoCreate,
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo documento
    
    **Validaciones:**
    - Verifica duplicados por número de documento
    - Crea items asociados
    - Asocia empresa si existe
    """
    # Verificar duplicados
    documento_existente = db.query(Documento).filter(
        Documento.numero_documento == documento.numero_documento,
        Documento.deleted_at.is_(None)
    ).first()
    
    if documento_existente:
        # Marcar como duplicado
        nuevo_documento_dict = documento.model_dump(exclude={'items'})
        nuevo_documento_dict['es_duplicada'] = True
        nuevo_documento_dict['documento_original_id'] = documento_existente.id
        nuevo_documento_dict['estado'] = 'duplicada'
    else:
        nuevo_documento_dict = documento.model_dump(exclude={'items'})
    
    # Crear documento
    nuevo_documento = Documento(**nuevo_documento_dict)
    db.add(nuevo_documento)
    db.flush()  # Para obtener el ID sin hacer commit
    
    # Crear items
    for item_data in documento.items:
        item_dict = item_data.model_dump()
        item_dict['documento_id'] = nuevo_documento.id
        nuevo_item = DocumentoItem(**item_dict)
        db.add(nuevo_item)
    
    db.commit()
    db.refresh(nuevo_documento)
    
    return nuevo_documento


# ==================================
# ACTUALIZAR DOCUMENTO
# ==================================

@router.put("/{documento_id}", response_model=DocumentoSchema)
def actualizar_documento(
    documento_id: int,
    documento_update: DocumentoUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un documento existente"""
    # Buscar documento
    documento = db.query(Documento).filter(
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    # Actualizar campos
    update_data = documento_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(documento, field, value)
    
    db.commit()
    db.refresh(documento)
    
    return documento


# ==================================
# VALIDAR DOCUMENTO
# ==================================

@router.post("/{documento_id}/validar", response_model=DocumentoSchema)
def validar_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """
    Valida un documento
    
    **Cambios:**
    - estado: 'validada'
    - validado: True
    - validado_en: timestamp actual
    - validado_por: 'admin'
    """
    documento = db.query(Documento).filter(
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    if documento.estado == 'validada':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento ya está validado"
        )
    
    # Validar
    from datetime import datetime
    documento.estado = 'validada'
    documento.validado = True
    documento.validado_en = datetime.now()
    documento.validado_por = 'admin'
    
    db.commit()
    db.refresh(documento)
    
    return documento


# ==================================
# RECHAZAR DOCUMENTO
# ==================================

@router.post("/{documento_id}/rechazar", response_model=DocumentoSchema)
def rechazar_documento(
    documento_id: int,
    motivo: str = Query(..., min_length=10, description="Motivo del rechazo"),
    db: Session = Depends(get_db)
):
    """Rechaza un documento con motivo"""
    documento = db.query(Documento).filter(
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    # Rechazar
    from datetime import datetime
    documento.estado = 'rechazada'
    documento.validado = False
    documento.rechazado_en = datetime.now()
    documento.rechazado_por = 'admin'
    documento.motivo_rechazo = motivo
    
    db.commit()
    db.refresh(documento)
    
    return documento


# ==================================
# ELIMINAR DOCUMENTO (SOFT DELETE)
# ==================================

@router.delete("/{documento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un documento (soft delete)"""
    documento = db.query(Documento).filter(
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    # Soft delete
    from datetime import datetime
    documento.deleted_at = datetime.now()
    documento.deleted_by = "admin"
    
    db.commit()
    
    return None


# ==================================
# OBTENER ITEMS DE UN DOCUMENTO
# ==================================

@router.get("/{documento_id}/items")
def obtener_items_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene todos los items de un documento"""
    # Verificar que exista el documento
    documento = db.query(Documento).filter(
        Documento.id == documento_id,
        Documento.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    items = db.query(DocumentoItem).filter(
        DocumentoItem.documento_id == documento_id
    ).order_by(DocumentoItem.orden).all()
    
    return items


# ==================================
# ESTADÍSTICAS
# ==================================

@router.get("/stats/resumen")
def obtener_estadisticas(
    db: Session = Depends(get_db)
):
    """Obtiene estadísticas generales de documentos"""
    from sqlalchemy import func
    
    stats = {
        "total_documentos": db.query(Documento).filter(
            Documento.deleted_at.is_(None)
        ).count(),
        
        "pendientes_validacion": db.query(Documento).filter(
            Documento.estado == 'pendiente_validacion',
            Documento.deleted_at.is_(None)
        ).count(),
        
        "validadas": db.query(Documento).filter(
            Documento.estado == 'validada',
            Documento.deleted_at.is_(None)
        ).count(),
        
        "rechazadas": db.query(Documento).filter(
            Documento.estado == 'rechazada',
            Documento.deleted_at.is_(None)
        ).count(),
        
        "duplicadas": db.query(Documento).filter(
            Documento.es_duplicada == True,
            Documento.deleted_at.is_(None)
        ).count(),
        
        "total_monto": db.query(func.sum(Documento.total)).filter(
            Documento.deleted_at.is_(None),
            Documento.estado == 'validada'
        ).scalar() or 0.0,
        
        "confianza_promedio": db.query(func.avg(Documento.confianza_ocr_promedio)).filter(
            Documento.deleted_at.is_(None),
            Documento.confianza_ocr_promedio.isnot(None)
        ).scalar() or 0.0
    }
    
    return stats