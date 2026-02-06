"""
Endpoints CRUD para Facturas
"""

from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from app.api.deps import get_db
from app.db.models import Factura, FacturaItem, Proveedor
from app.schemas import (
    Factura as FacturaSchema,
    FacturaSimple,
    FacturaUpdate,
    FacturaItemCreate,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[FacturaSimple])
def listar_facturas(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Número de registros a retornar"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    ruc_emisor: Optional[str] = Query(None, description="Filtrar por RUC del emisor"),
    fecha_desde: Optional[date] = Query(None, description="Fecha de emisión desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha de emisión hasta"),
    buscar: Optional[str] = Query(None, description="Buscar en número de factura o razón social"),
    solo_validadas: bool = Query(False, description="Solo facturas validadas"),
    solo_pendientes: bool = Query(False, description="Solo facturas pendientes"),
    db: Session = Depends(get_db)
):
    """
    Lista todas las facturas con filtros opcionales
    
    **Filtros disponibles:**
    - `estado`: pendiente_validacion, validada, rechazada, duplicada
    - `ruc_emisor`: RUC del proveedor
    - `fecha_desde` y `fecha_hasta`: Rango de fechas
    - `buscar`: Busca en número de factura y razón social
    - `solo_validadas`: Solo facturas validadas
    - `solo_pendientes`: Solo facturas pendientes de validación
    
    **Paginación:**
    - `skip`: Número de registros a saltar (default: 0)
    - `limit`: Máximo de registros a retornar (default: 50, max: 100)
    """
    
    # Construir query base
    query = db.query(Factura).filter(
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    )
    
    # Aplicar filtros
    if estado:
        query = query.filter(Factura.estado == estado)
    
    if ruc_emisor:
        query = query.filter(Factura.ruc_emisor == ruc_emisor)
    
    if fecha_desde:
        query = query.filter(Factura.fecha_emision >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(Factura.fecha_emision <= fecha_hasta)
    
    if buscar:
        buscar_pattern = f"%{buscar}%"
        query = query.filter(
            or_(
                Factura.numero_factura.ilike(buscar_pattern),
                Factura.razon_social_emisor.ilike(buscar_pattern)
            )
        )
    
    if solo_validadas:
        query = query.filter(Factura.validado == True)
    
    if solo_pendientes:
        query = query.filter(Factura.estado == 'pendiente_validacion')
    
    # Ordenar por fecha de emisión descendente
    query = query.order_by(desc(Factura.fecha_emision), desc(Factura.created_at))
    
    # Aplicar paginación
    facturas = query.offset(skip).limit(limit).all()
    
    return facturas


@router.get("/estadisticas")
def obtener_estadisticas(db: Session = Depends(get_db)):
    """
    Obtiene estadísticas generales del sistema
    
    **Retorna:**
    - Total de facturas
    - Facturas por estado
    - Totales por moneda
    - Confianza promedio del OCR
    - Total de proveedores
    """
    
    # Total de facturas
    total_facturas = db.query(Factura).filter(
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    ).count()
    
    # Facturas por estado
    pendientes = db.query(Factura).filter(
        Factura.estado == 'pendiente_validacion',
        Factura.es_version_actual == True
    ).count()
    
    validadas = db.query(Factura).filter(
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).count()
    
    rechazadas = db.query(Factura).filter(
        Factura.estado == 'rechazada',
        Factura.es_version_actual == True
    ).count()
    
    duplicadas = db.query(Factura).filter(
        Factura.es_duplicada == True,
        Factura.es_version_actual == True
    ).count()
    
    # Totales por moneda
    from sqlalchemy import func
    
    totales_pen = db.query(func.sum(Factura.total)).filter(
        Factura.moneda == 'PEN',
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).scalar() or 0
    
    totales_usd = db.query(func.sum(Factura.total)).filter(
        Factura.moneda == 'USD',
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).scalar() or 0
    
    # Confianza promedio
    confianza_promedio = db.query(func.avg(Factura.confianza_ocr_promedio)).filter(
        Factura.confianza_ocr_promedio.isnot(None),
        Factura.es_version_actual == True
    ).scalar() or 0
    
    # Total proveedores
    from app.db.models import Proveedor
    total_proveedores = db.query(Proveedor).filter(Proveedor.activo == True).count()
    
    return {
        "total_facturas": total_facturas,
        "por_estado": {
            "pendientes": pendientes,
            "validadas": validadas,
            "rechazadas": rechazadas,
            "duplicadas": duplicadas
        },
        "totales": {
            "soles": float(totales_pen),
            "dolares": float(totales_usd)
        },
        "confianza_ocr_promedio": float(confianza_promedio) if confianza_promedio else 0,
        "total_proveedores": total_proveedores
    }


@router.get("/pendientes", response_model=List[FacturaSimple])
def listar_facturas_pendientes(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Lista solo las facturas pendientes de validación
    Ordenadas por fecha de emisión descendente
    """
    
    facturas = db.query(Factura).filter(
        Factura.estado == 'pendiente_validacion',
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    ).order_by(desc(Factura.fecha_emision)).offset(skip).limit(limit).all()
    
    return facturas


@router.get("/{factura_id}", response_model=FacturaSchema)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene el detalle completo de una factura por ID
    Incluye proveedor e items
    """
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    return factura


@router.put("/{factura_id}", response_model=FacturaSchema)
def actualizar_factura(
    factura_id: int,
    factura_update: FacturaUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza los datos de una factura
    
    **Casos de uso:**
    - Corregir datos extraídos por OCR
    - Cambiar estado de la factura
    - Marcar como validada
    
    **Notas:**
    - Solo se pueden actualizar facturas no eliminadas
    - Los cambios se registran en el log de auditoría (via trigger)
    """
    
    # Buscar factura
    factura = db.query(Factura).filter(
        Factura.id == factura_id,
        Factura.deleted_at.is_(None)
    ).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Actualizar campos (solo los que vienen en el request)
    update_data = factura_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(factura, field, value)
    
    # Si se marca como validada, registrar quién y cuándo
    if factura_update.validado == True and not factura.validado:
        from datetime import datetime
        factura.validado = True
        factura.validado_por = "admin"  # TODO: Reemplazar con usuario real
        factura.validado_at = datetime.now()
        factura.estado = "validada"
    
    db.commit()
    db.refresh(factura)
    
    logger.info(f"✅ Factura {factura_id} actualizada")
    
    return factura


@router.delete("/{factura_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    """
    Elimina (soft delete) una factura
    
    **Nota:** No elimina físicamente, solo marca como eliminada
    """
    
    factura = db.query(Factura).filter(
        Factura.id == factura_id,
        Factura.deleted_at.is_(None)
    ).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Soft delete
    from datetime import datetime
    factura.deleted_at = datetime.now()
    factura.deleted_by = "admin"  # TODO: Reemplazar con usuario real
    
    db.commit()
    
    logger.info(f"✅ Factura {factura_id} eliminada (soft delete)")
    
    return None


@router.post("/{factura_id}/validar", response_model=FacturaSchema)
def validar_factura(
    factura_id: int,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Valida una factura (marca como correcta)
    
    **Efecto:**
    - Cambia estado a 'validada'
    - Marca validado = True
    - Registra quién y cuándo validó
    """
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    from datetime import datetime
    
    factura.estado = "validada"
    factura.validado = True
    factura.validado_por = "admin"  # TODO: Usuario real
    factura.validado_at = datetime.now()
    
    if observaciones:
        factura.observaciones = observaciones
    
    db.commit()
    db.refresh(factura)
    
    logger.info(f"✅ Factura {factura_id} validada")
    
    return factura


@router.post("/{factura_id}/rechazar", response_model=FacturaSchema)
def rechazar_factura(
    factura_id: int,
    motivo: str,
    db: Session = Depends(get_db)
):
    """
    Rechaza una factura (marca como inválida)
    
    **Parámetros:**
    - `motivo`: Razón del rechazo (requerido)
    
    **Efecto:**
    - Cambia estado a 'rechazada'
    - Guarda el motivo en observaciones
    """
    
    if not motivo or len(motivo.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El motivo del rechazo debe tener al menos 5 caracteres"
        )
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    factura.estado = "rechazada"
    factura.observaciones = motivo
    
    db.commit()
    db.refresh(factura)
    
    logger.info(f"✅ Factura {factura_id} rechazada: {motivo}")
    
    return factura


@router.get("/{factura_id}/items")
def obtener_items_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los items de una factura
    """
    from app.schemas import FacturaItem as FacturaItemSchema
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    items = db.query(FacturaItem).filter(
        FacturaItem.factura_id == factura_id
    ).order_by(FacturaItem.orden).all()
    
    # Convertir a diccionarios manualmente
    return [
        {
            "id": item.id,
            "factura_id": item.factura_id,
            "orden": item.orden,
            "codigo_producto": item.codigo_producto,
            "descripcion": item.descripcion,
            "cantidad": float(item.cantidad) if item.cantidad else 0,
            "unidad_medida": item.unidad_medida,
            "precio_unitario": float(item.precio_unitario) if item.precio_unitario else 0,
            "valor_total": float(item.valor_total) if item.valor_total else 0,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]


@router.post("/{factura_id}/items")
def agregar_item_factura(
    factura_id: int,
    item: FacturaItemCreate,
    db: Session = Depends(get_db)
):
    """
    Agrega un nuevo item a una factura existente
    """
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Obtener el último orden
    ultimo_orden = db.query(FacturaItem).filter(
        FacturaItem.factura_id == factura_id
    ).count()
    
    nuevo_item = FacturaItem(
        factura_id=factura_id,
        orden=ultimo_orden + 1,
        **item.model_dump()
    )
    
    db.add(nuevo_item)
    db.commit()
    db.refresh(nuevo_item)
    
    logger.info(f"✅ Item agregado a factura {factura_id}")
    
    return nuevo_item


@router.get("/{factura_id}/versiones", response_model=List[FacturaSimple])
def obtener_versiones_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las versiones de una factura
    Útil para ver el historial de cambios
    """
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Buscar todas las versiones con el mismo número de factura
    versiones = db.query(Factura).filter(
        Factura.numero_factura == factura.numero_factura
    ).order_by(desc(Factura.version)).all()
    
    return versiones