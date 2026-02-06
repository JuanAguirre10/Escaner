"""
Importar todos los schemas aquí
"""

from app.schemas.proveedor import (
    Proveedor,
    ProveedorCreate,
    ProveedorUpdate,
    ProveedorInDB,
    ProveedorSimple,
)

from app.schemas.item import (
    FacturaItem,
    FacturaItemCreate,
    FacturaItemUpdate,
    FacturaItemInDB,
    FacturaItemSimple,
)

from app.schemas.factura import (
    Factura,
    FacturaCreate,
    FacturaUpdate,
    FacturaInDB,
    FacturaSimple,
    FacturaOCRResponse,
)

__all__ = [
    # Proveedor
    "Proveedor",
    "ProveedorCreate",
    "ProveedorUpdate",
    "ProveedorInDB",
    "ProveedorSimple",
    # Item
    "FacturaItem",
    "FacturaItemCreate",
    "FacturaItemUpdate",
    "FacturaItemInDB",
    "FacturaItemSimple",
    # Factura
    "Factura",
    "FacturaCreate",
    "FacturaUpdate",
    "FacturaInDB",
    "FacturaSimple",
    "FacturaOCRResponse",
]