"""
Endpoints para Expedientes
Gestión de expedientes documentales
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
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
    empresa_id: Optional[int] = None,
    estado: Optional[str] = Query(None, description="Estado del expediente"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta"),
    solo_hoy: bool = Query(True, description="Solo expedientes creados hoy"),
    solo_incompletos: bool = Query(False, description="Solo expedientes incompletos"),
    buscar: Optional[str] = Query(None, description="Buscar por código o número OC"),
    db: Session = Depends(get_db)
):
    """
    Lista expedientes con filtros
    
    **Por defecto:** Muestra solo expedientes CREADOS hoy
    **solo_incompletos:** Muestra solo expedientes en_proceso o incompleto
    """
    from datetime import date as date_class, datetime
    
    # Query sin filtro de deleted_at porque Expediente no tiene soft delete
    query = db.query(Expediente)
    
    # Filtro de fecha por defecto: SOLO HOY (por created_at)
    if solo_hoy and not fecha_desde and not fecha_hasta:
        hoy = date_class.today()
        inicio_dia = datetime.combine(hoy, datetime.min.time())
        fin_dia = datetime.combine(hoy, datetime.max.time())
        query = query.filter(
            Expediente.created_at >= inicio_dia,
            Expediente.created_at <= fin_dia
        )
    else:
        # Rango de fechas personalizado (por created_at)
        if fecha_desde:
            inicio_fecha = datetime.combine(fecha_desde, datetime.min.time())
            query = query.filter(Expediente.created_at >= inicio_fecha)
        if fecha_hasta:
            fin_fecha = datetime.combine(fecha_hasta, datetime.max.time())
            query = query.filter(Expediente.created_at <= fin_fecha)
    
    # Filtro de expedientes incompletos
    if solo_incompletos:
        query = query.filter(Expediente.estado.in_(['en_proceso', 'incompleto']))
    elif estado:
        query = query.filter(Expediente.estado == estado)
    
    if empresa_id:
        query = query.filter(Expediente.empresa_id == empresa_id)
    
    # Búsqueda por código o número de OC
    if buscar:
        query = query.filter(
            or_(
                Expediente.codigo_expediente.ilike(f"%{buscar}%"),
                Expediente.numero_orden_compra.ilike(f"%{buscar}%")
            )
        )
    
    expedientes = query.order_by(desc(Expediente.created_at)).offset(skip).limit(limit).all()
    
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
    
    exentos = expediente.documentos_exentos or []

    tiene_oc = any(d.tipo_documento_id == 3 for d in expediente.documentos)
    tiene_factura_o_rxh = any(d.tipo_documento_id in [1, 6] for d in expediente.documentos)
    tiene_guia = any(d.tipo_documento_id == 2 for d in expediente.documentos)

    factura_requerida = 1 not in exentos and 6 not in exentos
    guia_requerida = 2 not in exentos

    factura_ok = tiene_factura_o_rxh or not factura_requerida
    guia_ok = tiene_guia or not guia_requerida

    completo = tiene_oc and factura_ok and guia_ok

    faltantes = []
    if not tiene_oc:
        faltantes.append("Orden de Compra")
    if factura_requerida and not tiene_factura_o_rxh:
        faltantes.append("Factura / Recibo por Honorarios")
    if guia_requerida and not tiene_guia:
        faltantes.append("Guía de Remisión")

    return {
        "expediente_id": expediente_id,
        "codigo_expediente": expediente.codigo_expediente,
        "estado": expediente.estado,
        "tiene_orden_compra": tiene_oc,
        "tiene_factura": tiene_factura_o_rxh,
        "tiene_guia": tiene_guia,
        "completo": completo,
        "documentos_exentos": exentos,
        "documentos_faltantes": faltantes
    }


@router.get("/{expediente_id}")
def obtener_expediente(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene un expediente completo con:
    - Documentos (facturas, guías, OC, notas de entrega) con archivo_original_url
    - Notas de entrega (legado)
    - Documentos de identidad con archivo_url
    """
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos),
        joinedload(Expediente.notas_entrega)
    ).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Obtener documentos de identidad si la relación existe
    documentos_identidad_list = []
    if hasattr(expediente, 'documentos_identidad') and expediente.documentos_identidad:
        documentos_identidad_list = [
            {
                "id": doc.id,
                "tipo_documento": doc.tipo_documento,
                "numero_documento": doc.numero_documento,
                "nombres": doc.nombres,
                "apellidos": doc.apellidos,
                "nombre_completo": doc.nombre_completo,
                "archivo_url": doc.archivo_url if hasattr(doc, 'archivo_url') else None,
                "archivo_tipo": doc.archivo_tipo if hasattr(doc, 'archivo_tipo') else None,
            }
            for doc in expediente.documentos_identidad
            if not hasattr(doc, 'deleted_at') or doc.deleted_at is None
        ]
    
    # Construir respuesta completa con TODOS los campos
    return {
        "id": expediente.id,
        "codigo_expediente": expediente.codigo_expediente,
        "numero_orden_compra": expediente.numero_orden_compra,
        "estado": expediente.estado,
        "fecha_creacion": expediente.fecha_creacion,
        "fecha_cierre": expediente.fecha_cierre,
        "cerrado_manualmente": expediente.cerrado_manualmente,
        "motivo_cierre": expediente.motivo_cierre,
        "observaciones": expediente.observaciones,
        "empresa_id": expediente.empresa_id if hasattr(expediente, 'empresa_id') else None,
        "documentos_exentos": expediente.documentos_exentos or [],
        
        # Documentos COMPLETOS con archivo_original_url
        "documentos": [
            {
                "id": doc.id,
                "tipo_documento_id": doc.tipo_documento_id,
                "numero_documento": doc.numero_documento,
                "serie": doc.serie if hasattr(doc, 'serie') else "",
                "correlativo": doc.correlativo if hasattr(doc, 'correlativo') else "",
                "fecha_emision": doc.fecha_emision,
                "total": float(doc.total) if doc.total else None,
                "moneda": doc.moneda if hasattr(doc, 'moneda') else None,
                "estado": doc.estado,
                "archivo_original_nombre": doc.archivo_original_nombre,
                "archivo_original_url": doc.archivo_original_url,
                "archivo_original_tipo": doc.archivo_original_tipo,
                "ruc_emisor": doc.ruc_emisor if hasattr(doc, 'ruc_emisor') else None,
                "razon_social_emisor": doc.razon_social_emisor if hasattr(doc, 'razon_social_emisor') else None,
            }
            for doc in expediente.documentos if not hasattr(doc, 'deleted_at') or doc.deleted_at is None
        ],
        
        # Notas de entrega (legado)
        "notas_entrega": [
            {
                "id": nota.id,
                "numero_nota": nota.numero_nota,
                "fecha_recepcion": nota.fecha_recepcion,
                "recibido_por": nota.recibido_por if hasattr(nota, 'recibido_por') else None,
                "estado_mercaderia": nota.estado_mercaderia if hasattr(nota, 'estado_mercaderia') else None,
                "orden_compra_numero": nota.orden_compra_numero if hasattr(nota, 'orden_compra_numero') else None,
                "factura_numero": nota.factura_numero if hasattr(nota, 'factura_numero') else None,
                "guia_numero": nota.guia_numero if hasattr(nota, 'guia_numero') else None,
                "observaciones": nota.observaciones if hasattr(nota, 'observaciones') else None,
                "visitante_nombre": nota.visitante_nombre if hasattr(nota, 'visitante_nombre') else None,
                "visitante_dni": nota.visitante_dni if hasattr(nota, 'visitante_dni') else None,
                "visitante_empresa": nota.visitante_empresa if hasattr(nota, 'visitante_empresa') else None,
            }
            for nota in expediente.notas_entrega
        ],
        
        # Documentos de identidad
        "documentos_identidad": documentos_identidad_list,
    }


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
    
    nuevo_codigo = f"EXP-{numero_orden}"
    
    # Verificar si YA existe otro expediente con este número de OC
    expediente_duplicado = db.query(Expediente).filter(
        Expediente.numero_orden_compra == numero_orden,
        Expediente.id != expediente_id
    ).first()
    
    if expediente_duplicado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe el expediente {expediente_duplicado.codigo_expediente} con la OC {numero_orden}. Usa ese expediente o sube una OC diferente."
        )
    
    # Actualizar con número de OC
    expediente.codigo_expediente = nuevo_codigo
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


@router.post("/{expediente_id}/exentar")
def exentar_documento(
    expediente_id: int,
    request: dict,
    db: Session = Depends(get_db)
):
    """Marca/desmarca un tipo de documento como no requerido para este expediente.
    Solo aplica a tipo_documento_id 1 (Factura), 2 (Guía de Remisión) y 6 (RxH).
    """
    tipo_id = request.get('tipo_documento_id')
    exentar = request.get('exentar', True)  # True=exentar, False=revertir

    if tipo_id not in [1, 2, 6]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede exentar Factura (1), Guía de Remisión (2) o Recibo por Honorarios (6)"
        )

    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    exentos = list(expediente.documentos_exentos or [])

    if exentar and tipo_id not in exentos:
        exentos.append(tipo_id)
    elif not exentar and tipo_id in exentos:
        exentos.remove(tipo_id)

    from sqlalchemy.orm.attributes import flag_modified
    expediente.documentos_exentos = exentos
    flag_modified(expediente, 'documentos_exentos')
    db.commit()
    db.refresh(expediente)

    return {
        "expediente_id": expediente_id,
        "documentos_exentos": expediente.documentos_exentos
    }


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

    exentos = expediente.documentos_exentos or []

    tiene_oc = any(d.tipo_documento_id == 3 for d in expediente.documentos)
    tiene_factura_o_rxh = any(d.tipo_documento_id in [1, 6] for d in expediente.documentos)
    tiene_guia = any(d.tipo_documento_id == 2 for d in expediente.documentos)

    factura_requerida = 1 not in exentos and 6 not in exentos
    guia_requerida = 2 not in exentos

    factura_ok = tiene_factura_o_rxh or not factura_requerida
    guia_ok = tiene_guia or not guia_requerida

    completo = tiene_oc and factura_ok and guia_ok

    if completo:
        expediente.estado = 'completo'
        expediente.fecha_cierre = date.today()
    elif tiene_oc:
        expediente.estado = 'en_proceso'
    else:
        expediente.estado = 'incompleto'

    db.commit()
    db.refresh(expediente)

    faltantes = []
    if not tiene_oc:
        faltantes.append("Orden de Compra")
    if factura_requerida and not tiene_factura_o_rxh:
        faltantes.append("Factura / Recibo por Honorarios")
    if guia_requerida and not tiene_guia:
        faltantes.append("Guía de Remisión")

    return {
        "expediente_id": expediente.id,
        "codigo": expediente.codigo_expediente,
        "estado": expediente.estado,
        "tiene_oc": tiene_oc,
        "tiene_factura": tiene_factura_o_rxh,
        "tiene_guia": tiene_guia,
        "completo": expediente.estado == 'completo',
        "documentos_faltantes": faltantes
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

from fastapi.responses import StreamingResponse
import zipfile
import io
import os

@router.get("/{expediente_id}/descargar-zip")
async def descargar_expediente_zip(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Descarga todos los documentos del expediente en un ZIP (incluye docs de identidad)"""
    
    expediente = db.query(Expediente).options(
        joinedload(Expediente.documentos)
    ).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Crear ZIP en memoria
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        archivos_agregados = 0
        
        # ============================================
        # DOCUMENTOS NORMALES (Facturas, Guías, OC, Notas)
        # ============================================
        for documento in expediente.documentos:
            if documento.archivo_original_url:
                archivo_path = documento.archivo_original_url
                
                if os.path.exists(archivo_path):
                    tipo_nombre = {
                        1: "Factura",
                        2: "Guia_Remision",
                        3: "Orden_Compra",
                        4: "Nota_Entrega",
                        6: "Recibo_Honorarios"
                    }.get(documento.tipo_documento_id, "Documento")
                    
                    if documento.archivo_original_nombre:
                        extension = os.path.splitext(documento.archivo_original_nombre)[1]
                    else:
                        extension = os.path.splitext(documento.archivo_original_url)[1]
                    
                    nombre_en_zip = f"{tipo_nombre}_{documento.numero_documento}{extension}"
                    
                    try:
                        with open(archivo_path, 'rb') as f:
                            zip_file.writestr(nombre_en_zip, f.read())
                        archivos_agregados += 1
                    except Exception as e:
                        pass
        
        # ============================================
        # DOCUMENTOS DE IDENTIDAD
        # ============================================
        documentos_identidad = []
        if hasattr(expediente, 'documentos_identidad') and expediente.documentos_identidad:
            documentos_identidad = expediente.documentos_identidad
        
        for doc_id in documentos_identidad:
            if hasattr(doc_id, 'archivo_url') and doc_id.archivo_url:
                archivo_path = doc_id.archivo_url
                
                if os.path.exists(archivo_path):
                    tipo_doc = doc_id.tipo_documento.replace(" ", "_") if hasattr(doc_id, 'tipo_documento') else "DocIdentidad"
                    numero = doc_id.numero_documento if hasattr(doc_id, 'numero_documento') else "SN"
                    extension = doc_id.archivo_tipo if hasattr(doc_id, 'archivo_tipo') else "pdf"
                    
                    if not extension.startswith('.'):
                        extension = f".{extension}"
                    
                    nombre_en_zip = f"{tipo_doc}_{numero}{extension}"
                    
                    try:
                        with open(archivo_path, 'rb') as f:
                            zip_file.writestr(nombre_en_zip, f.read())
                        archivos_agregados += 1
                    except Exception as e:
                        pass
        
        # Si no se agregó ningún archivo, agregar un archivo de texto
        if archivos_agregados == 0:
            contenido = f"Expediente: {expediente.codigo_expediente}\n"
            contenido += f"Orden de Compra: {expediente.numero_orden_compra}\n\n"
            contenido += "ADVERTENCIA: No se encontraron archivos físicos.\n"
            contenido += "Los documentos están registrados en el sistema pero los archivos no están disponibles.\n\n"
            contenido += "Documentos registrados:\n"
            
            for doc in expediente.documentos:
                contenido += f"- Tipo: {doc.tipo_documento_id}, Número: {doc.numero_documento}\n"
            
            zip_file.writestr("ADVERTENCIA.txt", contenido)
    
    # Preparar respuesta
    zip_buffer.seek(0)
    
    return StreamingResponse(
        iter([zip_buffer.getvalue()]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={expediente.codigo_expediente}.zip"
        }
    )

@router.post("/{expediente_id}/cerrar")
def cerrar_expediente_manualmente(
    expediente_id: int,
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Cierra un expediente manualmente sin requerir todos los documentos
    """
    motivo_cierre = request.get('motivo_cierre', '')
    
    if not motivo_cierre or len(motivo_cierre) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El motivo de cierre debe tener al menos 10 caracteres"
        )
    
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    if expediente.estado == 'completo' or expediente.cerrado_manualmente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El expediente ya está cerrado"
        )
    
    expediente.cerrado_manualmente = True
    expediente.fecha_cierre = date.today()
    expediente.cerrado_por = 'admin'
    expediente.motivo_cierre = motivo_cierre
    expediente.estado = 'cerrado_manual'
    
    db.commit()
    db.refresh(expediente)
    
    return {
        "id": expediente.id,
        "codigo_expediente": expediente.codigo_expediente,
        "estado": expediente.estado,
        "cerrado_manualmente": expediente.cerrado_manualmente,
        "fecha_cierre": expediente.fecha_cierre,
        "cerrado_por": expediente.cerrado_por,
        "motivo_cierre": expediente.motivo_cierre
    }


@router.post("/{expediente_id}/reabrir")
def reabrir_expediente(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Reabre un expediente cerrado manualmente"""
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    if not expediente.cerrado_manualmente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El expediente no fue cerrado manualmente"
        )
    
    expediente.cerrado_manualmente = False
    expediente.fecha_cierre = None
    expediente.cerrado_por = None
    expediente.motivo_cierre = None
    expediente.estado = 'en_proceso'
    
    db.commit()
    db.refresh(expediente)
    
    return {
        "id": expediente.id,
        "codigo_expediente": expediente.codigo_expediente,
        "estado": expediente.estado,
        "cerrado_manualmente": expediente.cerrado_manualmente,
        "fecha_cierre": expediente.fecha_cierre,
        "cerrado_por": expediente.cerrado_por,
        "motivo_cierre": expediente.motivo_cierre
    }

@router.get("/verificar-oc/{numero_orden}")
def verificar_orden_existente(
    numero_orden: str,
    db: Session = Depends(get_db)
):
    """Verifica si ya existe un expediente con este número de OC"""
    expediente = db.query(Expediente).filter(
        Expediente.numero_orden_compra == numero_orden
    ).first()
    
    if expediente:
        return {
            "existe": True,
            "expediente_id": expediente.id,
            "codigo_expediente": expediente.codigo_expediente,
            "estado": expediente.estado
        }
    
    return {
        "existe": False
    }