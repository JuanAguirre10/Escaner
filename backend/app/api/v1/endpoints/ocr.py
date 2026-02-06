"""
Endpoints para procesamiento OCR
"""

import os
import time
import shutil
from pathlib import Path
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import settings
from app.db.models import Factura, FacturaItem, Proveedor
from app.schemas import FacturaOCRResponse

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/procesar", response_model=FacturaOCRResponse, status_code=status.HTTP_201_CREATED)
async def procesar_factura_ocr(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    inicio = time.time()
    
    extension = archivo.filename.split('.')[-1].lower()
    if extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión no permitida"
        )
    
    contenido = await archivo.read()
    tamano_mb = len(contenido) / (1024 * 1024)
    
    if tamano_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Archivo excede tamaño máximo"
        )
    
    await archivo.seek(0)
    
    fecha_hoy = datetime.now()
    carpeta_fecha = settings.upload_path / str(fecha_hoy.year) / f"{fecha_hoy.month:02d}" / f"{fecha_hoy.day:02d}"
    carpeta_fecha.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"{timestamp}_{archivo.filename}"
    ruta_archivo = carpeta_fecha / nombre_archivo
    
    try:
        with open(ruta_archivo, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
        logger.info(f"Archivo guardado: {ruta_archivo}")
    except Exception as e:
        logger.error(f"Error guardando archivo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar el archivo"
        )
    
    try:
        from app.core.ocr import extraer_con_claude
        datos_parseados, confianza = extraer_con_claude(ruta_archivo)
        texto_ocr = str(datos_parseados)
        logger.info(f"Claude Vision completado - Confianza: {confianza}%")
    except Exception as e:
        logger.error(f"Error en Claude Vision: {e}")
        if ruta_archivo.exists():
            ruta_archivo.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar con IA: {str(e)}"
        )
    
    # Convertir primera página de PDF a imagen para preview
    if extension == 'pdf':
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(ruta_archivo, first_page=1, last_page=1, dpi=150)
            if images:
                imagen_path = ruta_archivo.with_suffix('.jpg')
                images[0].save(imagen_path, 'JPEG', quality=85)
                logger.info(f"Imagen preview creada: {imagen_path}")
        except Exception as e:
            logger.warning(f"No se pudo crear preview: {e}")

    proveedor = None
    if datos_parseados.get("ruc_emisor"):
        proveedor = db.query(Proveedor).filter(
            Proveedor.ruc == datos_parseados["ruc_emisor"]
        ).first()
        
        if not proveedor and datos_parseados.get("razon_social_emisor"):
            proveedor = Proveedor(
                ruc=datos_parseados["ruc_emisor"],
                razon_social=datos_parseados["razon_social_emisor"],
                direccion=datos_parseados.get("direccion_emisor"),
                telefono=datos_parseados.get("telefono_emisor"),
                email=datos_parseados.get("email_emisor"),
            )
            db.add(proveedor)
            db.flush()
            logger.info(f"Proveedor creado: {proveedor.razon_social}")
    
    es_duplicada = False
    factura_original_id = None
    
    if datos_parseados.get("numero_factura"):
        factura_existente = db.query(Factura).filter(
            Factura.numero_factura == datos_parseados["numero_factura"],
            Factura.es_version_actual == True
        ).first()
        
        if factura_existente:
            es_duplicada = True
            factura_original_id = factura_existente.id
            logger.warning(f"Factura duplicada detectada: {datos_parseados['numero_factura']}")
    
    tiempo_procesamiento = time.time() - inicio
    ruta_relativa = str(ruta_archivo.relative_to(settings.upload_path.parent))
    
    factura = Factura(
        proveedor_id=proveedor.id if proveedor else None,
        numero_factura=datos_parseados.get("numero_factura") or f"TEMP-{int(time.time())}",
        serie=datos_parseados.get("serie") or "TEMP",
        correlativo=datos_parseados.get("correlativo") or f"{int(time.time()) % 100000000:08d}",
        tipo_comprobante="FACTURA",
        fecha_emision=datos_parseados.get("fecha_emision") or datetime.now().date(),
        fecha_vencimiento=datos_parseados.get("fecha_vencimiento"),
        ruc_emisor=datos_parseados.get("ruc_emisor") or "00000000000",
        razon_social_emisor=datos_parseados.get("razon_social_emisor") or "DESCONOCIDO",
        direccion_emisor=datos_parseados.get("direccion_emisor"),
        telefono_emisor=datos_parseados.get("telefono_emisor"),
        email_emisor=datos_parseados.get("email_emisor"),
        ruc_cliente=settings.EMPRESA_RUC,
        razon_social_cliente=settings.EMPRESA_RAZON_SOCIAL,
        direccion_cliente=settings.EMPRESA_DIRECCION,
        orden_compra=datos_parseados.get("orden_compra"),
        subtotal=datos_parseados.get("subtotal") or Decimal('0.0'),
        igv=datos_parseados.get("igv") or Decimal('0.0'),
        total=datos_parseados.get("total") or Decimal('0.01'),
        moneda=datos_parseados.get("moneda") or "PEN",
        forma_pago=datos_parseados.get("forma_pago"),
        condicion_pago=datos_parseados.get("condicion_pago"),
        archivo_original_nombre=archivo.filename,
        archivo_original_url=ruta_relativa,
        archivo_original_tipo=extension,
        archivo_original_size=len(contenido),
        texto_ocr_completo=texto_ocr,
        datos_ocr_json=str(datos_parseados),
        confianza_ocr_promedio=Decimal(str(confianza)),
        procesado_con="claude_vision",
        tiempo_procesamiento_segundos=Decimal(str(round(tiempo_procesamiento, 2))),
        estado="duplicada" if es_duplicada else "pendiente_validacion",
        es_duplicada=es_duplicada,
        factura_original_id=factura_original_id,
        validado=False,
    )
    
    db.add(factura)
    db.commit()
    db.refresh(factura)
    
    logger.info(f"Factura guardada en BD - ID: {factura.id}")
    
    items_parseados = datos_parseados.get("items", [])
    if items_parseados:
        for idx, item_data in enumerate(items_parseados, start=1):
            if item_data.get("descripcion"):
                try:
                    item = FacturaItem(
                        factura_id=factura.id,
                        orden=idx,
                        descripcion=str(item_data.get("descripcion", ""))[:500],
                        cantidad=item_data.get("cantidad", 1),
                        unidad_medida=str(item_data.get("unidad_medida", "UND"))[:10],
                        precio_unitario=item_data.get("precio_unitario", 0),
                        valor_venta=item_data.get("valor_total", 0),
                        valor_total=item_data.get("valor_total", 0),
                    )
                    db.add(item)
                except Exception as e:
                    logger.error(f"Error item {idx}: {e}")
                    continue
        
        db.commit()
        logger.info(f"{len(items_parseados)} items guardados")
    
    return FacturaOCRResponse(
        factura_id=factura.id,
        uuid=str(factura.uuid),
        numero_factura=factura.numero_factura,
        datos_extraidos=datos_parseados,
        confianza_promedio=float(confianza),
        tiempo_procesamiento=float(round(tiempo_procesamiento, 2)),
        estado=factura.estado,
        mensaje="Factura duplicada - Revisar" if es_duplicada else "Factura procesada exitosamente"
    )


@router.post("/reprocesar/{factura_id}", response_model=FacturaOCRResponse)
async def reprocesar_factura(
    factura_id: int,
    db: Session = Depends(get_db)
):
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    ruta_archivo = Path(settings.upload_path.parent) / factura.archivo_original_url
    
    if not ruta_archivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo original no encontrado"
        )
    
    inicio = time.time()
    
    try:
        from app.core.ocr import extraer_con_claude
        datos_parseados, confianza = extraer_con_claude(ruta_archivo)
        texto_ocr = str(datos_parseados)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al reprocesar: {str(e)}"
        )
    
    tiempo_procesamiento = time.time() - inicio
    
    factura.texto_ocr_completo = texto_ocr
    factura.datos_ocr_json = str(datos_parseados)
    factura.confianza_ocr_promedio = Decimal(str(confianza))
    factura.tiempo_procesamiento_segundos = Decimal(str(round(tiempo_procesamiento, 2)))
    
    if datos_parseados.get("numero_factura") and factura.numero_factura.startswith("TEMP-"):
        factura.numero_factura = datos_parseados["numero_factura"]
        factura.serie = datos_parseados.get("serie")
        factura.correlativo = datos_parseados.get("correlativo")
    
    db.commit()
    db.refresh(factura)
    
    return FacturaOCRResponse(
        factura_id=factura.id,
        uuid=str(factura.uuid),
        numero_factura=factura.numero_factura,
        datos_extraidos=datos_parseados,
        confianza_promedio=float(confianza),
        tiempo_procesamiento=float(round(tiempo_procesamiento, 2)),
        estado=factura.estado,
        mensaje="Factura reprocesada exitosamente"
    )