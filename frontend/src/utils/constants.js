export const ESTADOS_DOCUMENTO = {
  PENDIENTE: 'pendiente_validacion',
  VALIDADA: 'validada',
  RECHAZADA: 'rechazada',
  DUPLICADA: 'duplicada',
};

// Alias para compatibilidad
export const ESTADOS_FACTURA = ESTADOS_DOCUMENTO;

export const TIPOS_DOCUMENTO = {
  FACTURA: 1,
  GUIA_REMISION: 2,
  ORDEN_COMPRA: 3,
  NOTA_ENTREGA: 4,
  RECIBO_HONORARIOS: 6,
};

export const MONEDAS = {
  PEN: 'PEN',
  USD: 'USD',
  EUR: 'EUR',
};

export const EXTENSIONES_PERMITIDAS = ['pdf', 'png', 'jpg', 'jpeg'];

export const TAMANO_MAXIMO_MB = 10;

export const MENSAJES = {
  UPLOAD_SUCCESS: 'Documento procesado exitosamente',
  UPLOAD_ERROR: 'Error al procesar el documento',
  VALIDAR_SUCCESS: 'Documento validado correctamente',
  VALIDAR_ERROR: 'Error al validar el documento',
  RECHAZAR_SUCCESS: 'Documento rechazado',
  RECHAZAR_ERROR: 'Error al rechazar el documento',
  ACTUALIZAR_SUCCESS: 'Documento actualizado correctamente',
  ACTUALIZAR_ERROR: 'Error al actualizar el documento',
  RUC_VALIDO: 'RUC válido - Empresa encontrada',
  RUC_INVALIDO: 'RUC no encontrado en la base de datos',
  RUC_ERROR: 'Error al validar RUC',
};

// Tipos de documentos de identidad
export const TIPOS_IDENTIDAD = {
  DNI: 'DNI',
  CARNET_EXTRANJERIA: 'CARNET_EXTRANJERIA',
  PASAPORTE: 'PASAPORTE',
  CPP: 'CPP',
  OTRO: 'OTRO'
};

export const LABELS_IDENTIDAD = {
  DNI: 'DNI',
  CARNET_EXTRANJERIA: 'Carnet de Extranjería',
  PASAPORTE: 'Pasaporte',
  CPP: 'CPP',
  OTRO: 'Otro Documento'
};

// Estados de expediente
export const ESTADOS_EXPEDIENTE = {
  EN_PROCESO: 'en_proceso',
  COMPLETO: 'completo',
  INCOMPLETO: 'incompleto',
  CERRADO_MANUAL: 'cerrado_manual'
};