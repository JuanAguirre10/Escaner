"""
Importar todos los schemas aquí
"""

from app.schemas.tipo_documento import (
    TipoDocumento,
    TipoDocumentoCreate,
    TipoDocumentoUpdate,
    TipoDocumentoInDB,
    TipoDocumentoSimple,
)


from app.schemas.empresa import (
    Empresa,
    EmpresaCreate,
    EmpresaUpdate,
    EmpresaInDB,
    EmpresaSimple,
    ValidarRUCRequest,
    ValidarRUCResponse,
)

from app.schemas.documento_item import (
    DocumentoItem,
    DocumentoItemCreate,
    DocumentoItemUpdate,
    DocumentoItemInDB,
    DocumentoItemSimple,
)

from app.schemas.documento import (
    Documento,
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoInDB,
    DocumentoSimple,
    DocumentoOCRResponse,
)

from app.schemas.guia_remision import (
    GuiaRemisionCreate,
    GuiaRemisionUpdate,
    GuiaRemisionResponse,
)

from app.schemas.orden_compra import (
    OrdenCompraBase,
    OrdenCompraCreate,
    OrdenCompraUpdate,
    OrdenCompraResponse
)

__all__ = [
    # TipoDocumento
    "TipoDocumento",
    "TipoDocumentoCreate",
    "TipoDocumentoUpdate",
    "TipoDocumentoInDB",
    "TipoDocumentoSimple",
    # Empresa
    "Empresa",
    "EmpresaCreate",
    "EmpresaUpdate",
    "EmpresaInDB",
    "EmpresaSimple",
    "ValidarRUCRequest",
    "ValidarRUCResponse",
    # DocumentoItem
    "DocumentoItem",
    "DocumentoItemCreate",
    "DocumentoItemUpdate",
    "DocumentoItemInDB",
    "DocumentoItemSimple",
    # Documento
    "Documento",
    "DocumentoCreate",
    "DocumentoUpdate",
    "DocumentoInDB",
    "DocumentoSimple",
    "DocumentoOCRResponse",


    "GuiaRemisionCreate",
    "GuiaRemisionUpdate",
    "GuiaRemisionResponse",
]