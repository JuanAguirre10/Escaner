"""
Endpoints para Empresas (antes Proveedores)
Incluye validación de RUC y CRUD completo
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import or_


from app.db.session import get_db
from app.db.models import Empresa
from app.schemas import (
    Empresa as EmpresaSchema,
    EmpresaCreate,
    EmpresaUpdate,
    EmpresaSimple,
    ValidarRUCRequest,
    ValidarRUCResponse,
)

router = APIRouter()


# ==================================
# VALIDAR RUC (NUEVO ENDPOINT)
# ==================================

@router.post("/validar-ruc", response_model=ValidarRUCResponse)
def validar_ruc(
    request: ValidarRUCRequest,
    db: Session = Depends(get_db)
):
    """
    Valida un RUC y retorna la empresa si existe en la BD
    
    **Flujo:**
    1. Usuario ingresa RUC
    2. Backend valida formato (11 dígitos)
    3. Busca en BD si existe
    4. Retorna empresa o indica que no existe
    """
    # Buscar empresa por RUC
    empresa = db.query(Empresa).filter(
        Empresa.ruc == request.ruc,
        Empresa.deleted_at.is_(None)
    ).first()
    
    if empresa:
        return ValidarRUCResponse(
            ruc=request.ruc,
            existe=True,
            empresa=EmpresaSimple.model_validate(empresa),
            mensaje=f"Empresa encontrada: {empresa.razon_social}"
        )
    else:
        return ValidarRUCResponse(
            ruc=request.ruc,
            existe=False,
            empresa=None,
            mensaje="Empresa no registrada. Debe agregarse manualmente."
        )

@router.get("/buscar", response_model=List[EmpresaSimple])
def buscar_empresas(
    q: str = Query(..., min_length=3, description="Texto de búsqueda (mínimo 3 caracteres)"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    db: Session = Depends(get_db)
):
    """
    Busca empresas por RUC o razón social
    
    **Parámetros:**
    - q: Texto de búsqueda (RUC parcial o nombre)
    - limit: Cantidad máxima de resultados (default: 10)
    
    **Retorna:**
    - Lista de empresas que coinciden con la búsqueda
    """
    # Buscar por RUC o razón social
    query = db.query(Empresa).filter(
        
        or_(
            Empresa.ruc.ilike(f"%{q}%"),
            Empresa.razon_social.ilike(f"%{q}%")
        )
    ).order_by(Empresa.razon_social)
    
    empresas = query.limit(limit).all()
    
    return empresas


# ==================================
# LISTAR EMPRESAS
# ==================================

@router.get("/", response_model=List[EmpresaSimple])
def listar_empresas(
    skip: int = 0,
    limit: int = 100,
    activas: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lista todas las empresas
    
    **Parámetros:**
    - skip: Número de registros a saltar (paginación)
    - limit: Número máximo de registros a retornar
    - activas: Si True, solo retorna empresas activas (no eliminadas)
    """
    query = db.query(Empresa)
    
    if activas:
        query = query.filter(Empresa.deleted_at.is_(None))
    
    empresas = query.offset(skip).limit(limit).all()
    return empresas


# ==================================
# OBTENER EMPRESA POR ID
# ==================================

@router.get("/{empresa_id}", response_model=EmpresaSchema)
def obtener_empresa(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene una empresa por su ID"""
    empresa = db.query(Empresa).filter(
        Empresa.id == empresa_id,
        Empresa.deleted_at.is_(None)
    ).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Empresa con ID {empresa_id} no encontrada"
        )
    
    return empresa


# ==================================
# OBTENER EMPRESA POR RUC
# ==================================

@router.get("/ruc/{ruc}", response_model=EmpresaSchema)
def obtener_empresa_por_ruc(
    ruc: str,
    db: Session = Depends(get_db)
):
    """Obtiene una empresa por su RUC"""
    if len(ruc) != 11 or not ruc.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC debe tener 11 dígitos"
        )
    
    empresa = db.query(Empresa).filter(
        Empresa.ruc == ruc,
        Empresa.deleted_at.is_(None)
    ).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Empresa con RUC {ruc} no encontrada"
        )
    
    return empresa


# ==================================
# CREAR EMPRESA
# ==================================

@router.post("/", response_model=EmpresaSchema, status_code=status.HTTP_201_CREATED)
def crear_empresa(
    empresa: EmpresaCreate,
    db: Session = Depends(get_db)
):
    """
    Crea una nueva empresa
    
    **Validaciones:**
    - RUC no debe existir previamente
    - RUC debe tener 11 dígitos
    """
    # Verificar que no exista empresa con el mismo RUC
    empresa_existente = db.query(Empresa).filter(
        Empresa.ruc == empresa.ruc
    ).first()
    
    if empresa_existente:
        if empresa_existente.deleted_at is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una empresa con RUC {empresa.ruc}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Existe una empresa eliminada con RUC {empresa.ruc}. Contacte al administrador."
            )
    
    # Crear nueva empresa
    nueva_empresa = Empresa(**empresa.model_dump())
    db.add(nueva_empresa)
    db.commit()
    db.refresh(nueva_empresa)
    
    return nueva_empresa


# ==================================
# ACTUALIZAR EMPRESA
# ==================================

@router.put("/{empresa_id}", response_model=EmpresaSchema)
def actualizar_empresa(
    empresa_id: int,
    empresa_update: EmpresaUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza los datos de una empresa"""
    # Buscar empresa
    empresa = db.query(Empresa).filter(
        Empresa.id == empresa_id,
        Empresa.deleted_at.is_(None)
    ).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Empresa con ID {empresa_id} no encontrada"
        )
    
    # Actualizar solo los campos que se enviaron
    update_data = empresa_update.model_dump(exclude_unset=True)
    
    # Si se intenta cambiar el RUC, verificar que no exista
    if "ruc" in update_data and update_data["ruc"] != empresa.ruc:
        ruc_existente = db.query(Empresa).filter(
            Empresa.ruc == update_data["ruc"],
            Empresa.id != empresa_id
        ).first()
        
        if ruc_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otra empresa con RUC {update_data['ruc']}"
            )
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(empresa, field, value)
    
    db.commit()
    db.refresh(empresa)
    
    return empresa


# ==================================
# ELIMINAR EMPRESA (SOFT DELETE)
# ==================================

@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    """
    Elimina una empresa (soft delete)
    
    **Nota:** No se eliminan los documentos asociados
    """
    empresa = db.query(Empresa).filter(
        Empresa.id == empresa_id,
        Empresa.deleted_at.is_(None)
    ).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Empresa con ID {empresa_id} no encontrada"
        )
    
    # Soft delete
    from datetime import datetime
    empresa.deleted_at = datetime.now()
    empresa.deleted_by = "admin"
    
    db.commit()
    
    return None


# ==================================
# BUSCAR EMPRESAS
# ==================================

@router.get("/buscar/", response_model=List[EmpresaSimple])
def buscar_empresas(
    q: str,
    db: Session = Depends(get_db)
):
    """
    Busca empresas por RUC o razón social
    
    **Parámetro:**
    - q: Texto a buscar (mínimo 3 caracteres)
    """
    if len(q) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La búsqueda debe tener al menos 3 caracteres"
        )
    
    # Buscar por RUC o razón social
    empresas = db.query(Empresa).filter(
        Empresa.deleted_at.is_(None),
        (
            Empresa.ruc.ilike(f"%{q}%") |
            Empresa.razon_social.ilike(f"%{q}%")
        )
    ).limit(10).all()
    
    return empresas