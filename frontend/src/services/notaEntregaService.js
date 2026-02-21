import api from './api';

export const notaEntregaService = {
  /**
   * Lista todas las notas de entrega
   */
  async listar(params = {}) {
    const response = await api.get('/notas-entrega/', { params });
    return response.data;
  },

  /**
   * Obtiene una nota de entrega por ID
   */
  async obtener(id) {
    const response = await api.get(`/notas-entrega/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva nota de entrega
   */
  async crear(data) {
    const response = await api.post('/notas-entrega/', data);
    return response.data;
  },

  /**
   * Actualiza una nota de entrega
   */
  async actualizar(id, data) {
    const response = await api.put(`/notas-entrega/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una nota de entrega
   */
  async eliminar(id) {
    const response = await api.delete(`/notas-entrega/${id}`);
    return response.data;
  },

  /**
   * Obtiene notas asociadas a una orden de compra
   */
  async obtenerPorOrden(numeroOrden) {
    const response = await api.get(`/notas-entrega/por-orden/${numeroOrden}`);
    return response.data;
  },
};