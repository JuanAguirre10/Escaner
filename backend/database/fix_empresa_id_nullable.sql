-- =========================================
-- ARREGLAR: empresa_id debe ser NULLABLE
-- =========================================

\c documentos_db;

-- Hacer empresa_id nullable
ALTER TABLE documentos_db.documentos 
ALTER COLUMN empresa_id DROP NOT NULL;

-- Verificar cambio
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'documentos' 
  AND column_name = 'empresa_id';

\echo '✅ Columna empresa_id ahora es nullable'
