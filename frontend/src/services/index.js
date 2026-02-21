export { default as api } from './api';
export { ocrService } from './ocrService';
export { documentoService, facturaService } from './documentoService';
export { empresaService } from './empresaService';
export { tipoDocumentoService } from './tipoDocumentoService';
export { default as guiaRemisionService } from './guiaRemisionService';
export { notaEntregaService } from './notaEntregaService';
export { expedienteService } from './expedienteService';

// Mantener proveedorService para compatibilidad (es alias de empresaService)
export { empresaService as proveedorService } from './empresaService';