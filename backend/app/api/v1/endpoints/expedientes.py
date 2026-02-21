"""
Endpoints para Expedientes
Gestión de expedientes documentales
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from app.db.session import get_db
from app.db.models import Expediente, Documento, NotaEntrega
from app.schemas import (
    ExpedienteCreate,
    ExpedienteUpdate,
    ExpedienteResponse,
    ExpedienteDetalle
)

router = APIRouter()


@router.get("/", response_model=List[ExpedienteResponse])
def listar_expedientes(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Lista todos los expedientes"""
    query = db.query(Expediente)
    
    if estado:
        query = query.filter(Expediente.estado == estado)
    
    if empresa_id:
        query = query.filter(Expediente.empresa_id == empresa_id)
    
    expedientes = query.order_by(Expediente.created_at.desc()).offset(skip).limit(limit).all()
    return expedientes


@router.get("/empresa/{empresa_id}/incompletos", response_model=List[ExpedienteDetalle])
def obtener_expedientes_incompletos(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene expedientes incompletos de una empresa"""
    expedientes = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(
        Expediente.empresa_id == empresa_id,
        Expediente.estado.in_(['en_proceso', 'incompleto'])
    ).all()
    
    return expedientes


@router.post("/crear-temporal")
def crear_expediente_temporal(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    """Crea un expediente temporal sin nombre (se nombrará al subir OC)"""
    # Generar código temporal
    codigo_temp = f"TEMP-{date.today().strftime('%Y%m%d')}-{db.query(Expediente).count() + 1}"
    
    nuevo_expediente = Expediente(
        codigo_expediente=codigo_temp,
        numero_orden_compra="PENDIENTE",
        empresa_id=empresa_id,
        estado='en_proceso',
        fecha_creacion=date.today(),
        created_by='admin'
    )
    
    db.add(nuevo_expediente)
    db.commit()
    db.refresh(nuevo_expediente)
    
    return {
        "id": nuevo_expediente.id,
        "codigo_expediente": nuevo_expediente.codigo_expediente,
        "mensaje": "Expediente temporal creado. Sube primero la Orden de Compra."
    }


@router.get("/codigo/{codigo_expediente}", response_model=ExpedienteDetalle)
def obtener_expediente_por_codigo(
    codigo_expediente: str,
    db: Session = Depends(get_db)
):
    """Obtiene un expediente por su código"""
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.codigo_expediente == codigo_expediente).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con código {codigo_expediente} no encontrado"
        )
    
    return expediente


@router.get("/orden/{numero_orden}", response_model=ExpedienteDetalle)
def obtener_expediente_por_orden(
    numero_orden: str,
    db: Session = Depends(get_db)
):
    """Obtiene un expediente por número de orden de compra"""
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.numero_orden_compra == numero_orden).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe expediente para la orden {numero_orden}"
        )
    
    return expediente


@router.get("/{expediente_id}/estado")
def obtener_estado_expediente(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene el estado de completitud de un expediente"""
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Contar documentos por tipo
    tiene_oc = any(d.tipo_documento_id == 3 for d in expediente.documentos)
    tiene_factura = any(d.tipo_documento_id == 1 for d in expediente.documentos)
    tiene_guia = any(d.tipo_documento_id == 2 for d in expediente.documentos)
    tiene_nota = len(expediente.notas_entrega) > 0
    
    completo = tiene_oc and tiene_factura and tiene_guia and tiene_nota
    
    return {
        "expediente_id": expediente_id,
        "codigo_expediente": expediente.codigo_expediente,
        "estado": expediente.estado,
        "tiene_orden_compra": tiene_oc,
        "tiene_factura": tiene_factura,
        "tiene_guia": tiene_guia,
        "tiene_nota_entrega": tiene_nota,
        "completo": completo,
        "documentos_faltantes": [
            "Orden de Compra" if not tiene_oc else None,
            "Factura" if not tiene_factura else None,
            "Guía de Remisión" if not tiene_guia else None,
            "Nota de Entrega" if not tiene_nota else None,
        ]
    }


@router.get("/{expediente_id}", response_model=ExpedienteDetalle)
def obtener_expediente(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene un expediente con todos sus documentos"""
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    return expediente


@router.post("/", response_model=ExpedienteResponse, status_code=status.HTTP_201_CREATED)
def crear_expediente(
    expediente: ExpedienteCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuevo expediente"""
    # Verificar que no exista el código
    expediente_existente = db.query(Expediente).filter(
        Expediente.codigo_expediente == expediente.codigo_expediente
    ).first()
    
    if expediente_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un expediente con código {expediente.codigo_expediente}"
        )
    
    # Verificar que no exista expediente para esa OC
    expediente_oc = db.query(Expediente).filter(
        Expediente.numero_orden_compra == expediente.numero_orden_compra
    ).first()
    
    if expediente_oc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un expediente para la orden {expediente.numero_orden_compra}"
        )
    
    nuevo_expediente = Expediente(**expediente.model_dump())
    db.add(nuevo_expediente)
    db.commit()
    db.refresh(nuevo_expediente)
    
    return nuevo_expediente


@router.put("/{expediente_id}", response_model=ExpedienteResponse)
def actualizar_expediente(
    expediente_id: int,
    expediente_update: ExpedienteUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un expediente"""
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    update_data = expediente_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(expediente, field, value)
    
    db.commit()
    db.refresh(expediente)
    
    return expediente


@router.put("/{expediente_id}/actualizar-desde-oc")
def actualizar_expediente_desde_oc(
    expediente_id: int,
    numero_orden: str,
    db: Session = Depends(get_db)
):
    """Actualiza expediente temporal con datos de la OC"""
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Actualizar con número de OC
    expediente.codigo_expediente = f"EXP-{numero_orden}"
    expediente.numero_orden_compra = numero_orden
    
    db.commit()
    db.refresh(expediente)
    
    return {
        "id": expediente.id,
        "codigo_expediente": expediente.codigo_expediente,
        "numero_orden_compra": expediente.numero_orden_compra
    }


@router.post("/{expediente_id}/asociar-documento/{documento_id}")
def asociar_documento(
    expediente_id: int,
    documento_id: int,
    db: Session = Depends(get_db)
):
    """Asocia un documento a un expediente"""
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID {documento_id} no encontrado"
        )
    
    # Asociar
    documento.expediente_id = expediente_id
    db.commit()
    
    return {"mensaje": "Documento asociado correctamente", "expediente_id": expediente_id}


@router.post("/{expediente_id}/verificar-completitud")
def verificar_y_actualizar_estado(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Verifica si el expediente está completo y actualiza su estado"""
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Verificar qué documentos tiene
    tiene_oc = any(d.tipo_documento_id == 3 for d in expediente.documentos)
    tiene_factura = any(d.tipo_documento_id == 1 for d in expediente.documentos)
    tiene_guia = any(d.tipo_documento_id == 2 for d in expediente.documentos)
    tiene_nota = len(expediente.notas_entrega) > 0
    
    # Actualizar estado
    if tiene_oc and tiene_factura and tiene_guia and tiene_nota:
        expediente.estado = 'completo'
        expediente.fecha_cierre = date.today()
    elif tiene_oc:
        expediente.estado = 'en_proceso'
    else:
        expediente.estado = 'incompleto'
    
    db.commit()
    db.refresh(expediente)
    
    return {
        "expediente_id": expediente.id,
        "codigo": expediente.codigo_expediente,
        "estado": expediente.estado,
        "tiene_oc": tiene_oc,
        "tiene_factura": tiene_factura,
        "tiene_guia": tiene_guia,
        "tiene_nota": tiene_nota,
        "completo": expediente.estado == 'completo'
    }


@router.delete("/{expediente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_expediente(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un expediente"""
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    db.delete(expediente)
    db.commit()
    
    return None