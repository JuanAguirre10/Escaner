-- =========================================
-- REINSERTAR TIPOS DE DOCUMENTO
-- =========================================

\c documentos_db;

-- Eliminar registros actuales
DELETE FROM documentos_db.tipos_documento;

-- Reiniciar secuencia de IDs
ALTER SEQUENCE documentos_db.tipos_documento_id_seq RESTART WITH 1;

-- Insertar tipos de documento SIN TILDES
INSERT INTO documentos_db.tipos_documento (codigo, nombre, descripcion, activo) VALUES
('FACTURA', 'Factura Electronica', 'Factura electronica emitida por proveedores', true),
('GUIA_REMISION', 'Guia de Remision Electronica', 'Guia de remision para traslado de mercancias', false),
('ORDEN_VENTA', 'Orden de Venta', 'Orden de venta emitida al cliente', false);

-- Verificar
SELECT id, codigo, nombre, activo FROM documentos_db.tipos_documento ORDER BY id;

\echo '✅ Tipos de documento insertados correctamente'
