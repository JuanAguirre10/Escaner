export const ESTADOS_FACTURA = {
  PENDIENTE: 'pendiente_validacion',
  VALIDADA: 'validada',
  RECHAZADA: 'rechazada',
  DUPLICADA: 'duplicada',
};

export const MONEDAS = {
  PEN: 'PEN',
  USD: 'USD',
};

export const EXTENSIONES_PERMITIDAS = ['pdf', 'png', 'jpg', 'jpeg'];

export const TAMANO_MAXIMO_MB = 10;

export const MENSAJES = {
  UPLOAD_SUCCESS: 'Factura procesada exitosamente',
  UPLOAD_ERROR: 'Error al procesar la factura',
  VALIDAR_SUCCESS: 'Factura validada correctamente',
  VALIDAR_ERROR: 'Error al validar la factura',
  RECHAZAR_SUCCESS: 'Factura rechazada',
  RECHAZAR_ERROR: 'Error al rechazar la factura',
  ACTUALIZAR_SUCCESS: 'Factura actualizada correctamente',
  ACTUALIZAR_ERROR: 'Error al actualizar la factura',
};