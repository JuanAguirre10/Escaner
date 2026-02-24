"""
Endpoints para Documentos (antes Facturas)
CRUD completo para documentos: facturas, guías, órdenes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
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
    fecha_desde: Optional[date] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta"),
    buscar: Optional[str] = None,
    numero_orden_compra: Optional[str] = Query(None, description="Buscar por número de OC"),
    solo_hoy: bool = Query(True, description="Solo documentos subidos hoy"),
    db: Session = Depends(get_db)
):
    """
    Lista documentos con filtros opcionales
    
    **Filtros:**
    - solo_hoy: True (por defecto) muestra solo documentos SUBIDOS hoy
    - fecha_desde, fecha_hasta: Rango de fechas de SUBIDA (created_at)
    - estado: pendiente_validacion, validada, rechazada
    - tipo_documento_id: 1 (FACTURA), 2 (GUIA_REMISION), 3 (ORDEN_COMPRA)
    - empresa_id: ID de la empresa emisora
    - buscar: Busca en número, RUC o razón social
    - numero_orden_compra: Busca por número de orden de compra
    """
    from datetime import date as date_class, datetime, timedelta
    
    # Query con joinedload para incluir guía y orden de compra
    query = db.query(Documento).options(
        joinedload(Documento.datos_guia_remision),
        joinedload(Documento.datos_orden_compra)
    ).filter(
        Documento.deleted_at.is_(None),
        Documento.es_version_actual == True
    )
    
    # Filtro de fecha por defecto: SOLO HOY (por created_at)
    if solo_hoy and not fecha_desde and not fecha_hasta:
        hoy = date_class.today()
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        query = query.filter(
            Documento.created_at >= inicio_dia,
            Documento.created_at <= fin_dia
        )
    else:
        # Rango de fechas personalizado (por created_at)
        if fecha_desde:
            inicio_fecha = datetime.combine(fecha_desde, datetime.min.time())
            query = query.filter(Documento.created_at >= inicio_fecha)
        if fecha_hasta:
            fin_fecha = datetime.combine(fecha_hasta, datetime.max.time())
            query = query.filter(Documento.created_at <= fin_fecha)
    
    # Aplicar filtros
    if estado:
        query = query.filter(Documento.estado == estado)
    
    if tipo_documento_id:
        query = query.filter(Documento.tipo_documento_id == tipo_documento_id)
    
    if empresa_id:
        query = query.filter(Documento.empresa_id == empresa_id)
    
    if buscar:
        query = query.filter(
            or_(
                Documento.numero_documento.ilike(f"%{buscar}%"),
                Documento.ruc_emisor.ilike(f"%{buscar}%"),
                Documento.razon_social_emisor.ilike(f"%{buscar}%")
            )
        )
    
    # Búsqueda por número de orden de compra
    if numero_orden_compra:
        query = query.filter(
            Documento.orden_compra.ilike(f"%{numero_orden_compra}%")
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
    """Obtiene un documento completo por su ID (incluye items, guía y OC)"""
    documento = db.query(Documento).options(
        joinedload(Documento.datos_guia_remision),
        joinedload(Documento.datos_orden_compra)
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
        joinedload(Documento.datos_guia_remision),
        joinedload(Documento.datos_orden_compra)
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

@router.put("/items/{item_id}")
def actualizar_item(
    item_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    """Actualiza un item de documento"""
    item = db.query(DocumentoItem).filter(
        DocumentoItem.id == item_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item no encontrado"
        )
    
    # Actualizar campos
    if "codigo_producto" in data:
        item.codigo_producto = data["codigo_producto"]
    if "descripcion" in data:
        item.descripcion = data["descripcion"]
    if "cantidad" in data:
        item.cantidad = data["cantidad"]
    if "unidad_medida" in data:
        item.unidad_medida = data["unidad_medida"]
    if "precio_unitario" in data:
        item.precio_unitario = data["precio_unitario"]
    if "valor_total" in data:
        item.valor_total = data["valor_total"]
    
    db.commit()
    db.refresh(item)
    
    return item



# ==================================
# ORDEN DE COMPRA
# ==================================

@router.get("/{documento_id}/orden-compra")
def obtener_orden_compra(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene datos específicos de orden de compra
    """
    from app.db.models import OrdenCompra
    
    orden = db.query(OrdenCompra).filter(
        OrdenCompra.documento_id == documento_id
    ).first()
    
    if not orden:
        raise HTTPException(
            status_code=404,
            detail="Orden de compra no encontrada"
        )
    
    return {
        "id": orden.id,
        "documento_id": orden.documento_id,
        "numero_orden_compra": orden.numero_orden_compra,
        "serie_orden": orden.serie_orden,
        "correlativo_orden": orden.correlativo_orden,
        "ruc_comprador": orden.ruc_comprador,
        "razon_social_comprador": orden.razon_social_comprador,
        "direccion_comprador": orden.direccion_comprador,
        "telefono_comprador": orden.telefono_comprador,
        "ruc_proveedor": orden.ruc_proveedor,
        "razon_social_proveedor": orden.razon_social_proveedor,
        "direccion_proveedor": orden.direccion_proveedor,
        "fecha_entrega": orden.fecha_entrega,
        "direccion_entrega": orden.direccion_entrega,
        "modo_pago": orden.modo_pago
    }


@router.put("/{documento_id}/orden-compra")
def actualizar_orden_compra(
    documento_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    """
    Actualiza datos de orden de compra
    """
    from app.db.models import OrdenCompra
    
    orden = db.query(OrdenCompra).filter(
        OrdenCompra.documento_id == documento_id
    ).first()
    
    if not orden:
        raise HTTPException(
            status_code=404,
            detail="Orden de compra no encontrada"
        )
    
    # Actualizar campos
    if "fecha_entrega" in data:
        orden.fecha_entrega = data["fecha_entrega"]
    if "direccion_entrega" in data:
        orden.direccion_entrega = data["direccion_entrega"]
    if "modo_pago" in data:
        orden.modo_pago = data["modo_pago"]
    
    db.commit()
    db.refresh(orden)
    
    return {
        "mensaje": "Orden de compra actualizada correctamente",
        "orden_compra": {
            "id": orden.id,
            "fecha_entrega": orden.fecha_entrega,
            "direccion_entrega": orden.direccion_entrega,
            "modo_pago": orden.modo_pago
        }
    }




# ==================================
# ESTADÍSTICAS
# ==================================

@router.get("/stats/resumen")
def obtener_resumen_estadisticas(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    solo_hoy: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas generales del sistema
    Por defecto: solo datos SUBIDOS hoy (created_at)
    """
    from sqlalchemy import func, distinct
    from app.db.models import Expediente, NotaEntrega
    from datetime import date as date_class, datetime
    
    # Filtro de fecha base para documentos (por created_at)
    filtro_fecha = True
    if solo_hoy and not fecha_desde and not fecha_hasta:
        hoy = date_class.today()
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        filtro_fecha = and_(
            Documento.created_at >= inicio_dia,
            Documento.created_at <= fin_dia
        )
    elif fecha_desde or fecha_hasta:
        condiciones = []
        if fecha_desde:
            inicio_fecha = datetime.combine(fecha_desde, datetime.min.time())
            condiciones.append(Documento.created_at >= inicio_fecha)
        if fecha_hasta:
            fin_fecha = datetime.combine(fecha_hasta, datetime.max.time())
            condiciones.append(Documento.created_at <= fin_fecha)
        filtro_fecha = and_(*condiciones) if condiciones else True
    
    # Total documentos (con filtro de fecha)
    total_documentos = db.query(func.count(Documento.id)).filter(filtro_fecha).scalar()
    
    # Por estado (con filtro de fecha)
    por_estado = db.query(
        Documento.estado,
        func.count(Documento.id)
    ).filter(filtro_fecha).group_by(Documento.estado).all()
    
    estados_dict = {
        'pendientes': 0,
        'validadas': 0,
        'rechazadas': 0
    }
    
    for estado, count in por_estado:
        if estado == 'pendiente_validacion':
            estados_dict['pendientes'] = count
        elif estado == 'validada':
            estados_dict['validadas'] = count
        elif estado == 'rechazada':
            estados_dict['rechazadas'] = count
    
    # Totales monetarios (con filtro de fecha)
    totales_pen = db.query(
        func.sum(Documento.total)
    ).filter(
        Documento.moneda == 'PEN',
        Documento.estado == 'validada',
        filtro_fecha
    ).scalar() or 0
    
    totales_usd = db.query(
        func.sum(Documento.total)
    ).filter(
        Documento.moneda == 'USD',
        Documento.estado == 'validada',
        filtro_fecha
    ).scalar() or 0
    
    # Total proveedores (empresas únicas - con filtro de fecha)
    total_empresas = db.query(
        func.count(distinct(Documento.empresa_id))
    ).filter(filtro_fecha).scalar() or 0
    
    # Confianza OCR promedio (con filtro de fecha)
    confianza_promedio = db.query(
        func.avg(Documento.confianza_ocr_promedio)
    ).filter(filtro_fecha).scalar() or 0
    
    # Filtro de fecha para expedientes (por created_at)
    filtro_fecha_exp = True
    if solo_hoy and not fecha_desde and not fecha_hasta:
        hoy = date_class.today()
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        filtro_fecha_exp = and_(
            Expediente.created_at >= inicio_dia,
            Expediente.created_at <= fin_dia
        )
    elif fecha_desde or fecha_hasta:
        condiciones_exp = []
        if fecha_desde:
            inicio_fecha = datetime.combine(fecha_desde, datetime.min.time())
            condiciones_exp.append(Expediente.created_at >= inicio_fecha)
        if fecha_hasta:
            fin_fecha = datetime.combine(fecha_hasta, datetime.max.time())
            condiciones_exp.append(Expediente.created_at <= fin_fecha)
        filtro_fecha_exp = and_(*condiciones_exp) if condiciones_exp else True
    
    total_expedientes = db.query(func.count(Expediente.id)).filter(filtro_fecha_exp).scalar() or 0
    expedientes_completos = db.query(
        func.count(Expediente.id)
    ).filter(Expediente.estado == 'completo', filtro_fecha_exp).scalar() or 0
    expedientes_incompletos = db.query(
        func.count(Expediente.id)
    ).filter(Expediente.estado.in_(['en_proceso', 'incompleto']), filtro_fecha_exp).scalar() or 0
    
    # Filtro de fecha para notas de entrega (por created_at)
    filtro_fecha_notas = True
    if solo_hoy and not fecha_desde and not fecha_hasta:
        hoy = date_class.today()
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        filtro_fecha_notas = and_(
            NotaEntrega.created_at >= inicio_dia,
            NotaEntrega.created_at <= fin_dia
        )
    elif fecha_desde or fecha_hasta:
        condiciones_notas = []
        if fecha_desde:
            inicio_fecha = datetime.combine(fecha_desde, datetime.min.time())
            condiciones_notas.append(NotaEntrega.created_at >= inicio_fecha)
        if fecha_hasta:
            fin_fecha = datetime.combine(fecha_hasta, datetime.max.time())
            condiciones_notas.append(NotaEntrega.created_at <= fin_fecha)
        filtro_fecha_notas = and_(*condiciones_notas) if condiciones_notas else True
    
    total_notas = db.query(func.count(NotaEntrega.id)).filter(filtro_fecha_notas).scalar() or 0
    
    return {
        "total_documentos": total_documentos,
        "por_estado": estados_dict,
        "totales": {
            "soles": float(totales_pen),
            "dolares": float(totales_usd)
        },
        "total_empresas": total_empresas,
        "confianza_ocr_promedio": float(confianza_promedio) if confianza_promedio else 0,
        "expedientes": {
            "total": total_expedientes,
            "completos": expedientes_completos,
            "incompletos": expedientes_incompletos
        },
        "total_notas": total_notas,
        "filtros_aplicados": {
            "solo_hoy": solo_hoy,
            "fecha_desde": str(fecha_desde) if fecha_desde else None,
            "fecha_hasta": str(fecha_hasta) if fecha_hasta else None
        }
    }