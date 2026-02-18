"""
Endpoints para procesamiento OCR de documentos
Sube archivos y procesa con Claude Vision API
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
from datetime import datetime
from typing import Optional

from app.db.session import get_db
from app.db.models import Documento, DocumentoItem, Empresa, TipoDocumento, GuiaRemision
from app.schemas import DocumentoOCRResponse, DocumentoCreate
from app.config import settings
from app.core.ocr.claude_extractor import ClaudeExtractor

router = APIRouter()


# ==================================
# HELPER: VALIDAR ARCHIVO
# ==================================

def validar_archivo(file: UploadFile) -> None:
    """Valida el tipo y tamaño del archivo"""
    # Validar extensión
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión .{file_ext} no permitida. Use: {', '.join(settings.allowed_extensions_list)}"
        )
    
    # Validar tamaño (aproximado por content-length)
    if hasattr(file, 'size') and file.size:
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Archivo muy grande. Máximo {settings.MAX_FILE_SIZE_MB}MB"
            )


# ==================================
# HELPER: GUARDAR ARCHIVO
# ==================================

def guardar_archivo(file: UploadFile, upload_dir: Path) -> tuple[str, Path, int]:
    """
    Guarda el archivo en el disco
    
    Returns:
        tuple: (nombre_archivo, ruta_completa, tamaño_bytes)
    """
    # Crear nombre único
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = file.filename.split(".")[-1].lower()
    nombre_archivo = f"{timestamp}_{file.filename}"
    ruta_archivo = upload_dir / nombre_archivo
    
    # Guardar archivo
    with open(ruta_archivo, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Obtener tamaño
    tamaño = ruta_archivo.stat().st_size
    
    return nombre_archivo, ruta_archivo, tamaño


# ==================================
# ENDPOINT: SUBIR Y PROCESAR DOCUMENTO
# ==================================

@router.post("/procesar", response_model=DocumentoOCRResponse)
async def procesar_documento(
    file: UploadFile = File(...),
    empresa_id: Optional[int] = Form(None),
    tipo_documento_id: int = Form(1),  # Por defecto FACTURA
    db: Session = Depends(get_db)
):
    # DEBUG: Ver qué tipo se está recibiendo
    print(f"🔍 DEBUG: tipo_documento_id recibido = {tipo_documento_id}")
    
    # 1. Validar archivo
    validar_archivo(file)

    """
    Sube un archivo y lo procesa con Claude Vision OCR
    
    **Parámetros:**
    - file: Archivo PDF o imagen
    - empresa_id: ID de la empresa emisora (opcional)
    - tipo_documento_id: 1=FACTURA, 2=GUIA_REMISION, 3=ORDEN_VENTA
    
    **Proceso:**
    1. Valida archivo
    2. Guarda en disco
    3. Procesa con Claude Vision
    4. Extrae datos estructurados
    5. Crea documento en BD
    6. Retorna datos extraídos
    """
    # 1. Validar archivo
    validar_archivo(file)
    
    # 2. Guardar archivo
    nombre_archivo, ruta_archivo, tamaño = guardar_archivo(
        file, 
        settings.upload_path
    )
    
    try:
        # 3. Procesar con Claude Vision SEGÚN EL TIPO
        extractor = ClaudeExtractor()
        inicio_procesamiento = datetime.now()
        
        # ========================================
        # DECISIÓN: ¿Factura o Guía de Remisión?
        # ========================================
        
        if tipo_documento_id == 2:  # GUÍA DE REMISIÓN
            # Procesar SOLO como guía
            datos_guia = extractor.extraer_datos_guia_remision(
                ruta_archivo=str(ruta_archivo),
                tipo_archivo=file.filename.split(".")[-1].lower()
            )
            
            tiempo_procesamiento = (datetime.now() - inicio_procesamiento).total_seconds()
            
            # Verificar empresa
            empresa = None
            if empresa_id:
                empresa = db.query(Empresa).filter(
                    Empresa.id == empresa_id
                ).first()
            else:
                ruc_emisor = datos_guia.get("ruc_emisor")
                if ruc_emisor:
                    empresa = db.query(Empresa).filter(
                        Empresa.ruc == ruc_emisor
                    ).first()
            
            # Crear documento base para la guía
            nuevo_documento = Documento(
                empresa_id=empresa.id if empresa else None,
                tipo_documento_id=tipo_documento_id,
                
                # Datos básicos de la guía
                numero_documento=datos_guia.get("numero_guia", "TEMP-" + nombre_archivo),
                serie=datos_guia.get("serie", ""),
                correlativo=datos_guia.get("correlativo", ""),
                tipo_comprobante="GUIA_REMISION",
                
                # Fechas
                fecha_emision=datos_guia.get("fecha_emision") or datetime.now().date(),
                
                # Datos del emisor
                ruc_emisor=datos_guia.get("ruc_emisor", ""),
                razon_social_emisor=datos_guia.get("razon_social_emisor", ""),
                direccion_emisor=datos_guia.get("direccion_emisor"),
                
                # Datos del destinatario
                ruc_cliente=datos_guia.get("ruc_destinatario", settings.EMPRESA_RUC),
                razon_social_cliente=datos_guia.get("razon_social_destinatario", settings.EMPRESA_RAZON_SOCIAL),
                direccion_cliente=datos_guia.get("direccion_destinatario"),
                
                # ⚠️ CRÍTICO: Guías NO tienen montos - TODO en None
                subtotal=None,
                igv=None,
                total=None,
                moneda=None,
                
                # Archivos
                archivo_original_nombre=nombre_archivo,
                archivo_original_url=str(ruta_archivo),
                archivo_original_tipo=file.filename.split(".")[-1].lower(),
                archivo_original_size=tamaño,
                
                # OCR
                texto_ocr_completo=datos_guia.get("texto_completo", ""),
                datos_ocr_json=str(datos_guia),
                confianza_ocr_promedio=datos_guia.get("confianza_promedio", 0.0),
                procesado_con="claude_vision",
                tiempo_procesamiento_segundos=tiempo_procesamiento,
                
                # Estado
                estado="pendiente_validacion",
                validado=False,
            )
            
            db.add(nuevo_documento)
            db.flush()
            
            # Crear registro de GuiaRemision con datos detallados
            nueva_guia = GuiaRemision(
                documento_id=nuevo_documento.id,
                numero_guia=datos_guia.get("numero_guia", ""),
                fecha_traslado=datos_guia.get("fecha_traslado"),
                motivo_traslado=datos_guia.get("motivo_traslado"),
                modalidad_transporte=datos_guia.get("modalidad_transporte"),
                punto_partida=datos_guia.get("punto_partida"),
                punto_llegada=datos_guia.get("punto_llegada"),
                transportista_razon_social=datos_guia.get("transportista_razon_social"),
                transportista_ruc=datos_guia.get("transportista_ruc"),
                vehiculo_placa=datos_guia.get("vehiculo_placa"),
                vehiculo_mtc=datos_guia.get("vehiculo_mtc"),
                conductor_nombre=datos_guia.get("conductor_nombre"),
                conductor_dni=datos_guia.get("conductor_dni"),
                conductor_licencia=datos_guia.get("conductor_licencia"),
                peso_bruto=datos_guia.get("peso_bruto"),
                unidad_peso=datos_guia.get("unidad_peso", "KGM"),
                transbordo_programado=datos_guia.get("transbordo_programado", False)
            )
            
            db.add(nueva_guia)
            
            # Items de la guía (bienes transportados)
            items = datos_guia.get("items", [])
            for idx, item_data in enumerate(items, 1):
                nuevo_item = DocumentoItem(
                    documento_id=nuevo_documento.id,
                    orden=idx,
                    codigo_producto=item_data.get("codigo_producto"),
                    descripcion=item_data.get("descripcion", ""),
                    cantidad=item_data.get("cantidad", 1.0),
                    unidad_medida=item_data.get("unidad_medida", "UND"),
                    peso_bruto=item_data.get("peso_bruto", 0.0),
                    precio_unitario=0.0,
                    valor_total=0.0,
                    igv_item=0.0,
                    total_item=0.0,
                )
                db.add(nuevo_item)
            
            db.commit()
            db.refresh(nuevo_documento)
            
            return DocumentoOCRResponse(
                documento_id=nuevo_documento.id,
                uuid=str(nuevo_documento.uuid),
                numero_documento=nuevo_documento.numero_documento,
                datos_extraidos=datos_guia,
                confianza_promedio=float(nuevo_documento.confianza_ocr_promedio or 0),
                tiempo_procesamiento=tiempo_procesamiento,
                estado=nuevo_documento.estado,
                mensaje="Guía de remisión procesada exitosamente"
            )
        
        else:  # FACTURA u otros documentos con montos
            # Procesar como factura
            datos_extraidos = extractor.extraer_datos_factura(
                ruta_archivo=str(ruta_archivo),
                tipo_archivo=file.filename.split(".")[-1].lower()
            )
            
            tiempo_procesamiento = (datetime.now() - inicio_procesamiento).total_seconds()
            
            # Verificar empresa
            empresa = None
            if empresa_id:
                empresa = db.query(Empresa).filter(
                    Empresa.id == empresa_id
                ).first()
            else:
                ruc_emisor = datos_extraidos.get("ruc_emisor")
                if ruc_emisor:
                    empresa = db.query(Empresa).filter(
                        Empresa.ruc == ruc_emisor
                    ).first()
            
            # Crear documento
            nuevo_documento = Documento(
                empresa_id=empresa.id if empresa else None,
                tipo_documento_id=tipo_documento_id,
                
                numero_documento=datos_extraidos.get("numero_factura", "TEMP-" + nombre_archivo),
                serie=datos_extraidos.get("serie", ""),
                correlativo=datos_extraidos.get("correlativo", ""),
                tipo_comprobante=datos_extraidos.get("tipo_comprobante", "FACTURA"),
                
                fecha_emision=datos_extraidos.get("fecha_emision") or datetime.now().date(),
                fecha_vencimiento=datos_extraidos.get("fecha_vencimiento"),
                
                ruc_emisor=datos_extraidos.get("ruc_emisor", ""),
                razon_social_emisor=datos_extraidos.get("razon_social_emisor", ""),
                direccion_emisor=datos_extraidos.get("direccion_emisor"),
                telefono_emisor=datos_extraidos.get("telefono_emisor"),
                email_emisor=datos_extraidos.get("email_emisor"),
                
                ruc_cliente=settings.EMPRESA_RUC,
                razon_social_cliente=settings.EMPRESA_RAZON_SOCIAL,
                direccion_cliente=settings.EMPRESA_DIRECCION,
                
                orden_compra=datos_extraidos.get("orden_compra"),
                guia_remision=datos_extraidos.get("guia_remision"),
                
                subtotal=datos_extraidos.get("subtotal", 0.0),
                igv=datos_extraidos.get("igv", 0.0),
                total=datos_extraidos.get("total", 0.0),
                moneda=datos_extraidos.get("moneda", "PEN"),
                
                forma_pago=datos_extraidos.get("forma_pago"),
                condicion_pago=datos_extraidos.get("condicion_pago"),
                
                archivo_original_nombre=nombre_archivo,
                archivo_original_url=str(ruta_archivo),
                archivo_original_tipo=file.filename.split(".")[-1].lower(),
                archivo_original_size=tamaño,
                
                texto_ocr_completo=datos_extraidos.get("texto_completo", ""),
                datos_ocr_json=str(datos_extraidos),
                confianza_ocr_promedio=datos_extraidos.get("confianza_promedio", 0.0),
                procesado_con="claude_vision",
                tiempo_procesamiento_segundos=tiempo_procesamiento,
                
                estado="pendiente_validacion",
                validado=False,
            )
            
            db.add(nuevo_documento)
            db.flush()
            
            # Items de la factura
            items = datos_extraidos.get("items", [])
            for idx, item_data in enumerate(items, 1):
                nuevo_item = DocumentoItem(
                    documento_id=nuevo_documento.id,
                    orden=idx,
                    codigo_producto=item_data.get("codigo_producto"),
                    descripcion=item_data.get("descripcion", ""),
                    detalle_adicional=item_data.get("detalle_adicional"),
                    cantidad=item_data.get("cantidad", 1.0),
                    unidad_medida=item_data.get("unidad_medida", "UND"),
                    precio_unitario=item_data.get("precio_unitario", 0.0),
                    descuento_porcentaje=item_data.get("descuento_porcentaje", 0.0),
                    valor_venta=item_data.get("valor_venta", 0.0),
                    valor_total=item_data.get("valor_total", 0.0),
                    igv_item=item_data.get("igv_item", 0.0),
                    total_item=item_data.get("total_item", 0.0),
                )
                db.add(nuevo_item)
            
            db.commit()
            db.refresh(nuevo_documento)
            
            return DocumentoOCRResponse(
                documento_id=nuevo_documento.id,
                uuid=str(nuevo_documento.uuid),
                numero_documento=nuevo_documento.numero_documento,
                datos_extraidos=datos_extraidos,
                confianza_promedio=float(nuevo_documento.confianza_ocr_promedio or 0),
                tiempo_procesamiento=tiempo_procesamiento,
                estado=nuevo_documento.estado,
                mensaje="Documento procesado exitosamente"
            )
        
    except Exception as e:
        # Si hay error, eliminar archivo
        if ruta_archivo.exists():
            ruta_archivo.unlink()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando documento: {str(e)}"
        )


# ==================================
# ENDPOINT: RE-PROCESAR DOCUMENTO
# ==================================

@router.post("/{documento_id}/reprocesar", response_model=DocumentoOCRResponse)
def reprocesar_documento(
    documento_id: int,
    db: Session = Depends(get_db)
):
    """
    Re-procesa un documento existente con Claude Vision
    
    **Uso:**
    - Para mejorar datos extraídos
    - Cuando el OCR inicial tuvo baja confianza
    """
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
    
    # Verificar que exista el archivo
    ruta_archivo = Path(documento.archivo_original_url)
    if not ruta_archivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo original no encontrado en el servidor"
        )
    
    try:
        # Re-procesar
        extractor = ClaudeExtractor()
        inicio_procesamiento = datetime.now()
        
        datos_extraidos = extractor.extraer_datos_factura(
            ruta_archivo=str(ruta_archivo),
            tipo_archivo=documento.archivo_original_tipo
        )
        
        tiempo_procesamiento = (datetime.now() - inicio_procesamiento).total_seconds()
        
        # Actualizar documento
        documento.texto_ocr_completo = datos_extraidos.get("texto_completo", "")
        documento.datos_ocr_json = str(datos_extraidos)
        documento.confianza_ocr_promedio = datos_extraidos.get("confianza_promedio", 0.0)
        documento.tiempo_procesamiento_segundos = tiempo_procesamiento
        
        db.commit()
        db.refresh(documento)
        
        return DocumentoOCRResponse(
            documento_id=documento.id,
            uuid=str(documento.uuid),
            numero_documento=documento.numero_documento,
            datos_extraidos=datos_extraidos,
            confianza_promedio=float(documento.confianza_ocr_promedio or 0),
            tiempo_procesamiento=tiempo_procesamiento,
            estado=documento.estado,
            mensaje="Documento re-procesado exitosamente"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error re-procesando documento: {str(e)}"
        )