-- ============================================================================
-- SISTEMA DE GESTIÓN DE DOCUMENTOS CON OCR
-- Base de datos: PostgreSQL 18
-- Nombre: documentos_db
-- Autor: Juan Aguirre
-- Fecha: Febrero 2026
-- Versión: 2.0 (Migrado desde facturas_db)
-- ============================================================================

-- ============================================================================
-- 1. CREAR BASE DE DATOS
-- ============================================================================

-- Ejecutar como usuario postgres:
DROP DATABASE IF EXISTS documentos_db;
CREATE DATABASE documentos_db;

-- Conectar a la nueva base de datos
\c documentos_db

-- ============================================================================
-- 2. CREAR SCHEMA
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS documentos_db;
SET search_path TO documentos_db;

-- ============================================================================
-- 3. TABLA: tipos_documento
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_db.tipos_documento (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- FACTURA, GUIA_REMISION, ORDEN_VENTA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tipos_documento_codigo ON documentos_db.tipos_documento(codigo);
CREATE INDEX idx_tipos_documento_activo ON documentos_db.tipos_documento(activo);

COMMENT ON TABLE documentos_db.tipos_documento IS 'Catálogo de tipos de documentos (Factura, Guía Remisión, Orden Venta)';

-- ============================================================================
-- 4. TABLA: empresas (antes proveedores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_db.empresas (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(500) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    
    -- Metadatos
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

-- Índices para empresas
CREATE INDEX idx_empresas_ruc ON documentos_db.empresas(ruc);
CREATE INDEX idx_empresas_razon_social ON documentos_db.empresas(razon_social);
CREATE INDEX idx_empresas_deleted_at ON documentos_db.empresas(deleted_at);

COMMENT ON TABLE documentos_db.empresas IS 'Catálogo de empresas proveedoras que emiten documentos';
COMMENT ON COLUMN documentos_db.empresas.ruc IS 'RUC de la empresa (11 dígitos)';
COMMENT ON COLUMN documentos_db.empresas.razon_social IS 'Nombre completo de la empresa';

-- ============================================================================
-- 5. TABLA: documentos (antes facturas - ahora más genérica)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_db.documentos (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    
    -- Relación con empresa y tipo de documento
    empresa_id INTEGER REFERENCES documentos_db.empresas(id) ON DELETE SET NULL,
    tipo_documento_id INTEGER REFERENCES documentos_db.tipos_documento(id) ON DELETE SET NULL,
    
    -- Datos del documento
    numero_documento VARCHAR(50) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    correlativo VARCHAR(20) NOT NULL,
    tipo_comprobante VARCHAR(50) DEFAULT 'FACTURA',
    guia_remision VARCHAR(50),
    
    -- Fechas
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    
    -- Datos del emisor (empresa)
    ruc_emisor VARCHAR(11) NOT NULL,
    razon_social_emisor VARCHAR(500) NOT NULL,
    direccion_emisor TEXT,
    telefono_emisor VARCHAR(50),
    email_emisor VARCHAR(255),
    
    -- Datos del cliente (nuestra empresa SUPERVAN)
    ruc_cliente VARCHAR(11),
    razon_social_cliente VARCHAR(500),
    direccion_cliente TEXT,
    
    -- Datos comerciales
    orden_compra VARCHAR(50),
    
    -- Montos
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    igv DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    moneda VARCHAR(3) DEFAULT 'PEN', -- PEN, USD, EUR
    
    -- Forma de pago
    forma_pago VARCHAR(50), -- CONTADO, CREDITO
    condicion_pago VARCHAR(200), -- PAGO ADELANTADO, FACTURA A 30 DIAS, etc.
    
    -- Archivos
    archivo_original_nombre VARCHAR(255),
    archivo_original_url TEXT,
    archivo_original_tipo VARCHAR(10), -- pdf, png, jpg, jpeg, webp
    archivo_original_size INTEGER,
    
    -- Datos OCR
    texto_ocr_completo TEXT,
    datos_ocr_json TEXT,
    confianza_ocr_promedio DECIMAL(5,2),
    procesado_con VARCHAR(50), -- claude_vision, google_vision, manual
    tiempo_procesamiento_segundos DECIMAL(8,2),
    
    -- Estado y validación
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente_validacion',
    -- Estados: pendiente_validacion, validada, rechazada, duplicada
    
    validado BOOLEAN DEFAULT FALSE,
    validado_por VARCHAR(100),
    validado_en TIMESTAMP,
    
    rechazado_por VARCHAR(100),
    rechazado_en TIMESTAMP,
    motivo_rechazo TEXT,
    
    -- Sistema de duplicados
    es_duplicada BOOLEAN DEFAULT FALSE,
    documento_original_id INTEGER REFERENCES documentos_db.documentos(id) ON DELETE SET NULL,
    
    -- Observaciones
    observaciones TEXT,
    notas_internas TEXT,
    
    -- Sistema de versiones
    version INTEGER NOT NULL DEFAULT 1,
    es_version_actual BOOLEAN DEFAULT TRUE,
    version_anterior_id INTEGER REFERENCES documentos_db.documentos(id) ON DELETE SET NULL,
    motivo_nueva_version TEXT,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'admin',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'admin',
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

-- Índices para documentos
CREATE INDEX idx_documentos_numero ON documentos_db.documentos(numero_documento);
CREATE INDEX idx_documentos_empresa ON documentos_db.documentos(empresa_id);
CREATE INDEX idx_documentos_tipo_documento ON documentos_db.documentos(tipo_documento_id);
CREATE INDEX idx_documentos_ruc_emisor ON documentos_db.documentos(ruc_emisor);
CREATE INDEX idx_documentos_fecha_emision ON documentos_db.documentos(fecha_emision);
CREATE INDEX idx_documentos_estado ON documentos_db.documentos(estado);
CREATE INDEX idx_documentos_es_duplicada ON documentos_db.documentos(es_duplicada);
CREATE INDEX idx_documentos_validado ON documentos_db.documentos(validado);
CREATE INDEX idx_documentos_uuid ON documentos_db.documentos(uuid);
CREATE INDEX idx_documentos_deleted_at ON documentos_db.documentos(deleted_at);
CREATE INDEX idx_documentos_version_actual ON documentos_db.documentos(es_version_actual);

COMMENT ON TABLE documentos_db.documentos IS 'Documentos procesados con OCR (Facturas, Guías, Órdenes)';
COMMENT ON COLUMN documentos_db.documentos.estado IS 'pendiente_validacion, validada, rechazada, duplicada';
COMMENT ON COLUMN documentos_db.documentos.confianza_ocr_promedio IS 'Precisión del OCR de 0 a 100';
COMMENT ON COLUMN documentos_db.documentos.es_duplicada IS 'TRUE si ya existe otro documento con el mismo número';
COMMENT ON COLUMN documentos_db.documentos.version IS 'Número de versión (1, 2, 3...)';

-- ============================================================================
-- 6. TABLA: documentos_items (items de documentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_db.documentos_items (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES documentos_db.documentos(id) ON DELETE CASCADE,
    
    -- Orden y descripción
    orden INTEGER NOT NULL,
    codigo_producto VARCHAR(100),
    descripcion TEXT NOT NULL,
    detalle_adicional TEXT,
    
    -- Cantidades
    cantidad DECIMAL(15,4) NOT NULL DEFAULT 1.0000,
    unidad_medida VARCHAR(10) DEFAULT 'UND', -- UND, GL, KG, M, etc.
    
    -- Precios
    precio_unitario DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    valor_venta DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Cantidad × Precio (sin descuento)
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- Valor Venta - Descuento
    
    -- Impuestos (por item)
    igv_item DECIMAL(15,2) DEFAULT 0.00,
    total_item DECIMAL(15,2) DEFAULT 0.00, -- Valor Total + IGV
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para documentos_items
CREATE INDEX idx_items_documento ON documentos_db.documentos_items(documento_id);
CREATE INDEX idx_items_orden ON documentos_db.documentos_items(documento_id, orden);
CREATE INDEX idx_items_codigo ON documentos_db.documentos_items(codigo_producto);

COMMENT ON TABLE documentos_db.documentos_items IS 'Items/productos de cada documento';
COMMENT ON COLUMN documentos_db.documentos_items.valor_venta IS 'Cantidad × Precio Unitario (sin descuento)';
COMMENT ON COLUMN documentos_db.documentos_items.valor_total IS 'Valor Venta - (Valor Venta × Descuento%)';
COMMENT ON COLUMN documentos_db.documentos_items.descuento_porcentaje IS 'Porcentaje de descuento (0-100)';

-- ============================================================================
-- 7. TABLA: logs_auditoria
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_db.logs_auditoria (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER REFERENCES documentos_db.documentos(id) ON DELETE CASCADE,
    accion VARCHAR(50) NOT NULL, -- CREAR, ACTUALIZAR, VALIDAR, RECHAZAR, ELIMINAR
    usuario VARCHAR(100),
    datos_anteriores TEXT, -- JSON con los datos antes del cambio
    datos_nuevos TEXT, -- JSON con los datos después del cambio
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_documento ON documentos_db.logs_auditoria(documento_id);
CREATE INDEX idx_auditoria_accion ON documentos_db.logs_auditoria(accion);
CREATE INDEX idx_auditoria_fecha ON documentos_db.logs_auditoria(created_at);

COMMENT ON TABLE documentos_db.logs_auditoria IS 'Registro de todas las acciones sobre documentos';

-- ============================================================================
-- 8. TRIGGERS - Actualización automática de updated_at
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION documentos_db.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para tipos_documento
CREATE TRIGGER update_tipos_documento_updated_at 
    BEFORE UPDATE ON documentos_db.tipos_documento
    FOR EACH ROW
    EXECUTE FUNCTION documentos_db.update_updated_at_column();

-- Trigger para empresas
CREATE TRIGGER update_empresas_updated_at 
    BEFORE UPDATE ON documentos_db.empresas
    FOR EACH ROW
    EXECUTE FUNCTION documentos_db.update_updated_at_column();

-- Trigger para documentos
CREATE TRIGGER update_documentos_updated_at 
    BEFORE UPDATE ON documentos_db.documentos
    FOR EACH ROW
    EXECUTE FUNCTION documentos_db.update_updated_at_column();

-- Trigger para documentos_items
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON documentos_db.documentos_items
    FOR EACH ROW
    EXECUTE FUNCTION documentos_db.update_updated_at_column();

-- ============================================================================
-- 9. DATOS DE EJEMPLO
-- ============================================================================

-- Insertar tipos de documento
INSERT INTO documentos_db.tipos_documento (codigo, nombre, descripcion, activo) VALUES
    ('FACTURA', 'Factura Electrónica', 'Comprobante de pago que acredita la transferencia de bienes o servicios', TRUE),
    ('GUIA_REMISION', 'Guía de Remisión Electrónica', 'Documento que sustenta el traslado de bienes', FALSE),
    ('ORDEN_VENTA', 'Orden de Venta', 'Documento que registra la solicitud de compra', FALSE);

-- Insertar empresas proveedoras
INSERT INTO documentos_db.empresas (ruc, razon_social, direccion, telefono, email) VALUES 
    -- Empresa cliente (SUPERVAN)
    ('20516185211', 
     'SUPERVAN S.A.C.', 
     'AV. ELMER FAUCETT 5104 URB. LAS FRESAS', 
     '014567890', 
     'ventas@supervan.com'),
    
    -- Proveedores
    ('20507248323', 
     'SERVIFRENOS AMERICA', 
     'Av. Angelica Gamarra nro. 2350 Urb. Los Libertadores (esquina Vizcarra Guzmán y Av. Angelica Gamarra) Lima - Lima - San Martin de Porres', 
     '531-5734', 
     'ventassmp@frenosaamerica.com'),
    
    ('20516587360', 
     'INVERSIONES DIFE COLORS S.A.C.', 
     'Av.Tomas Valle Mz.K lt.24B Urb.Jorge Chavez 1 Etapa PRV.CONST.CALLAO - PRV.CONST.CALLAO CALLAO', 
     '575-2154', 
     'grupo_difecolors@yahoo.com'),
    
    ('20102306598', 
     'VISTONY COMPAÑIA INDUSTRIAL DEL PERU SOCIEDAD ANONIMA CERRADA', 
     'Mz. B1 Lote 01 PQJE. IND. DE ANCON (ALT. KM 46.5 PAN.NORTE) LIMA-LIMA-ANCON', 
     '015521325', 
     'ventas@vistony.com'),
    
    ('20101759688', 
     'M&M REPUESTOS Y SERVICIOS S.A.', 
     'AV. NICOLAS ARRIOLA NRO. 1723 URB. PORTIS LIMA - LIMA - LA VICTORIA', 
     '(511) 613-1500', 
     'ventas@mymrepuestos.com'),
    
    ('20600045521', 
     'INTERNATIONAL CAMIONES DEL PERU S.A.', 
     'AV. DOMINGO ORUE, Nro. 973, SURQUILLO, SURQUILLO Perú, LIMA', 
     '604-3360', 
     'ventas@internationalcamiones.com.pe');

-- ============================================================================
-- 10. VISTAS ÚTILES
-- ============================================================================

-- Vista: Documentos con datos completos
CREATE OR REPLACE VIEW documentos_db.v_documentos_completos AS
SELECT 
    d.id,
    d.uuid,
    d.numero_documento,
    d.fecha_emision,
    d.fecha_vencimiento,
    d.total,
    d.moneda,
    d.estado,
    d.es_duplicada,
    d.confianza_ocr_promedio,
    e.ruc AS empresa_ruc,
    e.razon_social AS empresa_razon_social,
    e.email AS empresa_email,
    td.codigo AS tipo_documento_codigo,
    td.nombre AS tipo_documento_nombre,
    (SELECT COUNT(*) FROM documentos_db.documentos_items WHERE documento_id = d.id) AS cantidad_items,
    d.created_at,
    d.validado,
    d.validado_en
FROM documentos_db.documentos d
LEFT JOIN documentos_db.empresas e ON d.empresa_id = e.id
LEFT JOIN documentos_db.tipos_documento td ON d.tipo_documento_id = td.id
WHERE d.deleted_at IS NULL
ORDER BY d.created_at DESC;

COMMENT ON VIEW documentos_db.v_documentos_completos IS 'Vista con documentos y datos básicos de empresa y tipo documento';

-- Vista: Estadísticas por empresa
CREATE OR REPLACE VIEW documentos_db.v_stats_por_empresa AS
SELECT 
    e.id,
    e.ruc,
    e.razon_social,
    COUNT(d.id) AS total_documentos,
    COUNT(CASE WHEN d.estado = 'validada' THEN 1 END) AS documentos_validados,
    COUNT(CASE WHEN d.estado = 'pendiente_validacion' THEN 1 END) AS documentos_pendientes,
    COUNT(CASE WHEN d.es_duplicada = TRUE THEN 1 END) AS documentos_duplicados,
    SUM(d.total) AS monto_total,
    AVG(d.confianza_ocr_promedio) AS confianza_promedio
FROM documentos_db.empresas e
LEFT JOIN documentos_db.documentos d ON e.id = d.empresa_id AND d.deleted_at IS NULL
GROUP BY e.id, e.ruc, e.razon_social
ORDER BY total_documentos DESC;

COMMENT ON VIEW documentos_db.v_stats_por_empresa IS 'Estadísticas de documentos agrupadas por empresa';

-- Vista: Estadísticas por tipo de documento
CREATE OR REPLACE VIEW documentos_db.v_stats_por_tipo AS
SELECT 
    td.id,
    td.codigo,
    td.nombre,
    td.activo,
    COUNT(d.id) AS total_documentos,
    COUNT(CASE WHEN d.estado = 'validada' THEN 1 END) AS documentos_validados,
    COUNT(CASE WHEN d.estado = 'pendiente_validacion' THEN 1 END) AS documentos_pendientes,
    SUM(d.total) AS monto_total,
    AVG(d.confianza_ocr_promedio) AS confianza_promedio
FROM documentos_db.tipos_documento td
LEFT JOIN documentos_db.documentos d ON td.id = d.tipo_documento_id AND d.deleted_at IS NULL
GROUP BY td.id, td.codigo, td.nombre, td.activo
ORDER BY total_documentos DESC;

COMMENT ON VIEW documentos_db.v_stats_por_tipo IS 'Estadísticas de documentos agrupadas por tipo';

-- ============================================================================
-- 11. PERMISOS (Ajustar según usuario)
-- ============================================================================

-- Si tienes un usuario específico:
-- GRANT ALL PRIVILEGES ON SCHEMA documentos_db TO tu_usuario;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA documentos_db TO tu_usuario;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA documentos_db TO tu_usuario;

-- ============================================================================
-- 12. CONSULTAS ÚTILES PARA VERIFICACIÓN
-- ============================================================================

-- Ver todas las empresas
-- SELECT * FROM documentos_db.empresas ORDER BY razon_social;

-- Ver tipos de documento
-- SELECT * FROM documentos_db.tipos_documento;

-- Ver documentos completos
-- SELECT * FROM documentos_db.v_documentos_completos LIMIT 10;

-- Ver estadísticas por empresa
-- SELECT * FROM documentos_db.v_stats_por_empresa;

-- Ver estadísticas por tipo de documento
-- SELECT * FROM documentos_db.v_stats_por_tipo;

-- Verificar estructura de tablas
-- \dt documentos_db.*
-- \d+ documentos_db.documentos
-- \d+ documentos_db.documentos_items
-- \d+ documentos_db.empresas

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar que todo se creó correctamente:
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'BASE DE DATOS DOCUMENTOS_DB CREADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - tipos_documento (3 registros)';
    RAISE NOTICE '  - empresas (6 registros)';
    RAISE NOTICE '  - documentos (0 registros)';
    RAISE NOTICE '  - documentos_items (0 registros)';
    RAISE NOTICE '  - logs_auditoria (0 registros)';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Vistas creadas:';
    RAISE NOTICE '  - v_documentos_completos';
    RAISE NOTICE '  - v_stats_por_empresa';
    RAISE NOTICE '  - v_stats_por_tipo';
    RAISE NOTICE '============================================';
END $$;