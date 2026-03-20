"""
Endpoints para Notas de Entrega
Documentos manuales de recepción que generan PDF y se registran como documentos
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

from app.db.session import get_db
from app.db.models import NotaEntrega, Documento, Expediente
from app.schemas import (
    NotaEntregaCreate,
    NotaEntregaUpdate,
    NotaEntregaResponse
)
from app.config import settings

router = APIRouter()


def generar_pdf_nota_entrega(nota: NotaEntrega, expediente: Optional[Expediente], output_path: Path) -> Path:
    """
    Genera un PDF profesional de la nota de entrega
    
    Args:
        nota: Objeto NotaEntrega
        expediente: Expediente asociado (opcional)
        output_path: Ruta donde guardar el PDF
    
    Returns:
        Path al PDF generado
    """
    # Crear PDF
    doc = SimpleDocTemplate(str(output_path), pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    # Título
    story.append(Paragraph("NOTA DE ENTREGA", title_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Información Principal
    data_principal = [
        ['Número de Nota:', nota.numero_nota or 'N/A'],
        ['Fecha de Recepción:', nota.fecha_recepcion.strftime('%d/%m/%Y') if nota.fecha_recepcion else 'N/A'],
        ['Recibido por:', nota.recibido_por or 'N/A'],
        ['Estado de Mercadería:', nota.estado_mercaderia or 'N/A'],
    ]
    
    if nota.visitante_nombre or nota.visitante_dni:
        data_principal.append(['Visitante:', nota.visitante_nombre or 'N/A'])
        data_principal.append(['DNI Visitante:', nota.visitante_dni or 'N/A'])
        if nota.visitante_empresa:
            data_principal.append(['Empresa Visitante:', nota.visitante_empresa])

    table_principal = Table(data_principal, colWidths=[2.5*inch, 4*inch])
    table_principal.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(table_principal)
    story.append(Spacer(1, 0.3 * inch))
    
    # Referencias
    if nota.orden_compra_numero or nota.factura_numero or nota.guia_numero:
        story.append(Paragraph("REFERENCIAS", styles['Heading2']))
        story.append(Spacer(1, 0.1 * inch))
        
        data_ref = []
        if nota.orden_compra_numero:
            data_ref.append(['Orden de Compra:', nota.orden_compra_numero])
        if nota.factura_numero:
            data_ref.append(['Factura:', nota.factura_numero])
        if nota.guia_numero:
            data_ref.append(['Guía de Remisión:', nota.guia_numero])
        
        if expediente:
            data_ref.append(['Expediente:', expediente.codigo_expediente])
        
        table_ref = Table(data_ref, colWidths=[2.5*inch, 4*inch])
        table_ref.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(table_ref)
        story.append(Spacer(1, 0.3 * inch))
    
    # Observaciones
    if nota.observaciones:
        story.append(Paragraph("OBSERVACIONES", styles['Heading2']))
        story.append(Spacer(1, 0.1 * inch))
        
        obs_style = ParagraphStyle(
            'Observaciones',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            spaceBefore=0,
            spaceAfter=0,
        )
        
        story.append(Paragraph(nota.observaciones or 'Sin observaciones', obs_style))
        story.append(Spacer(1, 0.3 * inch))
    
    # Pie de página
    story.append(Spacer(1, 0.5 * inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        alignment=1
    )
    
    fecha_generacion = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    story.append(Paragraph(f"Generado automáticamente el {fecha_generacion}", footer_style))
    
    # Construir PDF
    doc.build(story)
    
    return output_path


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
    """
    Crea una nueva nota de entrega
    
    Proceso:
    1. Crea registro en tabla notas_entrega
    2. Genera PDF de la nota
    3. Crea registro en tabla documentos (tipo_documento_id = 4)
    """
    
    # Verificar que no exista el número
    nota_existente = db.query(NotaEntrega).filter(
        NotaEntrega.numero_nota == nota.numero_nota
    ).first()
    
    if nota_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una nota con el número {nota.numero_nota}"
        )
    
    # Crear nota de entrega
    nueva_nota = NotaEntrega(**nota.model_dump())
    db.add(nueva_nota)
    db.flush()  # Para obtener el ID
    
    # Obtener expediente si existe
    expediente = None
    if nueva_nota.expediente_id:
        expediente = db.query(Expediente).filter(
            Expediente.id == nueva_nota.expediente_id
        ).first()
    
    # Generar PDF
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_pdf = f"nota_entrega_{nueva_nota.numero_nota}_{timestamp}.pdf"
    
    # Crear directorio si no existe
    upload_dir = settings.upload_path / "notas_entrega"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    ruta_pdf = upload_dir / nombre_pdf
    
    try:
        generar_pdf_nota_entrega(nueva_nota, expediente, ruta_pdf)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando PDF: {str(e)}"
        )
    
    # Crear documento asociado (tipo_documento_id = 4 = NOTA_ENTREGA)
    nuevo_documento = Documento(
        empresa_id=None,  # Las notas no tienen empresa
        expediente_id=nueva_nota.expediente_id,
        tipo_documento_id=4,  # NOTA_ENTREGA
        
        # Identificación
        numero_documento=nueva_nota.numero_nota,
        serie="",
        correlativo="",
        tipo_comprobante="NOTA_ENTREGA",
        
        # Fechas
        fecha_emision=nueva_nota.fecha_recepcion,
        
        # Datos del emisor (quien recibe = SUPERVAN)
        ruc_emisor=settings.EMPRESA_RUC,
        razon_social_emisor=settings.EMPRESA_RAZON_SOCIAL,
        direccion_emisor=settings.EMPRESA_DIRECCION,
        
        # Datos del cliente (proveedor en este caso)
        ruc_cliente="",
        razon_social_cliente="",
        
        # Referencias
        orden_compra=nueva_nota.orden_compra_numero,
        guia_remision=nueva_nota.guia_numero,
        
        # Montos (las notas no tienen montos)
        subtotal=None,
        igv=None,
        total=None,
        moneda=None,
        
        # Archivo PDF
        archivo_original_nombre=nombre_pdf,
        archivo_original_url=str(ruta_pdf),
        archivo_original_tipo="pdf",
        archivo_original_size=ruta_pdf.stat().st_size,
        
        # OCR (no aplica)
        texto_ocr_completo="",
        datos_ocr_json="{}",
        confianza_ocr_promedio=100.0,  # 100% porque es generado por el sistema
        procesado_con="sistema_interno",
        tiempo_procesamiento_segundos=0,
        
        # Estado
        estado="validada",  # Las notas se crean ya validadas
        validado=True,
        validado_por=nueva_nota.created_by or "admin",
        validado_en=datetime.now(),
        
        # Observaciones
        observaciones=nueva_nota.observaciones,
        
        # Auditoría
        created_by=nueva_nota.created_by or "admin",
        updated_by=nueva_nota.created_by or "admin",
    )
    
    db.add(nuevo_documento)
    
    try:
        db.commit()
        db.refresh(nueva_nota)
    except Exception as e:
        # Eliminar PDF si falla el commit
        if ruta_pdf.exists():
            ruta_pdf.unlink()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error guardando en base de datos: {str(e)}"
        )
    
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