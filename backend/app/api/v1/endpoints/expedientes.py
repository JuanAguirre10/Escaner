"""
Endpoints para Expedientes
Gestión de expedientes documentales
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
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

from fastapi.responses import StreamingResponse
import zipfile
import io
import os

@router.get("/{expediente_id}/descargar-zip")
async def descargar_expediente_zip(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Descarga todos los documentos del expediente en un ZIP"""
    
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
        
        for documento in expediente.documentos:
            if documento.archivo_original_url:
                # La URL es una ruta ABSOLUTA completa
                archivo_path = documento.archivo_original_url
                
                print(f"🔍 Buscando archivo: {archivo_path}")
                
                if os.path.exists(archivo_path):
                    # Nombre del archivo en el ZIP
                    tipo_nombre = {
                        1: "Factura",
                        2: "Guia_Remision",
                        3: "Orden_Compra"
                    }.get(documento.tipo_documento_id, "Documento")
                    
                    # Usar el nombre original o crear uno
                    if documento.archivo_original_nombre:
                        extension = os.path.splitext(documento.archivo_original_nombre)[1]
                    else:
                        extension = os.path.splitext(documento.archivo_original_url)[1]
                    
                    nombre_en_zip = f"{tipo_nombre}_{documento.numero_documento}{extension}"
                    
                    # Agregar archivo al ZIP
                    try:
                        with open(archivo_path, 'rb') as f:
                            zip_file.writestr(nombre_en_zip, f.read())
                        archivos_agregados += 1
                        print(f"✅ Agregado: {nombre_en_zip}")
                    except Exception as e:
                        print(f"❌ Error agregando {archivo_path}: {str(e)}")
                else:
                    print(f"❌ Archivo no encontrado: {archivo_path}")
        
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
        else:
            print(f"✅ ZIP creado con {archivos_agregados} archivo(s)")
    
    # Preparar respuesta
    zip_buffer.seek(0)
    
    return StreamingResponse(
        iter([zip_buffer.getvalue()]),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={expediente.codigo_expediente}.zip"
        }
    )