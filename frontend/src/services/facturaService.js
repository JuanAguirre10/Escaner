import api from './api';

export const facturaService = {
  /**
   * Obtiene todas las facturas con filtros
   */
  async listar(params = {}) {
    const response = await api.get('/facturas/', { params });
    return response.data;
  },

  /**
   * Obtiene facturas pendientes de validación
   */
  async listarPendientes(params = {}) {
    const response = await api.get('/facturas/pendientes', { params });
    return response.data;
  },

  /**
   * Obtiene una factura por ID
   */
  async obtener(id) {
    const response = await api.get(`/facturas/${id}`);
    return response.data;
  },

  /**
   * Actualiza una factura
   */
  async actualizar(id, data) {
    const response = await api.put(`/facturas/${id}`, data);
    return response.data;
  },

  /**
   * Valida una factura
   */
  async validar(id, observaciones = null) {
    const response = await api.post(`/facturas/${id}/validar`, { observaciones });
    return response.data;
  },

  /**
   * Rechaza una factura
   */
  async rechazar(id, motivo) {
    const response = await api.post(`/facturas/${id}/rechazar`, { motivo });
    return response.data;
  },

  /**
   * Elimina una factura
   */
  async eliminar(id) {
    const response = await api.delete(`/facturas/${id}`);
    return response.data;
  },

  /**
   * Obtiene estadísticas generales
   */
  async estadisticas() {
    const response = await api.get('/facturas/estadisticas');
    return response.data;
  },

  /**
   * Obtiene items de una factura
   */
  async obtenerItems(id) {
    const response = await api.get(`/facturas/${id}/items`);
    return response.data;
  },

  /**
   * Agrega un item a una factura
   */
  async agregarItem(id, item) {
    const response = await api.post(`/facturas/${id}/items`, item);
    return response.data;
  },
};