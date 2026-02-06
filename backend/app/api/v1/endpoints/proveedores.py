"""
Endpoints CRUD para Proveedores
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.api.deps import get_db
from app.db.models import Proveedor, Factura
from app.schemas import (
    Proveedor as ProveedorSchema,
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorSimple,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[ProveedorSimple])
def listar_proveedores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    buscar: Optional[str] = Query(None, description="Buscar por RUC o razón social"),
    db: Session = Depends(get_db)
):
    """
    Lista todos los proveedores con filtros opcionales
    
    **Filtros:**
    - `activo`: True/False para filtrar por estado
    - `buscar`: Busca en RUC y razón social
    
    **Paginación:**
    - `skip`: Registros a saltar (default: 0)
    - `limit`: Máximo de registros (default: 100, max: 100)
    """
    
    # Query base
    query = db.query(Proveedor)
    
    # Filtro por estado
    if activo is not None:
        query = query.filter(Proveedor.activo == activo)
    
    # Búsqueda
    if buscar:
        buscar_pattern = f"%{buscar}%"
        query = query.filter(
            or_(
                Proveedor.ruc.ilike(buscar_pattern),
                Proveedor.razon_social.ilike(buscar_pattern),
                Proveedor.nombre_comercial.ilike(buscar_pattern)
            )
        )
    
    # Ordenar por razón social
    query = query.order_by(Proveedor.razon_social)
    
    # Paginación
    proveedores = query.offset(skip).limit(limit).all()
    
    return proveedores


@router.get("/buscar/{ruc}", response_model=ProveedorSchema)
def buscar_proveedor_por_ruc(
    ruc: str,
    db: Session = Depends(get_db)
):
    """
    Busca un proveedor por RUC
    
    **Uso:** Antes de crear una factura, verificar si el proveedor ya existe
    """
    
    # Validar formato de RUC
    if len(ruc) != 11 or not ruc.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC debe tener 11 dígitos numéricos"
        )
    
    proveedor = db.query(Proveedor).filter(Proveedor.ruc == ruc).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró proveedor con RUC {ruc}"
        )
    
    return proveedor


@router.get("/{proveedor_id}", response_model=ProveedorSchema)
def obtener_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene el detalle completo de un proveedor por ID
    """
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    return proveedor


@router.post("/", response_model=ProveedorSchema, status_code=status.HTTP_201_CREATED)
def crear_proveedor(
    proveedor: ProveedorCreate,
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo proveedor
    
    **Validaciones:**
    - RUC único (no puede haber duplicados)
    - RUC de 11 dígitos
    """
    
    # Verificar si ya existe
    proveedor_existente = db.query(Proveedor).filter(
        Proveedor.ruc == proveedor.ruc
    ).first()
    
    if proveedor_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un proveedor con RUC {proveedor.ruc}"
        )
    
    # Crear proveedor
    nuevo_proveedor = Proveedor(**proveedor.model_dump())
    
    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)
    
    logger.info(f"✅ Proveedor creado: {nuevo_proveedor.ruc} - {nuevo_proveedor.razon_social}")
    
    return nuevo_proveedor


@router.put("/{proveedor_id}", response_model=ProveedorSchema)
def actualizar_proveedor(
    proveedor_id: int,
    proveedor_update: ProveedorUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza los datos de un proveedor
    
    **Notas:**
    - Si se actualiza el RUC, se verifica que no exista otro con ese RUC
    - Solo se actualizan los campos que vienen en el request
    """
    
    # Buscar proveedor
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    # Si se va a cambiar el RUC, verificar que no exista
    if proveedor_update.ruc and proveedor_update.ruc != proveedor.ruc:
        ruc_existente = db.query(Proveedor).filter(
            Proveedor.ruc == proveedor_update.ruc,
            Proveedor.id != proveedor_id
        ).first()
        
        if ruc_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otro proveedor con RUC {proveedor_update.ruc}"
            )
    
    # Actualizar campos
    update_data = proveedor_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(proveedor, field, value)
    
    db.commit()
    db.refresh(proveedor)
    
    logger.info(f"✅ Proveedor {proveedor_id} actualizado")
    
    return proveedor


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Desactiva un proveedor
    
    **Nota:** No elimina físicamente, solo marca como inactivo
    Esto preserva la integridad referencial con las facturas
    """
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    # Marcar como inactivo
    proveedor.activo = False
    
    db.commit()
    
    logger.info(f"✅ Proveedor {proveedor_id} desactivado")
    
    return None


@router.post("/{proveedor_id}/activar", response_model=ProveedorSchema)
def activar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Reactiva un proveedor desactivado
    """
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    proveedor.activo = True
    
    db.commit()
    db.refresh(proveedor)
    
    logger.info(f"✅ Proveedor {proveedor_id} activado")
    
    return proveedor


@router.get("/{proveedor_id}/facturas", response_model=List[dict])
def obtener_facturas_proveedor(
    proveedor_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las facturas de un proveedor específico
    
    **Uso:** Ver el historial de facturas de un proveedor
    """
    
    # Verificar que el proveedor existe
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    # Obtener facturas
    facturas = db.query(Factura).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    ).order_by(desc(Factura.fecha_emision)).offset(skip).limit(limit).all()
    
    return facturas


@router.get("/{proveedor_id}/estadisticas")
def obtener_estadisticas_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas de un proveedor
    
    **Retorna:**
    - Total de facturas
    - Total facturado (por moneda)
    - Promedio de facturación
    - Última factura
    """
    
    # Verificar que el proveedor existe
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    
    from sqlalchemy import func
    
    # Total de facturas
    total_facturas = db.query(Factura).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    ).count()
    
    # Total facturado en soles
    total_pen = db.query(func.sum(Factura.total)).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.moneda == 'PEN',
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).scalar() or 0
    
    # Total facturado en dólares
    total_usd = db.query(func.sum(Factura.total)).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.moneda == 'USD',
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).scalar() or 0
    
    # Promedio de facturación
    promedio = db.query(func.avg(Factura.total)).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.estado == 'validada',
        Factura.es_version_actual == True
    ).scalar() or 0
    
    # Última factura
    ultima_factura = db.query(Factura).filter(
        Factura.proveedor_id == proveedor_id,
        Factura.es_version_actual == True,
        Factura.deleted_at.is_(None)
    ).order_by(desc(Factura.fecha_emision)).first()
    
    return {
        "proveedor": {
            "id": proveedor.id,
            "ruc": proveedor.ruc,
            "razon_social": proveedor.razon_social
        },
        "total_facturas": total_facturas,
        "totales": {
            "soles": float(total_pen),
            "dolares": float(total_usd)
        },
        "promedio_facturacion": float(promedio),
        "ultima_factura": {
            "numero": ultima_factura.numero_factura if ultima_factura else None,
            "fecha": ultima_factura.fecha_emision if ultima_factura else None,
            "total": float(ultima_factura.total) if ultima_factura else 0
        } if ultima_factura else None
    }