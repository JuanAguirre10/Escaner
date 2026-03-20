"""
Endpoints para Documentos de Identidad
DNI, Carnet de Extranjería, Pasaporte, CPP
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import shutil

from app.db.session import get_db
from app.db.models.documento_identidad import DocumentoIdentidad
from app.db.models.expediente import Expediente
from app.db.models.documento import Documento
from app.schemas.documento_identidad import (
    DocumentoIdentidadResponse,
    DocumentoIdentidadUpdate
)
from app.core.ocr.claude_extractor import ClaudeExtractor
from app.config import settings

router = APIRouter()


@router.post("/procesar", response_model=DocumentoIdentidadResponse, status_code=status.HTTP_201_CREATED)
async def procesar_documento_identidad(
    expediente_id: int = Form(...),
    archivo: UploadFile = File(...),
    motivo_visita: Optional[str] = Form(None),
    empresa_visitante: Optional[str] = Form(None),
    cargo: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Procesa un documento de identidad con OCR
    Detecta automáticamente: DNI, Carnet de Extranjería, Pasaporte, CPP
    """
    # Verificar que el expediente existe
    expediente = db.query(Expediente).filter(Expediente.id == expediente_id).first()
    if not expediente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expediente con ID {expediente_id} no encontrado"
        )
    
    # Crear carpeta para documentos de identidad
    docs_identidad_dir = settings.upload_path / "documentos_identidad"
    docs_identidad_dir.mkdir(parents=True, exist_ok=True)
    
    # Nombre único para el archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = archivo.filename.split(".")[-1].lower()
    filename = f"identidad_{timestamp}_{archivo.filename}"
    ruta_archivo = docs_identidad_dir / filename
    
    try:
        # Guardar archivo PERMANENTEMENTE
        with open(ruta_archivo, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
        
        # Procesar con OCR
        extractor = ClaudeExtractor()
        datos_ocr = extractor.extraer_datos_identidad(str(ruta_archivo))
        
        # Convertir fechas a strings para JSONB
        datos_ocr_json = datos_ocr.copy()
        for campo in ['fecha_nacimiento', 'fecha_emision', 'fecha_vencimiento']:
            if datos_ocr_json.get(campo):
                datos_ocr_json[campo] = str(datos_ocr_json[campo])
        
        # Crear registro en base de datos CON archivo_url
        doc_identidad = DocumentoIdentidad(
            expediente_id=expediente_id,
            tipo_documento=datos_ocr.get('tipo_documento'),
            numero_documento=datos_ocr.get('numero_documento'),
            nombres=datos_ocr.get('nombres'),
            apellidos=datos_ocr.get('apellidos'),
            nombre_completo=datos_ocr.get('nombre_completo'),
            nacionalidad=datos_ocr.get('nacionalidad'),
            fecha_nacimiento=datos_ocr.get('fecha_nacimiento'),
            fecha_emision=datos_ocr.get('fecha_emision'),
            fecha_vencimiento=datos_ocr.get('fecha_vencimiento'),
            sexo=datos_ocr.get('sexo'),
            motivo_visita=motivo_visita,
            empresa_visitante=empresa_visitante,
            cargo=cargo,
            archivo_url=str(ruta_archivo),  # 👈 GUARDAR RUTA
            archivo_tipo=file_ext,          # 👈 GUARDAR TIPO
            datos_ocr_completos=datos_ocr_json,
            created_by='admin'
        )
        
        db.add(doc_identidad)
        db.commit()
        db.refresh(doc_identidad)
        
        return doc_identidad
        
    except Exception as e:
        db.rollback()
        # Si falla, eliminar archivo
        if ruta_archivo.exists():
            ruta_archivo.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando documento: {str(e)}"
        )


@router.get("/expediente/{expediente_id}", response_model=List[DocumentoIdentidadResponse])
def listar_documentos_identidad(
    expediente_id: int,
    db: Session = Depends(get_db)
):
    """Lista todos los documentos de identidad de un expediente"""
    documentos = db.query(DocumentoIdentidad).filter(
        DocumentoIdentidad.expediente_id == expediente_id,
        DocumentoIdentidad.deleted_at.is_(None)
    ).all()
    
    return documentos


@router.get("/{doc_id}", response_model=DocumentoIdentidadResponse)
def obtener_documento_identidad(
    doc_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene un documento de identidad específico"""
    documento = db.query(DocumentoIdentidad).filter(
        DocumentoIdentidad.id == doc_id,
        DocumentoIdentidad.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento de identidad con ID {doc_id} no encontrado"
        )
    
    return documento


@router.put("/{doc_id}", response_model=DocumentoIdentidadResponse)
def actualizar_documento_identidad(
    doc_id: int,
    doc_update: DocumentoIdentidadUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza un documento de identidad"""
    documento = db.query(DocumentoIdentidad).filter(
        DocumentoIdentidad.id == doc_id,
        DocumentoIdentidad.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento de identidad con ID {doc_id} no encontrado"
        )
    
    update_data = doc_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(documento, field, value)
    
    documento.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(documento)
    
    return documento


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documento_identidad(
    doc_id: int,
    db: Session = Depends(get_db)
):
    """Elimina (soft delete) un documento de identidad"""
    documento = db.query(DocumentoIdentidad).filter(
        DocumentoIdentidad.id == doc_id,
        DocumentoIdentidad.deleted_at.is_(None)
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento de identidad con ID {doc_id} no encontrado"
        )
    
    documento.deleted_at = datetime.utcnow()
    db.commit()
    
    return None