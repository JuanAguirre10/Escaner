-- =========================================
-- SCRIPT PARA CORREGIR ENCODING UTF-8
-- =========================================

-- Conectar a la base de datos
\c documentos_db;

-- Establecer encoding del cliente
SET CLIENT_ENCODING TO 'UTF8';

-- Actualizar tipos de documento con caracteres correctos
UPDATE documentos_db.tipos_documento 
SET nombre = 'Factura Electrónica',
    descripcion = 'Factura electrónica emitida por proveedores'
WHERE codigo = 'FACTURA';

UPDATE documentos_db.tipos_documento 
SET nombre = 'Guía de Remisión Electrónica',
    descripcion = 'Guía de remisión para traslado de mercancías'
WHERE codigo = 'GUIA_REMISION';

UPDATE documentos_db.tipos_documento 
SET nombre = 'Orden de Venta',
    descripcion = 'Orden de venta emitida al cliente'
WHERE codigo = 'ORDEN_VENTA';

-- Verificar cambios
SELECT id, codigo, nombre, descripcion, activo 
FROM documentos_db.tipos_documento 
ORDER BY id;

\echo '✅ Encoding de tipos de documento corregido'
