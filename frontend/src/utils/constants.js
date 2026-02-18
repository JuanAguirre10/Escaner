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
  ORDEN_VENTA: 3,
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