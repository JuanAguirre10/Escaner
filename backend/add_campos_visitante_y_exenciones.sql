-- Migración: Campos de visitante en notas_entrega, documentos_exentos en expedientes
-- y tipo de documento Recibo por Honorarios

ALTER TABLE documentos_db.notas_entrega
    ADD COLUMN IF NOT EXISTS visitante_nombre VARCHAR(200),
    ADD COLUMN IF NOT EXISTS visitante_dni VARCHAR(20),
    ADD COLUMN IF NOT EXISTS visitante_empresa VARCHAR(200);

ALTER TABLE documentos_db.expedientes
    ADD COLUMN IF NOT EXISTS documentos_exentos JSON DEFAULT '[]'::json;

INSERT INTO documentos_db.tipos_documento (id, nombre, descripcion, activo)
VALUES (6, 'Recibo por Honorarios', 'Recibo por Honorarios Electrónico', true)
ON CONFLICT (id) DO NOTHING;
