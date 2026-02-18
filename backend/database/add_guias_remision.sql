-- =========================================
-- AGREGAR TABLA: guias_remision
-- =========================================

\c documentos_db;

CREATE TABLE IF NOT EXISTS documentos_db.guias_remision (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES documentos_db.documentos(id) ON DELETE CASCADE,
    
    -- Datos del traslado
    numero_guia VARCHAR(50) NOT NULL,
    fecha_traslado DATE,
    motivo_traslado VARCHAR(100),
    modalidad_transporte VARCHAR(50),
    
    -- Puntos de partida y llegada
    punto_partida TEXT,
    punto_llegada TEXT,
    
    -- Transportista
    transportista_razon_social VARCHAR(255),
    transportista_ruc VARCHAR(11),
    
    -- Vehículo
    vehiculo_placa VARCHAR(20),
    vehiculo_mtc VARCHAR(50),
    
    -- Conductor
    conductor_nombre VARCHAR(255),
    conductor_dni VARCHAR(8),
    conductor_licencia VARCHAR(20),
    
    -- Carga
    peso_bruto DECIMAL(10, 2),
    unidad_peso VARCHAR(10) DEFAULT 'KGM',
    transbordo_programado BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guias_remision_documento_id ON documentos_db.guias_remision(documento_id);
CREATE INDEX IF NOT EXISTS idx_guias_remision_numero_guia ON documentos_db.guias_remision(numero_guia);

\echo '✅ Tabla guias_remision creada';