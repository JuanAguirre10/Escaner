/**
 * Formatea un RUC (agrega guiones)
 */
export function formatRuc(ruc) {
  if (!ruc) return '';
  return ruc.replace(/(\d{2})(\d{9})/, '$1-$2');
}

/**
 * Formatea un número de factura
 */
export function formatNumeroFactura(numero) {
  if (!numero) return '';
  return numero;
}

/**
 * Formatea una fecha
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea un monto de dinero
 */
export function formatMoney(amount, currency = 'PEN') {
  if (amount === null || amount === undefined) return '';
  
  const symbol = currency === 'USD' ? '$' : 'S/';
  const formatted = parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol} ${formatted}`;
}

/**
 * Formatea un porcentaje de confianza
 */
export function formatConfianza(confianza) {
  if (!confianza) return '0%';
  return `${parseFloat(confianza).toFixed(1)}%`;
}

/**
 * Obtiene el color según el nivel de confianza
 */
export function getConfianzaColor(confianza) {
  if (!confianza) return 'gray';
  
  const valor = parseFloat(confianza);
  
  if (valor >= 95) return 'green';
  if (valor >= 80) return 'yellow';
  return 'red';
}

/**
 * Formatea el estado de una factura
 */
export function formatEstado(estado) {
  const estados = {
    'pendiente_validacion': 'Pendiente',
    'validada': 'Validada',
    'rechazada': 'Rechazada',
    'duplicada': 'Duplicada',
  };
  
  return estados[estado] || estado;
}

/**
 * Obtiene el color según el estado
 */
export function getEstadoColor(estado) {
  const colores = {
    'pendiente_validacion': 'yellow',
    'validada': 'green',
    'rechazada': 'red',
    'duplicada': 'gray',
  };
  
  return colores[estado] || 'gray';
}